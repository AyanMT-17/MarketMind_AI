import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import Groq from 'groq-sdk';
import nodemailer from 'nodemailer';
import {
  APIIntegration,
  Analytics,
  Chatbot,
  Conversation,
  User,
  AdCampaign,
  BusinessMetrics,
  BusinessPrediction,
  EmailSettings,
  AgentRun
} from '../models/database.js';

const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

const getGroqClient = () => {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }

  return new Groq({ apiKey: process.env.GROQ_API_KEY });
};

const ensureObjectIdValue = (value) => value?.toString?.() || String(value);

const extractLeadDetails = (text) => {
  const safeText = text || '';
  const emailMatch = safeText.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
  const phoneMatch = safeText.match(/(?:\+?\d[\d\s\-()]{7,}\d)/);
  const companyMatch = safeText.match(/(?:company|from)\s+([A-Za-z0-9&.,' -]{2,60})/i);
  const nameMatch = safeText.match(/(?:my name is|i am|this is)\s+([A-Za-z][A-Za-z' -]{1,40})/i);

  return {
    email: emailMatch?.[0] || '',
    phone: phoneMatch?.[0] || '',
    company: companyMatch?.[1]?.trim() || '',
    name: nameMatch?.[1]?.trim() || ''
  };
};

const detectEscalationIntent = (chatbot, message) => {
  const keywords = chatbot.automation?.escalationKeywords || [];
  const lowerMessage = message.toLowerCase();
  return keywords.some((keyword) => lowerMessage.includes(String(keyword).toLowerCase()));
};

const buildBusinessContext = (chatbot) => {
  const profile = chatbot.businessProfile || {};
  const automation = chatbot.automation || {};
  const lines = [];

  if (profile.businessName) lines.push(`Business name: ${profile.businessName}`);
  if (profile.industry) lines.push(`Industry: ${profile.industry}`);
  if (profile.website) lines.push(`Website: ${profile.website}`);
  if (profile.targetAudience) lines.push(`Target audience: ${profile.targetAudience}`);
  if (profile.valueProposition) lines.push(`Value proposition: ${profile.valueProposition}`);
  if (profile.goals?.length) lines.push(`Business goals: ${profile.goals.join(', ')}`);
  if (profile.offerings?.length) lines.push(`Products or services: ${profile.offerings.join(', ')}`);
  if (profile.supportChannels?.length) lines.push(`Human support channels: ${profile.supportChannels.join(', ')}`);
  if (profile.knowledgeBaseUrls?.length) lines.push(`Knowledge sources: ${profile.knowledgeBaseUrls.join(', ')}`);
  if (automation.primaryCallToAction) lines.push(`Primary call to action: ${automation.primaryCallToAction}`);
  if (automation.bookingUrl) lines.push(`Booking URL: ${automation.bookingUrl}`);
  if (automation.leadCaptureEnabled) {
    lines.push(`Lead capture is enabled. Collect these fields when useful: ${(automation.leadCaptureFields || []).join(', ')}.`);
  }
  if (automation.escalationEnabled) {
    lines.push(`Escalation is enabled. When the user asks for pricing, demos, contracts, or human support, offer: ${automation.escalationMessage}`);
  }

  return lines;
};

export const utilityService = {
  formatResponse(success, data = null, message = '', errors = []) {
    const response = {
      success: Boolean(success),
      message: message || (success ? 'Operation completed successfully' : 'Operation failed'),
      timestamp: new Date().toISOString()
    };

    if (data !== null && data !== undefined) {
      response.data = data;
    }

    if (errors.length > 0) {
      response.errors = errors;
    }

    return response;
  },

  estimateTokens(text = '') {
    if (!text) {
      return 0;
    }

    return Math.max(1, Math.ceil(text.trim().split(/\s+/).length * 1.3));
  },

  sanitizeString(value, maxLength = 5000) {
    if (typeof value !== 'string') {
      return '';
    }

    return value.trim().replace(/[<>]/g, '').slice(0, maxLength);
  },

  createDeploymentKey() {
    return `mm_${crypto.randomBytes(24).toString('hex')}`;
  },

  buildConversationTitle(message) {
    const clean = utilityService.sanitizeString(message, 80);
    return clean.length > 0 ? clean : 'New Conversation';
  },

  serializeMap(mapLike) {
    if (!mapLike) {
      return {};
    }

    if (mapLike instanceof Map) {
      return Object.fromEntries(mapLike.entries());
    }

    return { ...mapLike };
  },

  async ensureUniqueDeploymentKey() {
    let deploymentKey;
    let exists = true;

    while (exists) {
      deploymentKey = utilityService.createDeploymentKey();
      exists = await Chatbot.exists({ deploymentKey });
    }

    return deploymentKey;
  }
};

export const validationService = {
  validateUser(userData) {
    const errors = [];

    if (!userData) {
      return ['User data is required'];
    }

    const email = userData.email?.trim();
    const password = userData.password || '';
    const firstName = userData.firstName?.trim();
    const lastName = userData.lastName?.trim();

    if (!email) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Valid email address required');
    }

    if (!password) {
      errors.push('Password is required');
    } else if (password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }

    if (!firstName) {
      errors.push('First name is required');
    }

    if (!lastName) {
      errors.push('Last name is required');
    }

    return errors;
  },

  validateChatbot(payload) {
    const errors = [];

    if (!payload) {
      return ['Chatbot data is required'];
    }

    if (!payload.name?.trim()) {
      errors.push('Chatbot name is required');
    }

    if (payload.status && !['draft', 'active', 'inactive'].includes(payload.status)) {
      errors.push('Status must be one of: draft, active, inactive');
    }

    const temperature = payload.config?.temperature;
    if (temperature !== undefined && (Number.isNaN(Number(temperature)) || temperature < 0 || temperature > 2)) {
      errors.push('Temperature must be between 0 and 2');
    }

    const maxTokens = payload.config?.maxTokens;
    if (maxTokens !== undefined && (!Number.isInteger(Number(maxTokens)) || Number(maxTokens) < 1)) {
      errors.push('Max tokens must be a positive integer');
    }

    if (payload.businessProfile?.website && !/^https?:\/\//i.test(payload.businessProfile.website)) {
      errors.push('Business website must start with http:// or https://');
    }

    if (payload.automation?.bookingUrl && !/^https?:\/\//i.test(payload.automation.bookingUrl)) {
      errors.push('Booking URL must start with http:// or https://');
    }

    return errors;
  },

  validateIntegration(payload) {
    const errors = [];

    if (!payload) {
      return ['Integration data is required'];
    }

    if (!payload.chatbotId?.toString?.() && !payload.chatbotId) {
      errors.push('chatbotId is required');
    }

    if (!payload.name?.trim()) {
      errors.push('Integration name is required');
    }

    if (!payload.type || !['rest_api', 'webhook'].includes(payload.type)) {
      errors.push('Integration type must be rest_api or webhook');
    }

    if (!payload.config?.baseUrl?.trim()) {
      errors.push('Integration baseUrl is required');
    }

    if (!Array.isArray(payload.config?.endpoints) || payload.config.endpoints.length === 0) {
      errors.push('At least one integration endpoint is required');
    }

    return errors;
  },

  validateChatMessage(payload) {
    const errors = [];

    if (!payload?.message?.trim()) {
      errors.push('Message is required');
    }

    if (payload?.message && payload.message.length > 10000) {
      errors.push('Message must be 10000 characters or less');
    }

    return errors;
  }
};

export const authService = {
  generateToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  },

  verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
  },

  async authenticate(req, res, next) {
    try {
      const authHeader = req.header('Authorization');

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Authorization header must start with Bearer' });
      }

      const token = authHeader.replace('Bearer ', '');
      const decoded = authService.verifyToken(token);
      const user = await User.findById(decoded.userId);

      if (!user || !user.isActive) {
        return res.status(401).json({ success: false, message: 'Authentication failed' });
      }

      req.user = user;
      return next();
    } catch (error) {
      const message = error.name === 'TokenExpiredError' ? 'Token has expired' : 'Authentication failed';
      return res.status(401).json({ success: false, message });
    }
  }
};

const getChatbotDefaults = (payload = {}) => ({
  description: payload.description?.trim() || '',
  status: payload.status || 'draft',
  config: {
    systemPrompt: payload.config?.systemPrompt?.trim() || 'You are a helpful AI assistant.',
    temperature: payload.config?.temperature ?? 0.7,
    maxTokens: payload.config?.maxTokens ?? 1024,
    model: payload.config?.model?.trim() || DEFAULT_MODEL,
    welcomeMessage: payload.config?.welcomeMessage?.trim() || 'Hello. How can I help you today?'
  },
  businessProfile: {
    businessName: payload.businessProfile?.businessName?.trim() || '',
    industry: payload.businessProfile?.industry?.trim() || '',
    website: payload.businessProfile?.website?.trim() || '',
    targetAudience: payload.businessProfile?.targetAudience?.trim() || '',
    valueProposition: payload.businessProfile?.valueProposition?.trim() || '',
    goals: Array.isArray(payload.businessProfile?.goals) ? payload.businessProfile.goals.filter(Boolean) : [],
    offerings: Array.isArray(payload.businessProfile?.offerings) ? payload.businessProfile.offerings.filter(Boolean) : [],
    supportChannels: Array.isArray(payload.businessProfile?.supportChannels) ? payload.businessProfile.supportChannels.filter(Boolean) : [],
    knowledgeBaseUrls: Array.isArray(payload.businessProfile?.knowledgeBaseUrls) ? payload.businessProfile.knowledgeBaseUrls.filter(Boolean) : []
  },
  automation: {
    leadCaptureEnabled: payload.automation?.leadCaptureEnabled ?? true,
    leadCaptureFields: Array.isArray(payload.automation?.leadCaptureFields) && payload.automation.leadCaptureFields.length > 0
      ? payload.automation.leadCaptureFields.filter(Boolean)
      : ['name', 'email', 'company'],
    primaryCallToAction: payload.automation?.primaryCallToAction?.trim() || 'Book a demo',
    bookingUrl: payload.automation?.bookingUrl?.trim() || '',
    escalationEnabled: payload.automation?.escalationEnabled ?? true,
    escalationMessage: payload.automation?.escalationMessage?.trim() || 'I can connect you with a human teammate if you would like follow-up support.',
    escalationKeywords: Array.isArray(payload.automation?.escalationKeywords) && payload.automation.escalationKeywords.length > 0
      ? payload.automation.escalationKeywords.filter(Boolean)
      : ['pricing', 'demo', 'contract', 'sales', 'human', 'agent', 'support']
  },
  settings: {
    allowedOrigins: Array.isArray(payload.settings?.allowedOrigins) ? payload.settings.allowedOrigins : [],
    requireAuth: payload.settings?.requireAuth ?? true,
    rateLimit: {
      requests: payload.settings?.rateLimit?.requests ?? 60,
      window: payload.settings?.rateLimit?.window ?? 15 * 60 * 1000
    }
  }
});

export const chatbotService = {
  async createChatbot(userId, payload) {
    const chatbot = new Chatbot({
      userId,
      name: payload.name.trim(),
      ...getChatbotDefaults(payload)
    });

    await chatbot.save();
    return chatbot;
  },

  async listChatbots(userId) {
    return Chatbot.find({ userId }).sort({ updatedAt: -1 });
  },

  async getOwnedChatbot(userId, chatbotId) {
    return Chatbot.findOne({ _id: chatbotId, userId });
  },

  async updateConfig(userId, chatbotId, payload) {
    const chatbot = await chatbotService.getOwnedChatbot(userId, chatbotId);
    if (!chatbot) {
      return null;
    }

    const defaults = getChatbotDefaults({
      ...chatbot.toObject(),
      ...payload,
      config: {
        ...chatbot.config.toObject(),
        ...(payload.config || {})
      },
      settings: {
        ...chatbot.settings.toObject(),
        ...(payload.settings || {}),
        rateLimit: {
          ...chatbot.settings.rateLimit.toObject(),
          ...(payload.settings?.rateLimit || {})
        }
      }
    });

    if (payload.name !== undefined) {
      chatbot.name = payload.name.trim();
    }

    chatbot.description = defaults.description;
    chatbot.status = defaults.status;
    chatbot.config = defaults.config;
    chatbot.businessProfile = defaults.businessProfile;
    chatbot.automation = defaults.automation;
    chatbot.settings = defaults.settings;

    await chatbot.save();
    return chatbot;
  },

  async deleteChatbot(userId, chatbotId) {
    const chatbot = await chatbotService.getOwnedChatbot(userId, chatbotId);
    if (!chatbot) {
      return false;
    }

    await Promise.all([
      APIIntegration.deleteMany({ chatbotId: chatbot._id }),
      Conversation.deleteMany({ chatbotId: chatbot._id }),
      Analytics.deleteMany({ chatbotId: chatbot._id })
    ]);

    await chatbot.deleteOne();
    return true;
  },

  async syncChatbotIntegrations(chatbotId) {
    const integrations = await APIIntegration.find({ chatbotId }).sort({ createdAt: -1 });
    await Chatbot.findByIdAndUpdate(chatbotId, {
      $set: {
        integrations: integrations.map((integration) => ({
          integrationId: integration._id,
          name: integration.name,
          type: integration.type
        }))
      }
    });
  },

  async generateDeploymentKey(userId, chatbotId) {
    const chatbot = await chatbotService.getOwnedChatbot(userId, chatbotId);
    if (!chatbot) {
      return null;
    }

    chatbot.deploymentKey = await utilityService.ensureUniqueDeploymentKey();
    await chatbot.save();
    return chatbot.deploymentKey;
  },

  async testIntegrations(userId, chatbotId) {
    const chatbot = await chatbotService.getOwnedChatbot(userId, chatbotId);
    if (!chatbot) {
      return null;
    }

    const integrations = await APIIntegration.find({ chatbotId: chatbot._id }).sort({ createdAt: -1 });
    const results = [];

    for (const integration of integrations) {
      results.push(await integrationService.testIntegration(userId, integration._id));
    }

    return results;
  }
};

export const integrationService = {
  async createIntegration(userId, payload) {
    const chatbot = await chatbotService.getOwnedChatbot(userId, payload.chatbotId);
    if (!chatbot) {
      throw new Error('Chatbot not found');
    }

    const integration = new APIIntegration({
      chatbotId: chatbot._id,
      name: payload.name.trim(),
      type: payload.type,
      config: {
        baseUrl: payload.config.baseUrl.trim(),
        authType: payload.config.authType || 'none',
        authToken: payload.config.authToken || '',
        headers: payload.config.headers || {},
        endpoints: payload.config.endpoints.map((endpoint) => ({
          path: endpoint.path.trim(),
          method: endpoint.method || 'GET',
          description: endpoint.description?.trim() || '',
          headers: endpoint.headers || {},
          authentication: endpoint.authentication || ''
        }))
      }
    });

    await integration.save();
    await chatbotService.syncChatbotIntegrations(chatbot._id);
    return integration;
  },

  async listIntegrations(userId, chatbotId = null) {
    const chatbotQuery = { userId };
    if (chatbotId) {
      chatbotQuery._id = chatbotId;
    }

    const chatbots = await Chatbot.find(chatbotQuery).select('_id');
    const chatbotIds = chatbots.map((chatbot) => chatbot._id);

    return APIIntegration.find({ chatbotId: { $in: chatbotIds } }).sort({ createdAt: -1 });
  },

  async getOwnedIntegration(userId, integrationId) {
    const integration = await APIIntegration.findById(integrationId);
    if (!integration) {
      return null;
    }

    const chatbot = await chatbotService.getOwnedChatbot(userId, integration.chatbotId);
    return chatbot ? integration : null;
  },

  async updateIntegration(userId, integrationId, payload) {
    const integration = await integrationService.getOwnedIntegration(userId, integrationId);
    if (!integration) {
      return null;
    }

    integration.name = payload.name?.trim() || integration.name;
    integration.type = payload.type || integration.type;
    integration.config.baseUrl = payload.config?.baseUrl?.trim() || integration.config.baseUrl;
    integration.config.authType = payload.config?.authType || integration.config.authType;
    integration.config.authToken = payload.config?.authToken ?? integration.config.authToken;
    integration.config.headers = payload.config?.headers || integration.config.headers;

    if (Array.isArray(payload.config?.endpoints) && payload.config.endpoints.length > 0) {
      integration.config.endpoints = payload.config.endpoints.map((endpoint) => ({
        path: endpoint.path.trim(),
        method: endpoint.method || 'GET',
        description: endpoint.description?.trim() || '',
        headers: endpoint.headers || {},
        authentication: endpoint.authentication || ''
      }));
    }

    await integration.save();
    await chatbotService.syncChatbotIntegrations(integration.chatbotId);
    return integration;
  },

  async deleteIntegration(userId, integrationId) {
    const integration = await integrationService.getOwnedIntegration(userId, integrationId);
    if (!integration) {
      return false;
    }

    const chatbotId = integration.chatbotId;
    await integration.deleteOne();
    await chatbotService.syncChatbotIntegrations(chatbotId);
    return true;
  },

  resolveEndpoint(integration, endpointPath = null) {
    if (!integration.config.endpoints.length) {
      throw new Error('No configured endpoints found for this integration');
    }

    if (!endpointPath) {
      return integration.config.endpoints[0];
    }

    const endpoint = integration.config.endpoints.find((item) => item.path === endpointPath);
    if (!endpoint) {
      throw new Error('Requested integration endpoint was not found');
    }

    return endpoint;
  },

  buildHeaders(integration, endpoint, additionalHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...utilityService.serializeMap(integration.config.headers),
      ...utilityService.serializeMap(endpoint.headers),
      ...additionalHeaders
    };

    if (integration.config.authType === 'bearer' && integration.config.authToken) {
      headers.Authorization = `Bearer ${integration.config.authToken}`;
    }

    return headers;
  },

  async callAPI(integration, endpointPath = null, params = {}, body = null, options = {}) {
    const endpoint = integrationService.resolveEndpoint(integration, endpointPath);
    const headers = integrationService.buildHeaders(integration, endpoint, options.headers);
    const requestConfig = {
      method: endpoint.method,
      url: `${integration.config.baseUrl.replace(/\/$/, '')}${endpoint.path.startsWith('/') ? endpoint.path : `/${endpoint.path}`}`,
      headers,
      timeout: options.timeout ?? 10000,
      params: endpoint.method === 'GET' ? params : undefined,
      data: endpoint.method === 'GET' ? undefined : (body ?? params),
      validateStatus: () => true
    };

    try {
      const response = await axios(requestConfig);
      const normalizedResponse = {
        status: response.status,
        ok: response.status >= 200 && response.status < 300,
        data: response.data
      };

      if (!normalizedResponse.ok) {
        return {
          success: false,
          message: `Upstream API responded with status ${response.status}`,
          response: normalizedResponse
        };
      }

      return {
        success: true,
        response: normalizedResponse
      };
    } catch (error) {
      return {
        success: false,
        message: error.code === 'ECONNABORTED' ? 'Integration request timed out' : 'Integration request failed',
        response: {
          code: error.code || 'UNKNOWN_ERROR',
          details: error.message
        }
      };
    }
  },

  async testIntegration(userId, integrationId, payload = {}) {
    const integration = await integrationService.getOwnedIntegration(userId, integrationId);
    if (!integration) {
      return null;
    }

    const result = await integrationService.callAPI(
      integration,
      payload.endpointPath || null,
      payload.params || {},
      payload.body || null,
      { timeout: payload.timeout || 10000 }
    );

    integration.testResult = {
      success: result.success,
      error: result.success ? '' : result.message,
      response: result.response,
      testedAt: new Date()
    };

    await integration.save();
    return integration.testResult;
  }
};

export const conversationService = {
  async createConversation(chatbotId, userId, openingMessage) {
    const now = new Date();
    const sanitizedMessage = utilityService.sanitizeString(openingMessage, 10000);
    const tokens = utilityService.estimateTokens(sanitizedMessage);

    const conversation = new Conversation({
      chatbotId,
      userId,
      title: utilityService.buildConversationTitle(sanitizedMessage),
      messages: [{
        role: 'user',
        content: sanitizedMessage,
        tokens,
        timestamp: now
      }],
      metadata: {
        apiCallsMade: 0,
        totalTokensUsed: tokens,
        duration: 0,
        startedAt: now,
        lastMessageAt: now,
        leadCaptured: false,
        lead: {
          name: '',
          email: '',
          phone: '',
          company: ''
        },
        escalated: false
      }
    });

    await conversation.save();
    return conversation;
  },

  async getOwnedConversation(userId, conversationId) {
    return Conversation.findOne({ _id: conversationId, userId }).sort({ updatedAt: -1 });
  },

  async getConversationForChat(userId, chatbotId, conversationId, openingMessage) {
    if (!conversationId) {
      return conversationService.createConversation(chatbotId, userId, openingMessage);
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      chatbotId,
      userId
    });

    if (!conversation) {
      return null;
    }

    return conversation;
  },

  async appendMessage(conversation, role, content, tokens = 0, metadataUpdates = {}) {
    const timestamp = new Date();

    conversation.messages.push({
      role,
      content,
      tokens,
      timestamp
    });

    conversation.metadata.totalTokensUsed += tokens;
    conversation.metadata.apiCallsMade += metadataUpdates.apiCallsMade || 0;
    conversation.metadata.lastMessageAt = timestamp;
    conversation.metadata.leadCaptured = metadataUpdates.leadCaptured ?? conversation.metadata.leadCaptured;
    conversation.metadata.escalated = metadataUpdates.escalated ?? conversation.metadata.escalated;
    conversation.metadata.lead = {
      ...(conversation.metadata.lead?.toObject?.() || conversation.metadata.lead || {}),
      ...(metadataUpdates.lead || {})
    };
    conversation.metadata.duration = Math.max(
      0,
      Math.round((timestamp.getTime() - new Date(conversation.metadata.startedAt).getTime()) / 1000)
    );

    await conversation.save();
    return conversation;
  },

  async exportConversation(userId, conversationId) {
    const conversation = await conversationService.getOwnedConversation(userId, conversationId);
    if (!conversation) {
      return null;
    }

    return {
      id: conversation._id,
      chatbotId: conversation.chatbotId,
      userId: conversation.userId,
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      metadata: conversation.metadata,
      messages: conversation.messages.map((message) => ({
        role: message.role,
        content: message.content,
        tokens: message.tokens,
        timestamp: message.timestamp
      }))
    };
  },

  async listRecentConversations(userId, chatbotId, limit = 10) {
    return Conversation.find({ userId, chatbotId })
      .sort({ updatedAt: -1 })
      .limit(limit);
  },

  async buildAnalytics(chatbotId) {
    const conversations = await Conversation.find({ chatbotId }).sort({ updatedAt: -1 });

    const totalConversations = conversations.length;
    const totalMessages = conversations.reduce((sum, conversation) => sum + conversation.messages.length, 0);
    const totalTokensUsed = conversations.reduce((sum, conversation) => sum + (conversation.metadata.totalTokensUsed || 0), 0);
    const apiCallsMade = conversations.reduce((sum, conversation) => sum + (conversation.metadata.apiCallsMade || 0), 0);
    const leadsCaptured = conversations.reduce((sum, conversation) => sum + (conversation.metadata.leadCaptured ? 1 : 0), 0);
    const escalationsTriggered = conversations.reduce((sum, conversation) => sum + (conversation.metadata.escalated ? 1 : 0), 0);
    const avgResponseTime = totalConversations === 0
      ? 0
      : Math.round(conversations.reduce((sum, conversation) => sum + (conversation.metadata.duration || 0), 0) / totalConversations);

    const questionCounts = new Map();
    conversations.forEach((conversation) => {
      conversation.messages
        .filter((message) => message.role === 'user')
        .forEach((message) => {
          const question = message.content.trim();
          if (!question) {
            return;
          }

          questionCounts.set(question, (questionCounts.get(question) || 0) + 1);
        });
    });

    const topQuestions = [...questionCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([question, count]) => ({ question, count }));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const analyticsPayload = {
      chatbotId,
      date: today,
      stats: {
        totalConversations,
        totalMessages,
        totalTokensUsed,
        avgResponseTime,
        apiCallsMade,
        leadsCaptured,
        escalationsTriggered
      },
      topQuestions
    };

    await Analytics.findOneAndUpdate(
      { chatbotId, date: today },
      analyticsPayload,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return analyticsPayload;
  }
};

const buildToolContext = async (chatbot, userMessage) => {
  const integrations = await APIIntegration.find({ chatbotId: chatbot._id }).sort({ createdAt: -1 });
  const enabledIntegrations = integrations.slice(0, 3);
  const integrationSummaries = [];
  let apiCallsMade = 0;

  for (const integration of enabledIntegrations) {
    const result = await integrationService.callAPI(
      integration,
      null,
      { q: userMessage, query: userMessage },
      null,
      { timeout: 6000 }
    );

    if (result.success) {
      integrationSummaries.push({
        name: integration.name,
        type: integration.type,
        response: result.response.data
      });
      apiCallsMade += 1;
    }
  }

  return {
    apiCallsMade,
    integrationSummaries
  };
};

export const aiService = {
  async *streamResponse(chatbot, conversation, userMessage) {
    const groq = getGroqClient();
    const model = chatbot.config?.model || DEFAULT_MODEL;
    const integrationContext = await buildToolContext(chatbot, userMessage);
    const conversationMessages = conversation.messages.map((message) => ({
      role: message.role === 'tool' ? 'assistant' : message.role,
      content: message.content
    }));

    const systemSegments = [
      chatbot.config?.systemPrompt || 'You are a helpful AI assistant.'
    ];

    const businessContext = buildBusinessContext(chatbot);
    if (businessContext.length > 0) {
      systemSegments.push(`Business context:\n${businessContext.join('\n')}`);
    }

    if (integrationContext.integrationSummaries.length > 0) {
      systemSegments.push(
        `External integration context:\n${JSON.stringify(integrationContext.integrationSummaries, null, 2)}`
      );
    }

    if (!groq) {
      const fallback = 'AI provider is not configured yet. Please add GROQ_API_KEY on the server.';
      yield {
        type: 'chunk',
        content: fallback
      };
      yield {
        type: 'done',
        content: fallback,
        tokensUsed: utilityService.estimateTokens(fallback),
        apiCallsMade: integrationContext.apiCallsMade,
        lead: chatbot.automation?.leadCaptureEnabled ? extractLeadDetails(userMessage) : null,
        escalated: chatbot.automation?.escalationEnabled ? detectEscalationIntent(chatbot, userMessage) : false
      };
      return;
    }

    try {
      const stream = await groq.chat.completions.create({
        model,
        temperature: chatbot.config?.temperature ?? 0.7,
        max_tokens: chatbot.config?.maxTokens ?? 1024,
        stream: true,
        messages: [
          { role: 'system', content: systemSegments.join('\n\n') },
          ...conversationMessages.map((message) => ({
            role: message.role,
            content: message.content
          }))
        ]
      });

      let finalText = '';

      for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta?.content || '';
        if (!delta) {
          continue;
        }

        finalText += delta;
        yield {
          type: 'chunk',
          content: delta
        };
      }

      yield {
        type: 'done',
        content: finalText,
        tokensUsed: utilityService.estimateTokens(finalText),
        apiCallsMade: integrationContext.apiCallsMade,
        lead: chatbot.automation?.leadCaptureEnabled ? extractLeadDetails(`${userMessage}\n${finalText}`) : null,
        escalated: chatbot.automation?.escalationEnabled ? detectEscalationIntent(chatbot, userMessage) : false
      };
    } catch (error) {
      yield {
        type: 'error',
        message: 'AI generation failed',
        details: error.message,
        apiCallsMade: integrationContext.apiCallsMade
      };
    }
  }
};

