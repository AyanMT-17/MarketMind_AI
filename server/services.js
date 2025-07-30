import jwt from 'jsonwebtoken';
import Groq from 'groq-sdk';
import { User } from './database.js';
import dotenv from 'dotenv';
import { connectDB, Campaign} from './database.js';

//connect to the database

// Initialize environment and Groq client
dotenv.config();
connectDB();
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Updated model configuration with Llama-3.3-70B-Instruct
const MODEL_CONFIG = {
  primary: 'llama-3.3-70b-versatile', // Groq's model identifier
  alternative: 'llama-3.1-70b-versatile', // Backup Llama model
  creative: 'mixtral-8x7b-32768', // Creative content generation
  instruction: 'llama-3.3-70b-versatile', // Use primary for structured tasks
  fallback: 'llama-3.1-8b-instant' // Fast fallback option
};

// Environment validation on startup
const validateEnvironment = () => {
  const requiredEnvVars = ['GROQ_API_KEY', 'JWT_SECRET', 'MONGODB_URI'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars);
    process.exit(1);
  }
  
  console.log('✅ Environment validation passed');
};

// Model health check on startup
const checkModelHealth = async () => {
  console.log('🔄 Checking Groq model availability...');
  const healthResults = {};
  
  for (const [name, model] of Object.entries(MODEL_CONFIG)) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: 'Health check' }],
        model: model,
        max_tokens: 5,
        temperature: 0.1,
      });
      
      healthResults[name] = { model, status: 'healthy' };
      console.log(`✅ ${model} - Available`);
    } catch (error) {
      healthResults[name] = { model, status: 'unavailable', error: error.message };
      console.warn(`⚠️  ${model} - Unavailable: ${error.message}`);
    }
  }
  
  return healthResults;
};

