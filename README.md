# MarketMind AI

MarketMind AI is a business-focused AI chatbot platform that helps teams build custom assistants for support, lead capture, customer engagement, and business automation.

## What It Does
- Create and manage multiple business chatbots with custom prompts, model settings, and welcome flows.
- Connect REST APIs and webhooks so chatbots can respond using real business data.
- Support real-time chat through Socket.IO with SSE fallback.
- Capture business signals such as lead intent, escalation triggers, token usage, and top customer questions.
- Provide analytics for conversations, messages, usage, leads captured, and escalations triggered.

## Business Use Cases
- Customer support assistants
- Sales qualification bots
- Demo booking assistants
- FAQ and product-information bots
- Internal business help assistants connected to existing APIs

## Tech Stack
- Frontend: React, Vite, Tailwind CSS, Recharts
- Backend: Node.js, Express, Mongoose
- Database: MongoDB
- AI provider: Groq
- Real-time transport: Socket.IO and Server-Sent Events

## Project Structure
```text
MarketMind_AI/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   └── pages/
├── server/
│   ├── database.js
│   ├── services.js
│   ├── server.js
│   └── test/
├── API_DOCUMENTATION.md
├── ARCHITECTURE.md
├── DEVELOPER_GUIDE.md
├── DEPLOYMENT.md
├── SETUP_GUIDE.md
└── STATUS_REPORT.md
```

## Quick Start
1. Install dependencies in `server/` and `client/`.
2. Copy `server/.env.example` to `server/.env`.
3. Copy `client/.env.example` to `client/.env`.
4. Set `MONGODB_URI`, `JWT_SECRET`, and `GROQ_API_KEY` in the backend env file.
5. Run the backend with `npm run dev` inside `server/`.
6. Run the frontend with `npm run dev` inside `client/`.

## Verification
- Backend automated tests pass.
- Frontend lint passes.
- Frontend production build passes.

## Documentation
- [SETUP_GUIDE.md](/c:/Ayan/Coding/Web%20Development/Project/MarketMind%20AI/MarketMind_AI/SETUP_GUIDE.md)
- [API_DOCUMENTATION.md](/c:/Ayan/Coding/Web%20Development/Project/MarketMind%20AI/MarketMind_AI/API_DOCUMENTATION.md)
- [ARCHITECTURE.md](/c:/Ayan/Coding/Web%20Development/Project/MarketMind%20AI/MarketMind_AI/ARCHITECTURE.md)
- [DEVELOPER_GUIDE.md](/c:/Ayan/Coding/Web%20Development/Project/MarketMind%20AI/MarketMind_AI/DEVELOPER_GUIDE.md)
- [DEPLOYMENT.md](/c:/Ayan/Coding/Web%20Development/Project/MarketMind%20AI/MarketMind_AI/DEPLOYMENT.md)
- [STATUS_REPORT.md](/c:/Ayan/Coding/Web%20Development/Project/MarketMind%20AI/MarketMind_AI/STATUS_REPORT.md)

## Current Status
- Core implementation is done from the codebase side.
- Remaining work is mainly live-environment rollout, real credential validation, and production infrastructure setup.