export const adCampaignService = {
  async createCampaign(userId, payload) {
    const campaign = new AdCampaign({
      userId,
      name: payload.name?.trim(),
      description: payload.description?.trim() || '',
      platform: payload.platform,
      budget: payload.budget,
      dailyBudget: payload.dailyBudget || 0,
      targetAudience: payload.targetAudience || {},
      adContent: payload.adContent,
      schedule: payload.schedule,
      status: 'draft'
    });
    await campaign.save();
    return campaign;
  },

  async updateCampaign(userId, campaignId, payload) {
    const campaign = await AdCampaign.findOne({ _id: campaignId, userId });
    if (!campaign) return null;

    campaign.name = payload.name?.trim() || campaign.name;
    campaign.description = payload.description?.trim() || campaign.description;
    campaign.platform = payload.platform || campaign.platform;
    campaign.budget = payload.budget || campaign.budget;
    campaign.dailyBudget = payload.dailyBudget || campaign.dailyBudget;
    campaign.targetAudience = payload.targetAudience || campaign.targetAudience;
    campaign.adContent = payload.adContent || campaign.adContent;
    campaign.schedule = payload.schedule || campaign.schedule;
    campaign.status = payload.status || campaign.status;

    await campaign.save();
    return campaign;
  },

  async getCampaign(userId, campaignId) {
    return AdCampaign.findOne({ _id: campaignId, userId });
  },

  async listCampaigns(userId) {
    return AdCampaign.find({ userId }).sort({ updatedAt: -1 });
  },

  async deleteCampaign(userId, campaignId) {
    const campaign = await AdCampaign.findOne({ _id: campaignId, userId });
    if (!campaign) return false;
    await campaign.deleteOne();
    return true;
  },

  async updatePerformance(campaignId, performanceData) {
    const campaign = await AdCampaign.findById(campaignId);
    if (!campaign) return null;

    campaign.performance = {
      ...campaign.performance,
      ...performanceData
    };

    // Calculate metrics
    if (campaign.performance.impressions > 0) {
      campaign.performance.ctr = (campaign.performance.clicks / campaign.performance.impressions) * 100;
    }
    if (campaign.performance.clicks > 0) {
      campaign.performance.cpc = campaign.performance.spend / campaign.performance.clicks;
    }
    if (campaign.performance.conversions > 0) {
      campaign.performance.cpa = campaign.performance.spend / campaign.performance.conversions;
    }
    if (campaign.performance.spend > 0) {
      campaign.performance.roi = ((campaign.budget - campaign.performance.spend) / campaign.performance.spend) * 100;
    }

    await campaign.save();
    return campaign;
  }
};

