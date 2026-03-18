import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import mongoose from 'mongoose';
import request from 'supertest';
import { io as createSocketClient } from 'socket.io-client';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;
let httpServer;
let integrationStubServer;
let requestAgent;
let socketBaseUrl;
let integrationBaseUrl;
let connectDB;
let createServer;
let User;

const testUser = {
  firstName: 'Ayan',
  lastName: 'Tester',
  email: 'ayan@example.com',
  password: 'secret123',
  company: 'MarketMind'
};

const registerAndLogin = async () => {
  const registerResponse = await requestAgent.post('/api/auth/register').send(testUser);
  assert.equal(registerResponse.statusCode, 201);
  return registerResponse.body.token;
};

test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.JWT_SECRET = 'test-secret';
  process.env.CLIENT_URL = 'http://localhost:5173';
  delete process.env.GROQ_API_KEY;

  ({ connectDB, User } = await import('../database.js'));
  ({ createServer } = await import('../server.js'));

  await connectDB();

  integrationStubServer = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      ok: true,
      path: req.url,
      method: req.method
    }));
  });

  await new Promise((resolve) => integrationStubServer.listen(0, resolve));
  integrationBaseUrl = `http://127.0.0.1:${integrationStubServer.address().port}`;

  const serverBundle = createServer();
  httpServer = serverBundle.httpServer;
  requestAgent = request(serverBundle.app);

  await new Promise((resolve) => httpServer.listen(0, resolve));
  socketBaseUrl = `http://127.0.0.1:${httpServer.address().port}`;
});

