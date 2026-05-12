# MarketMind AI - Strategic Co-Founder Suite

MarketMind AI is a strategic AI co-founder suite designed to help builders, founders, and marketers validate ideas, plan launches, and analyze competitors before writing a single line of code.

## Core Features
- **Project Workspaces:** Define your startup idea, target audience, competitors, and core features.
- **Market Validation Engine:** Analyzes your project to generate a realistic assessment of market need and sentiment.
- **Launch Plan Generator:** Builds day-by-day organic growth and launch checklists.
- **Competitor Takedown Analyst:** Identifies weaknesses in competitor products to find your market advantage.
- **100-Day Reality Checker:** Projects conservative growth metrics and milestones for the first 100 days.
- **Pitch Simulator:** An interactive AI investor that grills you on your value proposition.

## Tech Stack
- **Frontend:** React 19, Vite, Tailwind CSS v4, Radix UI.
- **Backend:** Node.js, Express, Mongoose.
- **AI:** Groq SDK (Llama 3.3).

## Setup
1. Create a `.env` file in the `server` directory with your `MONGODB_URI`, `JWT_SECRET`, and `GROQ_API_KEY`.
2. Run `npm install` in both the `client` and `server` directories.
3. Start the backend: `cd server && npm run dev`
4. Start the frontend: `cd client && npm run dev`