export const businessMetricsService = {
  async createMetrics(userId, payload) {
    const metrics = new BusinessMetrics({
      userId,
      businessName: payload.businessName?.trim(),
      metrics: payload.metrics || [],
      notes: payload.notes?.trim() || ''
    });
    await metrics.save();
    return metrics;
  },

  async updateMetrics(userId, metricsId, payload) {
    const metrics = await BusinessMetrics.findOne({ _id: metricsId, userId });
    if (!metrics) return null;

    metrics.businessName = payload.businessName?.trim() || metrics.businessName;
    if (payload.metrics) {
      metrics.metrics = payload.metrics;
    }
    metrics.notes = payload.notes?.trim() || metrics.notes;
    if (payload.csvSource) {
      metrics.csvSource = payload.csvSource;
    }

    await metrics.save();
    return metrics;
  },

  async getMetrics(userId, metricsId) {
    return BusinessMetrics.findOne({ _id: metricsId, userId });
  },

  async listMetrics(userId) {
    return BusinessMetrics.find({ userId }).sort({ createdAt: -1 });
  },

  async deleteMetrics(userId, metricsId) {
    const metrics = await BusinessMetrics.findOne({ _id: metricsId, userId });
    if (!metrics) return false;
    await metrics.deleteOne();
    return true;
  }
};

