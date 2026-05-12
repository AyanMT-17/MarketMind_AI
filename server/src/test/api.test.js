import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../app.js';
import { connectDB, User, Project, StrategyReport } from '../models/database.js';
import { authService } from '../services/index.js';

let mongoServer;
let app;
let requestAgent;
let token;
let userId;

test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.JWT_SECRET = 'test-secret';
  delete process.env.GROQ_API_KEY; // Mock Groq output

  await connectDB();
  app = createApp();
  requestAgent = request(app);

  const registerResponse = await requestAgent.post('/api/auth/register').send({
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    password: 'password123',
    company: 'Test Co'
  });
  
  token = registerResponse.body.token;
  userId = registerResponse.body.user._id;
});

test.after(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

test('Project CRUD Operations', async (t) => {
  let projectId;

  await t.test('Create Project', async () => {
    const res = await requestAgent
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'New Startup',
        description: 'An AI assistant for startups',
        targetAudience: 'Founders',
        competitors: ['ChatGPT'],
        coreFeatures: ['Business planning', 'Validation']
      });

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.project.name, 'New Startup');
    projectId = res.body.project._id;
  });

  await t.test('Get Project', async () => {
    const res = await requestAgent
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.project._id, projectId);
  });

  await t.test('Update Project', async () => {
    const res = await requestAgent
      .put(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Startup' });

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.project.name, 'Updated Startup');
  });

  await t.test('List Projects', async () => {
    const res = await requestAgent
      .get('/api/projects')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.projects.length, 1);
    assert.equal(res.body.projects[0].name, 'Updated Startup');
  });
  
  // Create test variables for strategy tests
  const testContext = { projectId };
  t.testContext = testContext;
});

test('Strategy Generation Endpoints', async (t) => {
  // Use a newly created project
  const resProject = await requestAgent
    .post('/api/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Strategy Startup',
      description: 'An AI assistant for strategies',
    });
  const projectId = resProject.body.project._id;

  await t.test('Generate Validation', async () => {
    const res = await requestAgent
      .post(`/api/projects/${projectId}/generate/validation`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.report.type, 'validation');
    assert.ok(res.body.report.data.marketNeed);
  });

  await t.test('Generate Launch Plan', async () => {
    const res = await requestAgent
      .post(`/api/projects/${projectId}/generate/launch-plan`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.report.type, 'launch-plan');
    assert.ok(res.body.report.data.prepPhase);
  });

  await t.test('Get Reports', async () => {
    const res = await requestAgent
      .get(`/api/projects/${projectId}/reports`)
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.reports.length, 2); // validation and launch-plan
  });
});
