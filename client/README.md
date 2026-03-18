# MarketMind AI Client

This package contains the React frontend for the MarketMind AI chatbot workspace.

## Features
- Authenticated dashboard for chatbot management
- Chatbot builder for prompts, limits, and integrations
- Real-time chat interface using Socket.IO with SSE fallback
- Analytics view for usage and top questions
- Route-level lazy loading for the main pages

## Environment
Copy `.env.example` to `.env` and set:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_APP_NAME=MarketMind AI
VITE_APP_VERSION=1.0.0
```

## Commands
```bash
npm install
npm run dev
npm run lint
npm run build
```

## Notes
- The frontend expects the backend to expose the chatbot-platform routes documented in the root `API_DOCUMENTATION.md`.
- Login/register still use the compatible auth contract preserved during the rebuild.