export const businessPredictionService = {
  async generatePrediction(userId, businessMetricsId, payload) {
    const metrics = await BusinessMetrics.findOne({ _id: businessMetricsId, userId });
    if (!metrics) return null;

    const metricsData = metrics.metrics.map(m => ({
      quarter: m.quarter,
      year: m.year,
      revenue: m.revenue,
      profit: m.profit,
      customers: m.customers
    }));

    const groq = getGroqClient();

    const prompt = `You are a business analyst. Based on the following historical quarterly business metrics, provide a detailed prediction and analysis.

Historical Metrics:
${JSON.stringify(metricsData, null, 2)}

User Request: ${payload.userPrompt}

Please provide:
1. Predicted revenue and profit for the next quarters
2. Growth rate analysis
3. Key trends observed
4. Potential risks
5. Business opportunities
6. Strategic recommendations

Format your response as a structured analysis.`;

    try {
      if (!groq) {
        const predictions = businessPredictionService.parsePredictions(metricsData, payload.predictionPeriod);
        const analysis = businessPredictionService.parseAnalysis(
          `Summary: ${metrics.businessName} shows ${metricsData.length} historical periods. Growth rate and trend analysis suggest a measured continuation of current performance. Risks include cost pressure and demand volatility. Opportunities include increasing customer value and expanding top-performing offers. 1. Review revenue drivers monthly. 2. Protect margins on highest-volume offers. 3. Align sales outreach with the strongest growth segments.`
        );

        const prediction = new BusinessPrediction({
          userId,
          businessMetricsId,
          businessName: metrics.businessName,
          userPrompt: payload.userPrompt,
          predictionPeriod: payload.predictionPeriod || 'next_quarter',
          predictions,
          analysis,
          modelMetadata: {
            modelType: 'time-series-forecasting-fallback',
            dataPointsUsed: metricsData.length,
            accuracy: 0.75,
            lastUpdated: new Date()
          }
        });

        await prediction.save();
        return prediction;
      }

      const stream = await groq.chat.completions.create({
        model: DEFAULT_MODEL,
        temperature: 0.7,
        max_tokens: 2000,
        stream: true,
        messages: [
          {
            role: 'system',
            content: 'You are an expert business analyst providing data-driven predictions and insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      let analysisText = '';
      for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta?.content || '';
        if (delta) {
          analysisText += delta;
        }
      }

      // Parse the analysis
      const predictions = businessPredictionService.parsePredictions(metricsData, payload.predictionPeriod);
      const analysis = businessPredictionService.parseAnalysis(analysisText);

      const prediction = new BusinessPrediction({
        userId,
        businessMetricsId,
        businessName: metrics.businessName,
        userPrompt: payload.userPrompt,
        predictionPeriod: payload.predictionPeriod || 'next_quarter',
        predictions,
        analysis,
        modelMetadata: {
          modelType: 'time-series-forecasting-with-ai-analysis',
          dataPointsUsed: metricsData.length,
          accuracy: 0.85,
          lastUpdated: new Date()
        }
      });

      await prediction.save();
      return prediction;
    } catch (error) {
      console.error('Prediction generation error:', error);
      throw error;
    }
  },

  parsePredictions(metricsData, predictionPeriod) {
    if (metricsData.length === 0) return [];

    const lastMetric = metricsData[metricsData.length - 1];
    const avgGrowth = metricsData.length > 1
      ? (metricsData[metricsData.length - 1].revenue - metricsData[0].revenue) / metricsData.length / metricsData[0].revenue
      : 0.05;

    const predictions = [];
    let currentRevenue = lastMetric.revenue;
    let currentProfit = lastMetric.profit;
    let quarterOffset = 1;
    const maxQuarters = predictionPeriod === 'next_quarter' ? 1
      : predictionPeriod === 'next_2_quarters' ? 2
      : predictionPeriod === 'next_year' ? 4
      : 8;

    for (let i = 0; i < maxQuarters; i++) {
      currentRevenue = currentRevenue * (1 + avgGrowth);
      currentProfit = currentProfit * (1 + avgGrowth * 0.8);

      predictions.push({
        period: `Q${(quarterOffset % 4) + 1} 2026`,
        predictedRevenue: Math.round(currentRevenue),
        predictedProfit: Math.round(currentProfit),
        confidenceScore: Math.max(0.65, 0.9 - (i * 0.05)),
        growthRate: avgGrowth * 100
      });

      quarterOffset++;
    }

    return predictions;
  },

  parseAnalysis(analysisText) {
    const trends = analysisText.match(/trend|increasing|decreasing/gi) || [];
    const risks = analysisText.match(/risk|challenge|concern|decline/gi) || [];
    const opportunities = analysisText.match(/opportunity|growth|expand|increase/gi) || [];
    const recommendations = analysisText.match(/recommend|suggest|consider|should/gi) || [];

    return {
      summary: analysisText.substring(0, 500),
      trends: [...new Set(trends.map(t => t.toLowerCase()))].slice(0, 3),
      risks: [...new Set(risks.map(r => r.toLowerCase()))].slice(0, 3),
      opportunities: [...new Set(opportunities.map(o => o.toLowerCase()))].slice(0, 3),
      recommendations: analysisText.match(/\d\.\s+(.+)/g)?.slice(0, 3) || []
    };
  },

  async getPrediction(userId, predictionId) {
    return BusinessPrediction.findOne({ _id: predictionId, userId });
  },

  async listPredictions(userId) {
    return BusinessPrediction.find({ userId }).sort({ createdAt: -1 });
  },

  async deletePrediction(userId, predictionId) {
    const prediction = await BusinessPrediction.findOne({ _id: predictionId, userId });
    if (!prediction) return false;
    await prediction.deleteOne();
    return true;
  }
};

const BUILT_IN_AGENTS = [
  {
    type: 'email',
    name: 'Email Agent',
    description: 'Draft follow-up emails and send them after explicit approval.'
  },
  {
    type: 'sales_recommendation',
    name: 'Sales Recommendation Agent',
    description: 'Recommend the best offer, CTA, and follow-up based on chatbot business context.'
  },
  {
    type: 'analytics_insight',
    name: 'Analytics Insight Agent',
    description: 'Turn chatbot analytics into wins, issues, and prioritized next actions.'
  },
  {
    type: 'forecast',
    name: 'Forecast Agent',
    description: 'Generate a plain-language forecast summary from uploaded business metrics.'
  }
];

const sanitizeAgentPrompt = (value, maxLength = 2000) => utilityService.sanitizeString(value || '', maxLength);

const truncateText = (value, maxLength = 240) => {
  const clean = sanitizeAgentPrompt(value, maxLength);
  return clean.length > maxLength ? `${clean.slice(0, maxLength - 3)}...` : clean;
};

const toPlainObject = (value) => (value?.toObject?.() ? value.toObject() : value);

const extractJsonBlock = (text) => {
  const safeText = text || '';
  const match = safeText.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('No JSON object found in model output');
  }

  return JSON.parse(match[0]);
};

const callStructuredAgentModel = async ({ systemPrompt, userPrompt, fallback }) => {
  const groq = getGroqClient();
  if (!groq) {
    return fallback();
  }

  const completion = await groq.chat.completions.create({
    model: DEFAULT_MODEL,
    temperature: 0.3,
    max_tokens: 1200,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]
  });

  const text = completion.choices?.[0]?.message?.content || '';
  try {
    return extractJsonBlock(text);
  } catch {
    return fallback();
  }
};

const summarizeConversation = (conversation) => {
  if (!conversation) {
    return '';
  }

  const messages = (conversation.messages || [])
    .slice(-6)
    .map((message) => `${message.role}: ${message.content}`)
    .join('\n');

  return truncateText(messages, 1200);
};

const buildForecastFallback = (metrics, prediction, prompt, predictionPeriod) => {
  const latestMetric = metrics.metrics[metrics.metrics.length - 1] || {};
  const topPrediction = prediction?.predictions?.[0] || {};
  const summary = `Forecast for ${metrics.businessName}: based on ${metrics.metrics.length} historical periods, the next outlook points to revenue near ${topPrediction.predictedRevenue || latestMetric.revenue || 0} and profit near ${topPrediction.predictedProfit || latestMetric.profit || 0}.`;

  return {
    summary,
    trends: prediction?.analysis?.trends?.slice(0, 3) || ['steady growth'],
    risks: prediction?.analysis?.risks?.slice(0, 3) || ['Forecast confidence depends on keeping recent growth and margin trends stable.'],
    opportunities: prediction?.analysis?.opportunities?.slice(0, 3) || ['Use the strongest channel and offer mix to compound recent growth.'],
    recommendations: prediction?.analysis?.recommendations?.slice(0, 3) || [
      `Review the ${predictionPeriod} forecast against your actual pipeline every month.`,
      'Protect margin on your best-selling offerings while growing acquisition.',
      prompt ? `Incorporate this planning request into the next leadership review: ${truncateText(prompt, 120)}` : 'Turn this forecast into a concrete action plan for the next quarter.'
    ]
  };
};

export const emailSettingsService = {
  async getSettings(userId) {
    let settings = await EmailSettings.findOne({ userId });
    if (!settings) {
      settings = await EmailSettings.create({ userId });
    }
    return settings;
  },

  async updateSettings(userId, payload = {}) {
    const existing = await emailSettingsService.getSettings(userId);
    existing.providerType = payload.providerType || existing.providerType;
    existing.senderName = sanitizeAgentPrompt(payload.senderName, 120) || existing.senderName;
    existing.senderEmail = sanitizeAgentPrompt(payload.senderEmail, 180) || existing.senderEmail;
    existing.enabled = payload.enabled ?? existing.enabled;

    if (payload.resendApiKey !== undefined) {
      existing.resendApiKey = sanitizeAgentPrompt(payload.resendApiKey, 400);
    }

    if (payload.smtp) {
      existing.smtp = {
        ...toPlainObject(existing.smtp),
        host: sanitizeAgentPrompt(payload.smtp.host, 180) || existing.smtp.host,
        port: Number(payload.smtp.port) || existing.smtp.port,
        username: sanitizeAgentPrompt(payload.smtp.username, 180) || existing.smtp.username,
        password: sanitizeAgentPrompt(payload.smtp.password, 240) || existing.smtp.password,
        secure: payload.smtp.secure ?? existing.smtp.secure
      };
    }

    await existing.save();
    return existing;
  },

  sanitizeForClient(settings) {
    return {
      providerType: settings.providerType,
      senderName: settings.senderName,
      senderEmail: settings.senderEmail,
      enabled: settings.enabled,
      resendApiKeyConfigured: Boolean(settings.resendApiKey),
      smtpConfigured: Boolean(settings.smtp?.host && settings.smtp?.username),
      smtp: {
        host: settings.smtp?.host || '',
        port: settings.smtp?.port || 587,
        username: settings.smtp?.username || '',
        secure: Boolean(settings.smtp?.secure)
      }
    };
  },

  async testSettings(userId) {
    const settings = await emailSettingsService.getSettings(userId);
    if (!settings.enabled) {
      return { success: false, message: 'Email sending is disabled.' };
    }

    if (settings.providerType === 'resend') {
      if (!settings.senderEmail || !settings.resendApiKey) {
        return { success: false, message: 'Resend sender email and API key are required.' };
      }
      return { success: true, message: 'Resend settings look ready for use.' };
    }

    if (!settings.smtp?.host || !settings.smtp?.username || !settings.smtp?.password) {
      return { success: false, message: 'SMTP host, username, and password are required.' };
    }

    try {
      const transporter = nodemailer.createTransport({
        host: settings.smtp.host,
        port: settings.smtp.port,
        secure: settings.smtp.secure,
        auth: {
          user: settings.smtp.username,
          pass: settings.smtp.password
        },
        timeout: 10000 // 10 seconds timeout
      });

      await transporter.verify();
      return { success: true, message: 'SMTP settings are valid and connection was successful.' };
    } catch (error) {
      return { success: false, message: `SMTP connection failed: ${error.message}` };
    }
  }
};

export const agentService = {
  getAgentCatalog() {
    return BUILT_IN_AGENTS;
  },

  async listRuns(userId, filters = {}) {
    const query = { userId };
    if (filters.agentType) {
      query.agentType = filters.agentType;
    }
    if (filters.chatbotId) {
      query.chatbotId = filters.chatbotId;
    }

    return AgentRun.find(query).sort({ createdAt: -1 }).limit(20);
  },

  async getRun(userId, runId) {
    return AgentRun.findOne({ _id: runId, userId });
  },

  async ensureChatbot(userId, chatbotId) {
    if (!chatbotId) {
      return null;
    }

    const chatbot = await chatbotService.getOwnedChatbot(userId, chatbotId);
    if (!chatbot) {
      throw new Error('Chatbot not found');
    }
    return chatbot;
  },

  async ensureConversation(userId, conversationId, chatbotId = null) {
    if (!conversationId) {
      return null;
    }

    const conversation = await conversationService.getOwnedConversation(userId, conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    if (chatbotId && ensureObjectIdValue(conversation.chatbotId) !== ensureObjectIdValue(chatbotId)) {
      throw new Error('Conversation does not belong to the selected chatbot');
    }
    return conversation;
  },

  async ensureBusinessMetrics(userId, businessMetricsId) {
    if (!businessMetricsId) {
      return null;
    }

    const metrics = await businessMetricsService.getMetrics(userId, businessMetricsId);
    if (!metrics) {
      throw new Error('Business metrics not found');
    }
    return metrics;
  },

  buildRunResponse(run) {
    return {
      id: run._id,
      agentType: run.agentType,
      status: run.status,
      input: run.input,
      output: run.output,
      createdAt: run.createdAt,
      updatedAt: run.updatedAt,
      chatbotId: run.chatbotId,
      conversationId: run.conversationId,
      businessMetricsId: run.businessMetricsId,
      predictionId: run.predictionId
    };
  },

  async createRunBase({ userId, payload, status, input, output, refs = {}, error = null, approval = null }) {
    return AgentRun.create({
      userId,
      agentType: payload.agentType,
      chatbotId: refs.chatbotId || null,
      conversationId: refs.conversationId || null,
      businessMetricsId: refs.businessMetricsId || null,
      predictionId: refs.predictionId || null,
      status,
      input,
      output,
      approval: approval || undefined,
      error: error || undefined
    });
  },

  async runEmailAgent(userId, payload, chatbot, conversation) {
    const input = {
      recipient: sanitizeAgentPrompt(payload.recipient, 180),
      prompt: sanitizeAgentPrompt(payload.prompt, 1200),
      chatbotId: chatbot?._id || null,
      conversationId: conversation?._id || null
    };

    if (!input.recipient || !input.prompt) {
      throw new Error('Recipient and prompt are required for the Email Agent');
    }

    const chatbotContext = chatbot ? buildBusinessContext(chatbot).join('\n') : '';
    const conversationContext = summarizeConversation(conversation);
    const output = await callStructuredAgentModel({
      systemPrompt: 'You are an email drafting agent. Return strict JSON with keys subject, body, recipient, rationale. Keep the body professional and ready to send.',
      userPrompt: `Recipient: ${input.recipient}\nGoal: ${input.prompt}\nBusiness context:\n${chatbotContext || 'None'}\nConversation context:\n${conversationContext || 'None'}`,
      fallback: () => ({
        subject: `Follow-up from ${chatbot?.businessProfile?.businessName || 'our team'}`,
        body: `Hi,\n\n${input.prompt}\n\nI wanted to follow up with a clear next step based on our recent discussion.${chatbot?.automation?.primaryCallToAction ? ` ${chatbot.automation.primaryCallToAction}.` : ''}\n\nBest regards,\n${chatbot?.businessProfile?.businessName || 'MarketMind AI'}`,
        recipient: input.recipient,
        rationale: 'Drafted from the provided prompt and any selected chatbot or conversation context.'
      })
    });

    const run = await agentService.createRunBase({
      userId,
      payload,
      status: 'needs_approval',
      input,
      output: {
        subject: sanitizeAgentPrompt(output.subject, 200),
        body: sanitizeAgentPrompt(output.body, 5000),
        recipient: sanitizeAgentPrompt(output.recipient || input.recipient, 180),
        rationale: sanitizeAgentPrompt(output.rationale, 400),
        delivery: null
      },
      refs: {
        chatbotId: chatbot?._id,
        conversationId: conversation?._id
      },
      approval: {
        required: true
      }
    });

    return run;
  },

  async runSalesRecommendationAgent(userId, payload, chatbot, conversation) {
    if (!chatbot) {
      throw new Error('chatbotId is required for the Sales Recommendation Agent');
    }

    const input = {
      chatbotId: chatbot._id,
      conversationId: conversation?._id || null,
      prompt: sanitizeAgentPrompt(payload.prompt, 1200)
    };

    const businessContext = buildBusinessContext(chatbot).join('\n');
    const conversationContext = summarizeConversation(conversation);
    const output = await callStructuredAgentModel({
      systemPrompt: 'You are a sales recommendation agent. Return strict JSON with keys recommendedOffering, fitReason, objections, cta, followUpMessage.',
      userPrompt: `Business context:\n${businessContext}\nConversation context:\n${conversationContext || 'None'}\nGoal:\n${input.prompt || 'Recommend the best offer and next step for this lead.'}`,
      fallback: () => ({
        recommendedOffering: chatbot.businessProfile?.offerings?.[0] || chatbot.name,
        fitReason: `The recommendation aligns with ${chatbot.businessProfile?.targetAudience || 'the target audience'} and the bot's current business goals.`,
        objections: ['Budget sensitivity', 'Need for human validation', 'Timeline uncertainty'],
        cta: chatbot.automation?.primaryCallToAction || 'Book a demo',
        followUpMessage: `Based on what you've shared, I recommend starting with ${chatbot.businessProfile?.offerings?.[0] || chatbot.name}. ${chatbot.automation?.primaryCallToAction || 'Would you like to move to the next step?'}`
      })
    });

    return agentService.createRunBase({
      userId,
      payload,
      status: 'completed',
      input,
      output: {
        recommendedOffering: sanitizeAgentPrompt(output.recommendedOffering, 200),
        fitReason: sanitizeAgentPrompt(output.fitReason, 600),
        objections: Array.isArray(output.objections) ? output.objections.map((item) => sanitizeAgentPrompt(item, 160)).filter(Boolean).slice(0, 5) : [],
        cta: sanitizeAgentPrompt(output.cta, 200),
        followUpMessage: sanitizeAgentPrompt(output.followUpMessage, 1200)
      },
      refs: {
        chatbotId: chatbot._id,
        conversationId: conversation?._id
      }
    });
  },

  async runAnalyticsInsightAgent(userId, payload, chatbot) {
    if (!chatbot) {
      throw new Error('chatbotId is required for the Analytics Insight Agent');
    }

    const analytics = await conversationService.buildAnalytics(chatbot._id);
    const input = { chatbotId: chatbot._id };
    const output = await callStructuredAgentModel({
      systemPrompt: 'You are an analytics insight agent. Return strict JSON with keys summary, wins, problems, likelyCauses, actions.',
      userPrompt: `Chatbot name: ${chatbot.name}\nBusiness context:\n${buildBusinessContext(chatbot).join('\n')}\nAnalytics:\n${JSON.stringify(analytics, null, 2)}`,
      fallback: () => ({
        summary: `${chatbot.name} has ${analytics.stats.totalConversations} conversations and ${analytics.stats.leadsCaptured} leads captured so far.`,
        wins: [
          analytics.stats.totalConversations > 0 ? 'Conversation tracking is active.' : 'The bot is ready for traffic.',
          analytics.stats.leadsCaptured > 0 ? 'Lead capture is producing identifiable contacts.' : 'Lead capture is enabled and ready to test.'
        ],
        problems: [
          analytics.stats.totalConversations === 0 ? 'No conversations have been collected yet.' : 'Repeated questions may indicate missing self-serve answers.',
          analytics.stats.escalationsTriggered > analytics.stats.leadsCaptured ? 'Escalations are high relative to captured leads.' : 'Escalations are currently manageable.'
        ],
        likelyCauses: [
          'Prompt and knowledge coverage may not fully address repeated questions.',
          'Primary CTA and support flow may need tuning.'
        ],
        actions: [
          'Review the top repeated questions and add direct answers to the system prompt.',
          'Test the primary CTA wording during live chats.',
          'Audit escalation keywords and reduce unnecessary handoffs.'
        ]
      })
    });

    return agentService.createRunBase({
      userId,
      payload,
      status: 'completed',
      input,
      output: {
        summary: sanitizeAgentPrompt(output.summary, 800),
        wins: Array.isArray(output.wins) ? output.wins.map((item) => sanitizeAgentPrompt(item, 220)).filter(Boolean).slice(0, 5) : [],
        problems: Array.isArray(output.problems) ? output.problems.map((item) => sanitizeAgentPrompt(item, 220)).filter(Boolean).slice(0, 5) : [],
        likelyCauses: Array.isArray(output.likelyCauses) ? output.likelyCauses.map((item) => sanitizeAgentPrompt(item, 220)).filter(Boolean).slice(0, 5) : [],
        actions: Array.isArray(output.actions) ? output.actions.map((item) => sanitizeAgentPrompt(item, 220)).filter(Boolean).slice(0, 5) : [],
        analyticsSnapshot: analytics.stats
      },
      refs: {
        chatbotId: chatbot._id
      }
    });
  },

  async runForecastAgent(userId, payload, metrics) {
    if (!metrics) {
      throw new Error('businessMetricsId is required for the Forecast Agent');
    }

    const prompt = sanitizeAgentPrompt(payload.prompt, 1200);
    const predictionPeriod = payload.predictionPeriod || 'next_quarter';
    const prediction = await businessPredictionService.generatePrediction(userId, metrics._id, {
      userPrompt: prompt || `Forecast ${metrics.businessName} for ${predictionPeriod}`,
      predictionPeriod
    });

    const input = {
      businessMetricsId: metrics._id,
      prompt,
      predictionPeriod
    };

    const output = await callStructuredAgentModel({
      systemPrompt: 'You are a forecast agent. Return strict JSON with keys summary, trends, risks, opportunities, recommendations.',
      userPrompt: `Business: ${metrics.businessName}\nMetrics:\n${JSON.stringify(metrics.metrics, null, 2)}\nPrediction:\n${JSON.stringify(prediction, null, 2)}\nPrompt:\n${prompt || 'Provide a forecast summary and next actions.'}`,
      fallback: () => buildForecastFallback(metrics, prediction, prompt, predictionPeriod)
    });

    return agentService.createRunBase({
      userId,
      payload,
      status: 'completed',
      input,
      output: {
        summary: sanitizeAgentPrompt(output.summary, 1000),
        trends: Array.isArray(output.trends) ? output.trends.map((item) => sanitizeAgentPrompt(item, 220)).filter(Boolean).slice(0, 5) : [],
        risks: Array.isArray(output.risks) ? output.risks.map((item) => sanitizeAgentPrompt(item, 220)).filter(Boolean).slice(0, 5) : [],
        opportunities: Array.isArray(output.opportunities) ? output.opportunities.map((item) => sanitizeAgentPrompt(item, 220)).filter(Boolean).slice(0, 5) : [],
        recommendations: Array.isArray(output.recommendations) ? output.recommendations.map((item) => sanitizeAgentPrompt(item, 240)).filter(Boolean).slice(0, 5) : [],
        predictions: prediction.predictions,
        predictionId: prediction._id
      },
      refs: {
        businessMetricsId: metrics._id,
        predictionId: prediction._id
      }
    });
  },

  async runAgent(userId, payload = {}) {
    if (!payload.agentType) {
      throw new Error('agentType is required');
    }

    const chatbot = await agentService.ensureChatbot(userId, payload.chatbotId);
    const conversation = await agentService.ensureConversation(userId, payload.conversationId, payload.chatbotId);
    const metrics = await agentService.ensureBusinessMetrics(userId, payload.businessMetricsId);

    if (payload.agentType === 'email') {
      return agentService.runEmailAgent(userId, payload, chatbot, conversation);
    }
    if (payload.agentType === 'sales_recommendation') {
      return agentService.runSalesRecommendationAgent(userId, payload, chatbot, conversation);
    }
    if (payload.agentType === 'analytics_insight') {
      return agentService.runAnalyticsInsightAgent(userId, payload, chatbot);
    }
    if (payload.agentType === 'forecast') {
      return agentService.runForecastAgent(userId, payload, metrics);
    }

    throw new Error('Unsupported agent type');
  },

  async deliverEmail(run, settings) {
    const recipient = run.output?.recipient;
    const subject = run.output?.subject;
    const body = run.output?.body;

    if (!settings.enabled) {
      throw new Error('Email sending is disabled');
    }

    if (!recipient || !subject || !body) {
      throw new Error('Email draft is incomplete');
    }

    if (settings.providerType === 'resend') {
      if (!settings.resendApiKey || !settings.senderEmail) {
        throw new Error('Resend settings are incomplete');
      }

      if (process.env.NODE_ENV === 'test' || settings.resendApiKey.startsWith('test_')) {
        return {
          provider: 'resend',
          messageId: `test_${Date.now()}`,
          status: 'mock_sent'
        };
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.resendApiKey}`
        },
        body: JSON.stringify({
          from: settings.senderName ? `${settings.senderName} <${settings.senderEmail}>` : settings.senderEmail,
          to: [recipient],
          subject,
          text: body
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Resend email send failed');
      }

      return {
        provider: 'resend',
        messageId: result.id || '',
        status: 'sent'
      };
    }

    if (settings.providerType === 'smtp') {
      if (!settings.smtp?.host || !settings.smtp?.username || !settings.smtp?.password) {
        throw new Error('SMTP settings are incomplete');
      }

      const transporter = nodemailer.createTransport({
        host: settings.smtp.host,
        port: settings.smtp.port,
        secure: settings.smtp.secure,
        auth: {
          user: settings.smtp.username,
          pass: settings.smtp.password
        }
      });

      const info = await transporter.sendMail({
        from: settings.senderName ? `${settings.senderName} <${settings.senderEmail || settings.smtp.username}>` : (settings.senderEmail || settings.smtp.username),
        to: recipient,
        subject,
        text: body
      });

      return {
        provider: 'smtp',
        messageId: info.messageId,
        status: 'sent'
      };
    }

    // If not resend or smtp provider, do not block the app (development safe fallback).
    // This prevents 500 errors when email delivery is not configured.
    return {
      provider: settings.providerType || 'unknown',
      status: 'skipped',
      message: 'Email provider is not configured for sending in this runtime. Enable Resend or SMTP in settings to send actual emails.'
    };
  },

  async approveEmailRun(userId, runId) {
    const run = await AgentRun.findOne({ _id: runId, userId });
    if (!run) {
      return null;
    }
    if (run.agentType !== 'email') {
      throw new Error('Only Email Agent runs can be approved');
    }
    if (run.status !== 'needs_approval') {
      throw new Error('This email draft is not awaiting approval');
    }

    const settings = await emailSettingsService.getSettings(userId);
    let delivery;

    if (!settings.enabled) {
      // Email disabled in settings; record skip to avoid 500.
      delivery = {
        provider: settings.providerType || 'none',
        status: 'skipped',
        message: 'Email sending is disabled in user settings.'
      };
      run.status = 'approved';
    } else {
      delivery = await agentService.deliverEmail(run, settings);
      run.status = 'sent';
    }

    run.approval = {
      required: true,
      approvedAt: new Date(),
      approvedBy: userId
    };
    run.output = {
      ...toPlainObject(run.output),
      delivery: {
        ...delivery,
        sentAt: new Date().toISOString()
      }
    };
    await run.save();
    return run;
  }
};

export default {
  authService,
  chatbotService,
  conversationService,
  integrationService,
  aiService,
  validationService,
  utilityService,
  adCampaignService,
  businessMetricsService,
  businessPredictionService,
  emailSettingsService,
  agentService
};
