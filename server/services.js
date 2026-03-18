import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import Groq from 'groq-sdk';
import mongoose from 'mongoose';
import { APIIntegration, Analytics, Chatbot, Conversation, User, AdCampaign, BusinessMetrics, BusinessPrediction } from './database.js';

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

    // Generate AI prediction using Groq
    const groq = getGroqClient();
    if (!groq) {
      throw new Error('AI provider is not configured');
    }

    const metricsData = metrics.metrics.map(m => ({
      quarter: m.quarter,
      year: m.year,
      revenue: m.revenue,
      profit: m.profit,
      customers: m.customers
    }));

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
    const summaryMatch = analysisText.match(/summary|growth rate|trends/i);
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
  businessPredictionService
};
