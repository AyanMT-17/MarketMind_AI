# MarketMind AI

MarketMind AI is a comprehensive all-in-one marketing platform for small businesses, combining AI-powered chatbots with ad campaign management and business intelligence features.

## Current Product Scope

### Core Features
- Authentication with JWT-based login and registration
- Chatbot CRUD with prompt, model, and rate-limit settings
- REST/webhook integration management
- Server-sent event chat streaming
- WebSocket chat transport with Socket.IO
- Conversation history and export
- Usage analytics and top-question reporting

### Marketing & Analytics Features (v2.1+)
- **Ad Campaign Management**: Create and manage social media ad campaigns across Facebook, Google, Instagram, LinkedIn, TikTok, and Twitter
- **Campaign Performance Tracking**: Monitor impressions, clicks, conversions, CTR, CPC, CPA, and ROI in real-time
- **Business Metrics Management**: Upload quarterly sales and profit data via CSV or manual entry
- **AI-Powered Business Prediction**: Generate detailed forecasts using Groq AI analysis of historical business data
- **Advanced Analytics**: Identify trends, risks, opportunities, and receive strategic recommendations

## Stack
- Frontend: React, Vite, Tailwind CSS, Recharts
- Backend: Node.js, Express, Mongoose
- Database: MongoDB
- AI provider: Groq

## Project Structure
```text
MarketMind_AI/
├── client/
│   └── src/
│       ├── components/
│       ├── contexts/
│       ├── hooks/
│       └── pages/
│           ├── AdCampaignBuilder.jsx      [NEW]
│           ├── BusinessPrediction.jsx     [NEW]
│           └── ...
├── server/
│   ├── database.js                        [UPDATED]
│   ├── services.js                        [UPDATED]
│   └── server.js                          [UPDATED]
├── ARCHITECTURE.md
├── API_DOCUMENTATION.md
├── NEW_FEATURES.md                        [NEW]
└── SETUP_GUIDE.md
```

## Quick Start
See [SETUP_GUIDE.md](/c:/Ayan/Coding/Web%20Development/Project/MarketMind%20AI/MarketMind_AI/SETUP_GUIDE.md) for the full setup.

Basic local flow:
1. Install backend dependencies in `server/`.
2. Install frontend dependencies in `client/`.
3. Create backend `.env` values for `MONGODB_URI`, `JWT_SECRET`, `GROQ_API_KEY`, and `CLIENT_URL`.
4. Set `VITE_API_BASE_URL` in `client/.env`.
5. Run the backend and frontend dev servers.

## Documentation
- Architecture: [ARCHITECTURE.md](/c:/Ayan/Coding/Web%20Development/Project/MarketMind%20AI/MarketMind_AI/ARCHITECTURE.md)
- API reference: [API_DOCUMENTATION.md](/c:/Ayan/Coding/Web%20Development/Project/MarketMind%20AI/MarketMind_AI/API_DOCUMENTATION.md)
- New Features Guide: [NEW_FEATURES.md](/c:/Ayan/Coding/Web%20Development/Project/MarketMind%20AI/MarketMind_AI/NEW_FEATURES.md)
- Setup: [SETUP_GUIDE.md](/c:/Ayan/Coding/Web%20Development/Project/MarketMind%20AI/MarketMind_AI/SETUP_GUIDE.md)
- Deployment: [DEPLOYMENT.md](/c:/Ayan/Coding/Web%20Development/Project/MarketMind%20AI/MarketMind_AI/DEPLOYMENT.md)
- Current status: [STATUS_REPORT.md](/c:/Ayan/Coding/Web%20Development/Project/MarketMind%20AI/MarketMind_AI/STATUS_REPORT.md)

## Status
Implemented:
- Backend chatbot platform rewrite
- Frontend chatbot workspace rewrite
- Lint-clean client build

Still to do:
- Full end-to-end runtime verification against real services
- Production deployment hardening and monitoring
