# MarketMind AI - Strategic Co-Founder Suite

MarketMind AI has evolved into a **Strategic AI Co-Founder Suite**. It is built specifically for founders, indie hackers, and product marketers to rapidly validate ideas, strategize launches, and analyze competitors before investing time into writing code.

By acting as an objective, data-driven co-founder, MarketMind AI forces you to answer the hard questions about your target audience and core value proposition.

---

## 🚀 The Core Philosophy

Many startups fail not because they can't build the product, but because they build the *wrong* product for the *wrong* audience. 

MarketMind AI solves this by wrapping powerful LLMs (powered by the Groq SDK) into strict, structured "Strategy Engines." Instead of chatting blindly with an AI, you define a **Project**, and the system generates actionable, formatted business intelligence.

---

## 🧠 The 5 Strategy Engines

Once you define a project (Name, Description, Target Audience, Competitors, and Core Features), you can run it through our five strategy modules:

1. **Market Validation Engine**
   - **What it does:** Acts as an objective market analyst.
   - **Output:** Scores the market need (1-10), determines overall market sentiment, identifies which pain points your features actually address, and warns you of execution risks.

2. **Launch Plan Generator**
   - **What it does:** Acts as your Go-To-Market (GTM) coach.
   - **Output:** Generates a structured "Prep Phase" checklist, a "Launch Day" action plan, recommended organic growth strategies (e.g., specific subreddits, indie communities), and even drafts your initial social media copy.

3. **Competitor Takedown Analyst**
   - **What it does:** Acts as your competitive intelligence strategist.
   - **Output:** You input a competitor URL, and the AI returns their perceived weaknesses (e.g., "Clunky UI", "High Pricing"), formulates your specific market advantage, and provides a tactical "Attack Strategy" to win over their dissatisfied users.

4. **100-Day Reality Checker**
   - **What it does:** Acts as your growth forecaster.
   - **Output:** Projects conservative, realistic milestones for Day 30, Day 60, and Day 100. It gives you target traffic numbers, user acquisition goals, and identifies the single primary metric you should focus on.

5. **Pitch Simulator**
   - **What it does:** Acts as a ruthless Y-Combinator investor or skeptical customer.
   - **Output:** An interactive, streaming chat interface where you pitch your idea. The AI is instructed to be highly critical, pointing out logical fallacies and challenging your assumptions until your pitch is bulletproof.

---

## 🛠 Tech Stack & Architecture

This project is built using a modern, decoupled architecture focusing on speed and modularity.

### Frontend (`/client`)
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS v4 for utility-first styling.
- **Components:** Radix UI primitives for accessible, unstyled interactive components.
- **Routing:** React Router DOM.
- **Architecture:** Centralized API fetching with exponential backoff (`api-with-retry`), robust Context-based state management (`AuthContext`, `ToastContext`), and custom hooks (`useProjects`) for data fetching.

### Backend (`/server`)
- **Runtime:** Node.js + Express 5
- **Database:** MongoDB (via Mongoose)
- **Authentication:** JWT (JSON Web Tokens) with bcryptjs for password hashing.
- **AI Integration:** Groq SDK utilizing `llama-3.3-70b-versatile` for blazing-fast inference. The backend enforces strict JSON responses from the LLM.
- **Security:** Helmet for HTTP headers, express-rate-limit to prevent abuse.

---

## 📂 Project Structure

```text
MarketMind_AI/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # UI Components (Buttons, Cards, Layouts)
│   │   ├── contexts/       # Auth and Toast state
│   │   ├── hooks/          # useProjects, etc.
│   │   ├── lib/            # API utilities
│   │   └── pages/          # Dashboard, Login, Landing pages
│   └── package.json
└── server/                 # Express Backend
    ├── src/
    │   ├── models/         # Mongoose Schemas (User, Project, StrategyReport)
    │   ├── routes/         # Express API endpoints
    │   ├── services/       # Core business logic (authService, aiStrategyService)
    │   └── test/           # node:test API integration tests
    ├── app.js              # Express app configuration
    ├── server.js           # Entry point
    └── package.json
```

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- Node.js (v20+ recommended)
- MongoDB instance (Local or MongoDB Atlas)
- Groq API Key (Get one at [console.groq.com](https://console.groq.com))

### 2. Environment Variables
Create a `.env` file in the `server/` directory and add the following:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
CLIENT_URL=http://localhost:5173
GROQ_API_KEY=your_groq_api_key
```

### 3. Install Dependencies
Open two terminals.

**Terminal 1 (Backend):**
```bash
cd server
npm install
```

**Terminal 2 (Frontend):**
```bash
cd client
npm install
```

### 4. Start Development Servers

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

Navigate to `http://localhost:5173` in your browser to start planning your next startup!

---

## 🧪 Testing

The backend includes a comprehensive test suite using Node's native test runner and `mongodb-memory-server` to mock the database.

To run the backend tests:
```bash
cd server
npm test
```
