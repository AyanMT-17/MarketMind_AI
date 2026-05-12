import Groq from 'groq-sdk';
import { projectService } from './projectService.js';

const getGroqClient = () => {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
};

const extractJsonBlock = (text) => {
  const safeText = text || '';
  const match = safeText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
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

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      max_tokens: 3000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });

    const text = completion.choices?.[0]?.message?.content || '';
    return extractJsonBlock(text);
  } catch (error) {
    console.error('Groq API Error:', error);
    return fallback();
  }
};

const buildProjectContext = (project) => `
Project Name: ${project.name}
Description: ${project.description}
Target Audience: ${project.targetAudience}
Competitors: ${project.competitors.join(', ')}
Core Features: ${project.coreFeatures.join(', ')}
`;

export const aiStrategyService = {
  async generateValidation(projectId, userId) {
    const project = await projectService.getProject(userId, projectId);
    if (!project) throw new Error('Project not found');

    const systemPrompt = 'You are an expert market validation analyst. Assess the project context and return strict JSON with keys: marketNeed (string 1-10/10), sentiment (string positive/neutral/negative), painPointsAddressed (array of strings), risks (array of strings), validationSummary (string paragraph).';
    const userPrompt = buildProjectContext(project);

    const data = await callStructuredAgentModel({
      systemPrompt,
      userPrompt,
      fallback: () => ({
        marketNeed: '7/10',
        sentiment: 'neutral',
        painPointsAddressed: ['Manual processes', 'Lack of insights'],
        risks: ['High competition', 'Execution difficulty'],
        validationSummary: 'This is a mock validation summary since the AI key is missing.'
      })
    });

    return projectService.saveReport(projectId, 'validation', data);
  },

  async generateLaunchPlan(projectId, userId) {
    const project = await projectService.getProject(userId, projectId);
    if (!project) throw new Error('Project not found');

    const systemPrompt = 'You are an expert go-to-market coach. Return strict JSON with keys: prepPhase (array of tasks), launchDay (array of tasks), organicStrategies (array of strings: e.g. reddit/indie hackers), draftSocialCopy (string).';
    const userPrompt = buildProjectContext(project);

    const data = await callStructuredAgentModel({
      systemPrompt,
      userPrompt,
      fallback: () => ({
        prepPhase: ['Build landing page', 'Gather beta testers'],
        launchDay: ['Post on Product Hunt', 'Send email blast'],
        organicStrategies: ['Engage in niche Subreddits', 'Write SEO content'],
        draftSocialCopy: 'We just launched our new project! Check it out.'
      })
    });

    return projectService.saveReport(projectId, 'launch-plan', data);
  },

  async generateCompetitorAnalysis(projectId, userId, competitorUrl) {
    const project = await projectService.getProject(userId, projectId);
    if (!project) throw new Error('Project not found');

    const systemPrompt = 'You are a competitive intelligence strategist. Return strict JSON with keys: competitorName (string), perceivedWeaknesses (array of strings), ourAdvantage (string), attackStrategy (array of strings).';
    const userPrompt = `${buildProjectContext(project)}\n\nAnalyze this competitor: ${competitorUrl}`;

    const data = await callStructuredAgentModel({
      systemPrompt,
      userPrompt,
      fallback: () => ({
        competitorName: competitorUrl || 'Competitor X',
        perceivedWeaknesses: ['Clunky UI', 'High pricing', 'Slow support'],
        ourAdvantage: 'We are faster and cheaper.',
        attackStrategy: ['Target their unhappy users on Twitter', 'Offer a seamless migration tool']
      })
    });

    return projectService.saveReport(projectId, 'competitor-analysis', data);
  },

  async generate100DayPlan(projectId, userId) {
    const project = await projectService.getProject(userId, projectId);
    if (!project) throw new Error('Project not found');

    const systemPrompt = 'You are a startup growth analyst. Return strict JSON with keys: day30 (object with tasks and targetTraffic/targetUsers), day60 (same), day100 (same), primaryMetricFocus (string).';
    const userPrompt = buildProjectContext(project);

    const data = await callStructuredAgentModel({
      systemPrompt,
      userPrompt,
      fallback: () => ({
        day30: { tasks: ['Launch MVP', 'First 10 customers'], targetTraffic: 1000, targetUsers: 10 },
        day60: { tasks: ['Iterate on feedback', 'Start content marketing'], targetTraffic: 5000, targetUsers: 50 },
        day100: { tasks: ['Scale acquisition channels', 'Optimize retention'], targetTraffic: 15000, targetUsers: 200 },
        primaryMetricFocus: 'Active Users (WAU)'
      })
    });

    return projectService.saveReport(projectId, '100-day-plan', data);
  },

  async simulatePitchStream(projectId, userId, messages) {
    const project = await projectService.getProject(userId, projectId);
    if (!project) throw new Error('Project not found');

    const groq = getGroqClient();
    if (!groq) {
      return { content: 'Mock response: I am a skeptical investor. Why should I care about your project?', role: 'assistant' };
    }

    const systemPrompt = `You are a skeptical, highly critical Y-Combinator style investor or harsh target customer. The user is pitching you their product. Ask probing questions, point out logical fallacies, and challenge their assumptions. Be blunt but helpful.\n\nProject Context:\n${buildProjectContext(project)}`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 500,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ]
    });

    return { content: completion.choices?.[0]?.message?.content || '', role: 'assistant' };
  }
};
