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
- Backend: Node.js, Express, Mongoose, Socket.IO
- Database: MongoDB
- AI provider: Groq
- Real-time transport: Socket.IO and Server-Sent Events
- Authentication: JWT
- Testing: Jest (backend)

## Project Structure
```
MarketMind_AI/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── Layout.jsx
│   │   │   │   └── Sidebar.jsx
│   │   │   └── UI/
│   │   │       ├── Button.jsx
│   │   │       ├── Card.jsx
│   │   │       ├── Input.jsx
│   │   │       ├── LoadingSpinner.jsx
│   │   │       └── Toast.jsx
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ToastContext.jsx
│   │   ├── hooks/
│   │   │   ├── useAgents.js
│   │   │   ├── useChat.js
│   │   │   └── useChatbot.js
│   │   ├── lib/
│   │   │   ├── api.js
│   │   │   └── api-with-retry.js
│   │   ├── pages/
│   │   │   ├── AdCampaignBuilder.jsx
│   │   │   ├── AgentHub.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── BusinessPrediction.jsx
│   │   │   ├── ChatbotBuilder.jsx
│   │   │   ├── ChatInterface.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── README.md
│   └── vite.config.js
├── server/
│   ├── src/
│   │   ├── app.js
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   │   └── database.js
│   │   ├── routes/
│   │   │   ├── agents.js
│   │   │   ├── auth.js
│   │   │   ├── business.js
│   │   │   ├── campaigns.js
│   │   │   ├── chat.js
│   │   │   ├── chatbot.js
│   │   │   ├── emailSettings.js
│   │   │   ├── integration.js
│   │   │   ├── predictions.js
│   │   │   └── utils.js
│   │   ├── services/
│   │   │   ├── adBusiness.js
│   │   │   ├── authAndValidation.js
│   │   │   ├── chatbotIntegration.js
│   │   │   ├── conversationAI.js
│   │   │   ├── emailAgent.js
│   │   │   ├── index.js
│   │   │   └── legacyServices.js
│   │   ├── test/
│   │   │   └── api.test.js
│   │   └── utils/
│   ├── package.json
│   ├── server.js
│   └── vercel.json
├── docs/
├── shared/
├── API_DOCUMENTATION.md
├── ARCHITECTURE.md
├── DEVELOPER_GUIDE.md
├── DEPLOYMENT.md
├── README.md
├── SETUP_GUIDE.md
└── STATUS_REPORT.md
```

## Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Groq API key (for AI functionality)

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
- [SETUP_GUIDE.md](SETUP_GUIDE.md)
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)
- [DEPLOYMENT.md](DEPLOYMENT.md)
- [STATUS_REPORT.md](STATUS_REPORT.md)

## Current Status
- Core implementation is done from the codebase side.
- Remaining work is mainly live-environment rollout, real credential validation, and production infrastructure setup.

## Contributing
Contributions are welcome! Please read the [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) for guidelines on how to contribute to this project.

## License
This project is licensed under the MIT License.