test.after(async () => {
  if (httpServer) {
    await new Promise((resolve) => httpServer.close(resolve));
  }

  if (integrationStubServer) {
    await new Promise((resolve) => integrationStubServer.close(resolve));
  }

  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

test('registers, logs in, and fetches profile with auth-compatible shape', async () => {
  const registerResponse = await requestAgent.post('/api/auth/register').send(testUser);
  assert.equal(registerResponse.statusCode, 201);
  assert.equal(registerResponse.body.success, true);
  assert.equal(registerResponse.body.user.email, testUser.email);
  assert.equal(registerResponse.body.user.profile.firstName, testUser.firstName);

  const loginResponse = await requestAgent.post('/api/auth/login').send({
    email: testUser.email,
    password: testUser.password
  });
  assert.equal(loginResponse.statusCode, 200);
  assert.ok(loginResponse.body.token);

  const profileResponse = await requestAgent
    .get('/api/auth/profile')
    .set('Authorization', `Bearer ${loginResponse.body.token}`);

  assert.equal(profileResponse.statusCode, 200);
  assert.equal(profileResponse.body.user.profile.company, testUser.company);
});

test('creates, updates, lists, and deletes chatbots', async () => {
  await User.deleteMany({});
  const token = await registerAndLogin();

  const createResponse = await requestAgent
    .post('/api/chatbots')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Support Bot',
      description: 'Helps customers',
      status: 'draft',
      businessProfile: {
        businessName: 'Acme Support',
        industry: 'SaaS',
        targetAudience: 'Operations teams',
        goals: ['qualify leads', 'reduce support load']
      },
      automation: {
        leadCaptureEnabled: true,
        primaryCallToAction: 'Book a demo'
      }
    });

  assert.equal(createResponse.statusCode, 201);
  assert.equal(createResponse.body.chatbot.config.model, 'llama-3.3-70b-versatile');
  assert.equal(createResponse.body.chatbot.businessProfile.industry, 'SaaS');
  assert.equal(createResponse.body.chatbot.automation.primaryCallToAction, 'Book a demo');

  const chatbotId = createResponse.body.chatbot._id;

  const listResponse = await requestAgent
    .get('/api/chatbots')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(listResponse.statusCode, 200);
  assert.equal(listResponse.body.chatbots.length, 1);

  const updateResponse = await requestAgent
    .put(`/api/chatbots/${chatbotId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      status: 'active',
      config: {
        temperature: 0.3,
        maxTokens: 700
      }
    });

  assert.equal(updateResponse.statusCode, 200);
  assert.equal(updateResponse.body.chatbot.status, 'active');
  assert.equal(updateResponse.body.chatbot.config.temperature, 0.3);

  const keyResponse = await requestAgent
    .get(`/api/chatbots/${chatbotId}/key`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(keyResponse.statusCode, 200);
  assert.match(keyResponse.body.deploymentKey, /^mm_/);

  const deleteResponse = await requestAgent
    .delete(`/api/chatbots/${chatbotId}`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(deleteResponse.statusCode, 200);
});

test('creates and tests integrations for an owned chatbot', async () => {
  await User.deleteMany({});
  const token = await registerAndLogin();

  const chatbotResponse = await requestAgent
    .post('/api/chatbots')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Integration Bot' });

  const integrationResponse = await requestAgent
    .post('/api/integrations')
    .set('Authorization', `Bearer ${token}`)
    .send({
      chatbotId: chatbotResponse.body.chatbot._id,
      name: 'Lookup API',
      type: 'rest_api',
      config: {
        baseUrl: integrationBaseUrl,
        endpoints: [
          {
            path: '/lookup',
            method: 'GET',
            description: 'Lookup endpoint'
          }
        ]
      }
    });

  assert.equal(integrationResponse.statusCode, 201);

  const testResponse = await requestAgent
    .post(`/api/integrations/${integrationResponse.body.integration._id}/test`)
    .set('Authorization', `Bearer ${token}`)
    .send({});

  assert.equal(testResponse.statusCode, 200);
  assert.equal(testResponse.body.result.success, true);
  assert.equal(testResponse.body.result.response.status, 200);
});

test('streams chat over SSE and stores conversation analytics', async () => {
  await User.deleteMany({});
  const token = await registerAndLogin();

  const chatbotResponse = await requestAgent
    .post('/api/chatbots')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'SSE Bot', status: 'active' });

  const sseResponse = await requestAgent
    .post(`/api/chat/${chatbotResponse.body.chatbot._id}/message`)
    .set('Authorization', `Bearer ${token}`)
    .send({ message: 'Hello from SSE. My name is Ayan and my email is ayan@example.com. I need pricing for my company Acme.' });

  assert.equal(sseResponse.statusCode, 200);
  assert.match(sseResponse.text, /event: chunk/);
  assert.match(sseResponse.text, /event: done/);

  const doneLine = sseResponse.text
    .split('\n')
    .find((line) => line.startsWith('data: {"conversationId"'));
  const payload = JSON.parse(doneLine.replace('data: ', ''));

  const conversationResponse = await requestAgent
    .get(`/api/conversations/${payload.conversationId}`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(conversationResponse.statusCode, 200);
  assert.equal(conversationResponse.body.conversation.messages.length, 2);

  const analyticsResponse = await requestAgent
    .get(`/api/analytics/${chatbotResponse.body.chatbot._id}`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(analyticsResponse.statusCode, 200);
  assert.equal(analyticsResponse.body.analytics.stats.totalConversations, 1);
  assert.equal(analyticsResponse.body.analytics.stats.leadsCaptured, 1);
  assert.equal(analyticsResponse.body.analytics.stats.escalationsTriggered, 1);

  const usageResponse = await requestAgent
    .get(`/api/usage/${chatbotResponse.body.chatbot._id}`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(usageResponse.statusCode, 200);
  assert.equal(usageResponse.body.usage.leadsCaptured, 1);
});

test('streams chat over socket.io', async () => {
  await User.deleteMany({});
  const token = await registerAndLogin();

  const chatbotResponse = await requestAgent
    .post('/api/chatbots')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Socket Bot', status: 'active' });

  const socket = createSocketClient(socketBaseUrl, {
    auth: { token },
    transports: ['websocket']
  });

  const completion = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Socket test timed out')), 15000);

    socket.on('connect', () => {
      socket.emit('send_message', {
        chatbotId: chatbotResponse.body.chatbot._id,
        message: 'Hello from socket'
      });
    });

    socket.on('chat_error', (payload) => {
      clearTimeout(timeout);
      reject(new Error(payload.message || 'Socket chat failed'));
    });

    socket.on('response_done', (payload) => {
      clearTimeout(timeout);
      resolve(payload);
    });
  });

  assert.ok(completion.conversationId);
  assert.ok(completion.content);
  socket.disconnect();
});

test('legacy campaign routes are no longer mounted', async () => {
  const response = await requestAgent.get('/api/campaigns');
  assert.equal(response.statusCode, 404);
});