// Enhanced utility function for API retry logic
const retryApiCall = async (apiCall, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      console.warn(`API attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const jitter = Math.random() * 500;
      await new Promise(resolve => setTimeout(resolve, (delay * Math.pow(2, attempt - 1)) + jitter));
    }
  }
};

// Initialize environment and health checks
validateEnvironment();
let modelHealthStatus = {};
checkModelHealth().then(results => {
  modelHealthStatus = results;
});

// Authentication Services (unchanged from previous version)
export const authService = {
  generateToken: (userId) => {
    if (!userId) {
      throw new Error('User ID is required for token generation');
    }
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  },

  verifyToken: (token) => {
    if (!token) {
      throw new Error('Token is required for verification');
    }
    return jwt.verify(token, process.env.JWT_SECRET);
  },

  authenticate: async (req, res, next) => {
    try {
      const authHeader = req.header('Authorization');
      
      if (!authHeader) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authorization header is required' 
        });
      }

      if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authorization header must start with Bearer' 
        });
      }

      const token = authHeader.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ 
          success: false, 
          message: 'No token provided' 
        });
      }

      const decoded = authService.verifyToken(token);
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      if (!user.isActive) {
        return res.status(401).json({ 
          success: false, 
          message: 'User account is inactive' 
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid token format' 
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Token has expired' 
        });
      }

      res.status(401).json({ 
        success: false, 
        message: 'Authentication failed' 
      });
    }
  }
};

// Enhanced AI Service with Groq + Llama-3.3-70B integration
export const aiService = {
  // Get available models based on health check
  getAvailableModels: () => {
    const available = Object.entries(modelHealthStatus)
      .filter(([name, status]) => status.status === 'healthy')
      .map(([name, status]) => status.model);
    
    return available.length > 0 ? available : [MODEL_CONFIG.primary];
  },

   // Content optimization with Groq
  optimizeContent: async (originalContent, optimizationType) => {
  if (!originalContent?.trim()) {
    throw new Error('Original content is required for optimization');
  }

  const optimizationPrompts = {
    engagement: 'maximize user engagement and click-through rates',
    conversion: 'improve conversion rates and call-to-action effectiveness',
    readability: 'enhance readability and comprehension',
    professional: 'increase professionalism and credibility'
  };

  const objective = optimizationPrompts[optimizationType] || optimizationPrompts.engagement;

  const systemPrompt = `You are a content optimization expert specializing in marketing copy. Your goal is to ${objective} while maintaining the core message and brand voice.`;

  const userPrompt = `CONTENT OPTIMIZATION REQUEST:

ORIGINAL CONTENT:
${originalContent}

OPTIMIZATION OBJECTIVE: ${objective}

REQUIREMENTS:
- Maintain the core message and intent
- Enhance clarity and impact
- Improve structure and flow
- Make it more compelling and actionable
- Preserve brand voice and tone

Please provide the optimized version followed by a brief explanation of the key improvements made.`;

  // List of models to try (primary first, then alternatives)
  const modelsToTry = [MODEL_CONFIG.primary, MODEL_CONFIG.alternative];
  const errors = [];

  for (const model of modelsToTry) {
    try {
      console.log(`🔍 Attempting content optimization with model: ${model}`);
      const completion = await retryApiCall(() =>
        groq.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          model: model,
          max_tokens: 600,
          temperature: 0.6,
          top_p: 0.9,
          frequency_penalty: 0.1
        })
      );

      if (!completion || !completion.choices?.[0]?.message?.content) {
        throw new Error('No optimized content generated from Groq API');
      }
      console.log(`✅ Content optimization successful with ${model}`);

      return {
        originalContent,
        optimizedContent: completion.choices[0].message.content.trim(),
        optimizationType,
        objective,
        model,
        tokensUsed: completion.usage?.total_tokens || 0,
        generatedAt: new Date(),
        provider: 'groq'
      };
    } catch (modelError) {
      console.warn(`❌ Model ${model} failed for optimization:`, modelError.message);
      errors.push(`${model}: ${modelError.message}`);
      // DO NOT throw here; continue to next model.
    }
  }
  // If no model succeeded
  throw new Error(`Content optimization failed in all models: ${errors.join(' | ')}`);
},

  generateContent: async (prompt, contentType, brandSettings = {}) => {
    // Input validation
    if (!prompt?.trim()) {
      throw new Error('Prompt is required and cannot be empty');
    }

    if (!contentType || !['email', 'social', 'ad', 'blog'].includes(contentType)) {
      throw new Error('Valid content type (email, social, ad, blog) is required');
    }

    try {
      // Enhanced system prompt for Llama-3.3-70B
      const systemPrompt = `You are a professional marketing content creator specializing in ${contentType} content. 

Brand Guidelines:
- Tone: ${brandSettings.tone || 'professional'}
- Style: ${brandSettings.style || 'conversational'}
- Target Audience: ${brandSettings.targetAudience || 'business professionals'}
- Brand Guidelines: ${brandSettings.guidelines || 'Focus on clear, engaging communication'}

Create compelling, brand-aligned content that resonates with the target audience. Focus on clarity, engagement, and actionable messaging.`;

      // Try Llama models in order of preference
      const modelsToTry = [MODEL_CONFIG.primary, MODEL_CONFIG.alternative, MODEL_CONFIG.fallback];
      
      for (let i = 0; i < modelsToTry.length; i++) {
        try {
          const modelToUse = modelsToTry[i];
          console.log(`🦙 Attempting content generation with model: ${modelToUse}`);
          
          const apiCall = () => groq.chat.completions.create({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            model: modelToUse,
            max_tokens: contentType === 'blog' ? 800 : 400,
            temperature: 0.7,
            top_p: 0.9,
            frequency_penalty: 0.1,
            presence_penalty: 0.1
          });

          const completion = await retryApiCall(apiCall);

          if (!completion || !completion.choices?.[0]?.message?.content) {
            throw new Error('No content generated from Groq API');
          }
          console.log('AI Generation Result:', completion.choices[0].message.content.trim());
          const content = completion.choices[0].message.content.trim();
          console.log('Optimized content for', content);
          console.log(`✅ Content generated successfully with ${modelToUse}`);

          return {
          content: content,
          model: modelToUse,
          prompt,
          contentType,
          wordCount: content.optimizedContent.split(/\s+/).        length,
          characterCount: content.optimizedContent.length,
          tokensUsed: completion.usage?.total_tokens || 0,
          generatedAt: new Date(),
          fallbackUsed: i > 0,
          modelRank: i + 1,
          provider: 'groq',
        };

        } catch (modelError) {
          console.warn(`❌ Model ${modelsToTry[i]} failed:`, modelError.message);
          
          if (i === modelsToTry.length - 1) {
            throw new Error(`All ${modelsToTry.length} models failed. Last error: ${modelError.message}`);
          }
          
          continue;
        }
      }

    } catch (error) {
      console.error('All Groq models failed:', error);
      throw new Error(`Content generation failed: ${error.message}`);
    }
  },

  generateSalesForecast: async (salesData, context) => {
    // Input validation
    if (!salesData || typeof salesData !== 'object') {
      throw new Error('Valid sales data object is required');
    }

    if (!context?.trim()) {
      throw new Error('Business context is required for accurate forecasting');
    }

    try {
      const systemPrompt = `You are a senior sales forecasting analyst with expertise in predictive analytics and business intelligence. Analyze the provided data and generate accurate, actionable predictions.`;
      
      const userPrompt = `SALES DATA ANALYSIS REQUEST:

Historical Sales Data:
${JSON.stringify(salesData, null, 2)}

Business Context: ${context}

Please provide a comprehensive analysis including:

1. **NEXT QUARTER PREDICTIONS**
   - Specific revenue numbers with confidence ranges
   - Percentage growth/decline from previous periods
   - Seasonal factors and market conditions impact

2. **KEY TRENDS & FACTORS**
   - Primary growth drivers or concerns
   - Market condition influences
   - Historical pattern analysis

3. **CONFIDENCE ASSESSMENT**
   - Confidence level (1-10 scale) with detailed reasoning
   - Risk factors that could affect accuracy
   - Data quality and completeness assessment

4. **STRATEGIC RECOMMENDATIONS**
   - Three specific, actionable business recommendations
   - Resource allocation suggestions
   - Contingency planning advice

Format your response with clear headings and bullet points for easy reading.`;

      // Use primary model for forecasting with optimized parameters
      const modelsToTry = [MODEL_CONFIG.primary, MODEL_CONFIG.alternative];
      
      for (const model of modelsToTry) {
        try {
          console.log(`📊 Attempting sales forecast with Groq model: ${model}`);
          
          const completion = await retryApiCall(() => 
            groq.chat.completions.create({
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
              ],
              model: model,
              max_tokens: 1000,
              temperature: 0.2, // Lower temperature for analytical tasks
              top_p: 0.8,
              frequency_penalty: 0.1,
              presence_penalty: 0.1
            })
          );

          if (!completion || !completion.choices?.[0]?.message?.content) {
            throw new Error('No forecast generated from Groq API');
          }

          console.log(`✅ Sales forecast generated with ${model}`);
          const formattedForecast = completion.choices[0].message.content.trim();
          return {
            forecast: formattedForecast,
            model: model,
            salesDataInput: salesData,
            businessContext: context,
            tokensUsed: completion.usage?.total_tokens || 0,
            generatedAt: new Date(),
            provider: 'groq'
          };
          
        } catch (modelError) {
          console.warn(`❌ Forecast model ${model} failed:`, modelError.message);
          continue;
        }
      }
      
      throw new Error('All forecast models failed');
    } catch (error) {
      console.error('Sales forecast generation failed:', error);
      throw new Error(`Sales forecast failed: ${error.message}`);
    }
  },

  generateCampaign: async ({
  name,
  prompt,
  type,
  brandSettings = {},
  userId
}) => {
  // 1. Input validation
  if (!prompt?.trim()) {
    return { success: false, errors: ['Prompt is required'], status: 400 };
  }
  if (!type || !['email', 'social', 'ad', 'blog'].includes(type)) {
    return { success: false, errors: ['Valid campaign type required'], status: 400 };
  }
  if (!userId) {
    return { success: false, errors: ['User ID required'], status: 400 };
  }
  // 2. Build campaign-gen prompt for LLM
  const aiPrompt = `You are a senior marketing strategist and copywriter. 
Draft a complete ${type} campaign for our business, based on the following idea:

Prompt/Theme: ${prompt}

Brand Guidelines:
- Tone: ${brandSettings.tone || 'professional'}
- Style: ${brandSettings.style || 'conversational'}
- Target Audience: ${brandSettings.targetAudience || 'business professionals'}
- Brand Guidelines: ${brandSettings.guidelines || 'Focus on clear, actionable, engaging copy'}

Please generate:
1. Subject line (if applicable)
2. Main body content
3. 2-3 alternative subject lines or hooks for testing
4. Clear and actionable call-to-action

Format:
SUBJECT: ...
BODY:
...
VARIATIONS:
- ...
CTA:
...
`;
  // 3. Call Groq LLM
  const modelsToTry = [MODEL_CONFIG.primary, MODEL_CONFIG.alternative, MODEL_CONFIG.fallback];
  const errors = [];
  let completion = null;
  let modelUsed = null;

  for (const model of modelsToTry) {
    try {
      completion = await retryApiCall(() =>
        groq.chat.completions.create({
          messages: [
            { role: 'system', content: 'You are an expert AI marketing assistant.' },
            { role: 'user', content: aiPrompt }
          ],
          model: model,
          max_tokens: 800,
          temperature: 0.7,
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1
        })
      );
      modelUsed = model;
      if (!completion || !completion.choices?.[0]?.message?.content) {
        throw new Error('No campaign content generated from Groq API');
      }
      break;
    } catch (err) {
      errors.push(`${model}: ${err.message}`);
      completion = null;
      // proceed to next model (no throw here)
    }
  }
  if (!completion) {
    return {
      success: false,
      message: 'AI failed to generate campaign',
      errors,
      status: 502
    };
  }

  // 4. Parse LLM response into fields
  const aiText = completion.choices[0].message.content.trim();
  // Simple parsing: look for SUBJECT/BODY/VARIATIONS/CTA sections (improve as needed)
  const subjectMatch = aiText.match(/SUBJECT:\s*(.+)/i);
  const bodyMatch = aiText.match(/BODY:\s*([\s\S]+?)(VARIATIONS:|CTA:|$)/i);
  const variationsMatch = aiText.match(/VARIATIONS:\s*([\s\S]+?)(CTA:|$)/i);
  const ctaMatch = aiText.match(/CTA:\s*(.+)$/i);

  const subject = subjectMatch ? subjectMatch[1].replace(/\n/g, '').trim() : '';
  const body = bodyMatch ? bodyMatch[1].replace(/\n{2,}/g, '\n').trim() : aiText;
  const variations =
    variationsMatch
      ? variationsMatch[1]
          .split('\n')
          .map((v) => v.replace(/^[-•*]\s*/, '').trim()) // Remove list dashes/bullets
          .filter(Boolean)
      : [];
  const cta = ctaMatch ? ctaMatch[1].replace(/\n/g, '').trim() : '';

  // 5. Assemble campaign object
  const campaignData = {
    userId: userId.toString(), // Convert ObjectId to string
    name: String(subject || prompt.slice(0, 40) + '...'), // Ensure string conversion
    type: String(type), // Convert to string
    status: 'draft', // Already a string
    content: {
      subject: String(subject || ''), // Convert to string, fallback to empty string
      body: String(body || ''), // Convert to string, fallback to empty string
      variations: variations.map(v => String(v)), // Convert array elements to strings
    },
    aiMetadata: {
      model: String(modelUsed || ''), // Convert to string
      prompt: String(prompt || ''), // Convert to string
      generatedAt: new Date().toISOString() // Convert Date to ISO string format
    }
};

  // 6. Validate campaign data before DB save
  const campaignErrors = validationService.validateCampaign(campaignData);
  if (campaignErrors.length > 0) {
    return { success: false, errors: campaignErrors, aiText, status: 422 };
  }

  // 7. Save to database
  try {
    const campaign = new Campaign(campaignData);
    await campaign.save();

    return {
      success: true,
      message: 'Campaign generated and created',
      campaign,
      modelUsed,
      aiText, // For reference/debugging
      status: 201
    };
  } catch (dbErr) {
    return {
      success: false,
      message: 'Campaign generation succeeded but database save failed',
      error: dbErr.message,
      aiText,
      status: 500
    };
  }
},

  // Enhanced model testing for Groq
  testModels: async (prompt = "Create a brief test marketing email announcement") => {
    const results = {};
    const startTime = Date.now();
    
    for (const [name, model] of Object.entries(MODEL_CONFIG)) {
      const modelStartTime = Date.now();
      
      try {
        console.log(`🧪 Testing Groq model: ${model}`);
        
        const completion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: model,
          max_tokens: 100,
          temperature: 0.7
        });
        
        const responseTime = Date.now() - modelStartTime;
        
        results[name] = {
          model: model,
          success: true,
          content: completion.choices?.[0]?.message?.content?.trim() || 'No content generated',
          responseTime: responseTime,
          tokensUsed: completion.usage?.total_tokens || 0,
          status: 'healthy',
          provider: 'groq'
        };
        
        console.log(`✅ Model ${model} working (${responseTime}ms, ${completion.usage?.total_tokens} tokens)`);
      } catch (error) {
        const responseTime = Date.now() - modelStartTime;
        
        results[name] = {
          model: model,
          success: false,
          error: error.message,
          errorType: error.constructor.name,
          responseTime: responseTime,
          status: 'unhealthy',
          provider: 'groq'
        };
        
        console.log(`❌ Model ${model} failed: ${error.message}`);
      }
    }
    
    const totalTime = Date.now() - startTime;
    const successCount = Object.values(results).filter(r => r.success).length;
    
    // Update health status
    modelHealthStatus = results;
    
    return {
      results,
      summary: {
        totalTested: Object.keys(MODEL_CONFIG).length,
        successCount: successCount,
        failureCount: Object.keys(MODEL_CONFIG).length - successCount,
        totalTestTime: totalTime,
        averageResponseTime: Math.round(
          Object.values(results).reduce((sum, r) => sum + r.responseTime, 0) / Object.keys(MODEL_CONFIG).length
        ),
        totalTokensUsed: Object.values(results)
          .filter(r => r.success)
          .reduce((sum, r) => sum + (r.tokensUsed || 0), 0)
      },
      testedAt: new Date(),
      provider: 'groq',
      recommendations: aiService.generateModelRecommendations(results)
    };
  },

  // Generate model recommendations for Groq
  generateModelRecommendations: (testResults) => {
    const recommendations = [];
    const workingModels = Object.entries(testResults).filter(([name, result]) => result.success);
    const failedModels = Object.entries(testResults).filter(([name, result]) => !result.success);
    
    if (workingModels.length === 0) {
      recommendations.push('❌ CRITICAL: No Groq models are currently working. Check your GROQ_API_KEY and network connectivity.');
    } else if (workingModels.length < 3) {
      recommendations.push('⚠️  WARNING: Limited model availability may affect reliability.');
    } else {
      recommendations.push('✅ Excellent model availability with Groq infrastructure.');
    }
    
    if (failedModels.length > 0) {
      recommendations.push(`🔧 Consider investigating these failed models: ${failedModels.map(([name]) => name).join(', ')}`);
    }
    
    // Performance recommendations
    const fastModels = workingModels.filter(([name, result]) => result.responseTime < 2000);
    if (fastModels.length > 0) {
      recommendations.push(`⚡ Ultra-fast models available: ${fastModels.map(([name]) => name).join(', ')}`);
    }
    
    // Token usage recommendations
    const totalTokens = workingModels.reduce((sum, [name, result]) => sum + (result.tokensUsed || 0), 0);
    if (totalTokens > 0) {
      recommendations.push(`💰 Total tokens used in testing: ${totalTokens} - monitor usage for cost optimization`);
    }
    
    return recommendations;
  },

 

  // Get current model health status
  getModelHealth: () => {
    return {
      status: modelHealthStatus,
      lastChecked: new Date(),
      provider: 'groq',
      availableModels: Object.entries(modelHealthStatus)
        .filter(([name, status]) => status.status === 'healthy')
        .map(([name, status]) => ({ name, model: status.model }))
    };
  }
};

// Validation service (unchanged)
export const validationService = {
  validateUser: (userData) => {
    const errors = [];
    
    if (!userData) {
      errors.push('User data is required');
      return errors;
    }

    if (!userData.email) {
      errors.push('Email is required');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        errors.push('Valid email address required');
      } else if (userData.email.length > 255) {
        errors.push('Email address too long');
      }
    }

    if (!userData.password) {
      errors.push('Password is required');
    } else if (userData.password.length < 6) {
      errors.push('Password must be at least 6 characters');
    } else if (userData.password.length > 128) {
      errors.push('Password too long');
    } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(userData.password)) {
      errors.push('Password must contain both letters and numbers');
    }

    if (!userData.firstName?.trim()) {
      errors.push('First name is required');
    } else if (userData.firstName.trim().length < 2) {
      errors.push('First name must be at least 2 characters');
    }

    if (!userData.lastName?.trim()) {
      errors.push('Last name is required');
    } else if (userData.lastName.trim().length < 2) {
      errors.push('Last name must be at least 2 characters');
    }
    
    return errors;
  },

  validateCampaign: (campaignData) => {
    const errors = [];
    
    if (!campaignData) {
      errors.push('Campaign data is required');
      return errors;
    }

    if (!campaignData.name?.trim()) {
      errors.push('Campaign name is required');
    } else if (campaignData.name.trim().length < 3) {
      errors.push('Campaign name must be at least 3 characters');
    } else if (campaignData.name.length > 100) {
      errors.push('Campaign name too long');
    }

    if (!campaignData.type) {
      errors.push('Campaign type is required');
    } else if (!['email', 'social', 'ad', 'blog'].includes(campaignData.type)) {
      errors.push('Campaign type must be one of: email, social, ad, blog');
    }

    if (campaignData.content?.subject && campaignData.content.subject.length > 200) {
      errors.push('Subject line must be 200 characters or less');
    }

    if (campaignData.content?.body && campaignData.content.body.length > 50000) {
      errors.push('Content body must be 50,000 characters or less');
    }
    
    return errors;
  },

  validateAIPrompt: (prompt, contentType) => {
    const errors = [];
    
    if (!prompt) {
      errors.push('Prompt is required');
      return errors;
    }

    if (!prompt.trim()) {
      errors.push('Prompt cannot be empty');
    } else if (prompt.length < 10) {
      errors.push('Prompt must be at least 10 characters long');
    } else if (prompt.length > 2000) {
      errors.push('Prompt must be 2000 characters or less');
    }

    if (!contentType) {
      errors.push('Content type is required');
    } else if (!['email', 'social', 'ad', 'blog'].includes(contentType)) {
      errors.push('Content type must be one of: email, social, ad, blog');
    }
    
    return errors;
  },

  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input;
    
    return input
      .trim()
      .replace(/[<>]/g, '')
      .substring(0, 5000);
  },

  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
};

// Email service (unchanged)
export const emailService = {
  sendCampaign: async (campaign, recipients) => {
    if (!campaign) {
      throw new Error('Campaign data is required');
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      throw new Error('Recipients array is required and cannot be empty');
    }

    if (recipients.length > 1000) {
      throw new Error('Cannot send to more than 1000 recipients at once');
    }

    try {
      console.log(`📧 Preparing email campaign: ${campaign.name}`);
      console.log(`👥 Recipients: ${recipients.length}`);
      
      const validRecipients = recipients.filter(recipient => 
        recipient.email && validationService.validateEmail(recipient.email)
      );

      if (validRecipients.length === 0) {
        throw new Error('No valid email addresses found in recipients');
      }

      if (validRecipients.length !== recipients.length) {
        console.warn(`⚠️  ${recipients.length - validRecipients.length} invalid email addresses filtered out`);
      }

      return {
        success: true,
        message: 'Email campaign queued for sending',
        campaignId: campaign._id,
        totalRecipients: recipients.length,
        validRecipients: validRecipients.length,
        invalidRecipients: recipients.length - validRecipients.length,
        estimatedDeliveryTime: '5-10 minutes',
        queuedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Email service error:', error);
      throw new Error(`Email campaign sending failed: ${error.message}`);
    }
  },

  validateEmailContent: (campaign) => {
    const errors = [];

    if (!campaign.content?.subject?.trim()) {
      errors.push('Email subject is required');
    }

    if (!campaign.content?.body?.trim()) {
      errors.push('Email body is required');
    }

    if (campaign.content?.subject && campaign.content.subject.length > 200) {
      errors.push('Email subject must be 200 characters or less');
    }

    return errors;
  }
};

// Utility service (unchanged)
export const utilityService = {
  formatResponse: (success, data = null, message = '', errors = []) => {
    const response = {
      success: Boolean(success),
      timestamp: new Date().toISOString(),
      message: message || (success ? 'Operation completed successfully' : 'Operation failed')
    };

    if (data !== null && data !== undefined) {
      response.data = data;
    }

    if (errors && errors.length > 0) {
      response.errors = errors;
    }

    return response;
  },

  generateSlug: (text) => {
    if (!text || typeof text !== 'string') {
      return 'untitled';
    }

    return text
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, '-') 
      .replace('/n', '') 
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  },

  logError: (operation, error, context = {}) => {
    console.error(`❌ ${operation} failed:`, {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      ...context
    });
  },

  logInfo: (operation, details = {}) => {
    console.log(`ℹ️  ${operation}:`, {
      timestamp: new Date().toISOString(),
      ...details
    });
  },

  calculateReadingTime: (text) => {
    if (!text || typeof text !== 'string') return 0;
    const wordsPerMinute = 200;
    const wordCount = text.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  },

  formatCurrency: (amount, currency = 'USD') => {
    if (typeof amount !== 'number' || isNaN(amount)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
};

// Default export with all services
export default {
  authService,
  aiService,
  validationService,
  emailService,
  utilityService
};
