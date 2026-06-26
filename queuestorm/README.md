# QueueStorm Investigator

QueueStorm Investigator is an AI-powered Support Ops tool that provides both a frontend interface and a robust backend API.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:
- **Node.js** (v16 or higher recommended)
- **npm** (comes with Node.js)
- **Git** (for cloning the repository)

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   ```

2. **Navigate to the project directory:**
   ```bash
   cd queuestorm
   ```

3. **Install Dependencies:**
   You will need to install the Node dependencies for the root project, the backend, and the frontend. Run the following commands:
   
   ```bash

   # Install backend dependencies
   cd backend
   npm install
   cd ..

   # Install frontend dependencies
   cd frontend
   npm install
   cd ..
   ```

## Configuration (Adding API Keys)

The backend requires API keys to communicate with AI models. You need to create an environment variable file in the `backend` directory.

1. Navigate to the `backend` directory.
2. Create a file named `.env`.
3. Add the following content to the `.env` file, replacing the placeholder values with your actual API keys. You can provide keys for the models you intend to use:

   ```env
   PORT=3000

   # AI Model Provider API Keys
   # Gemini API Key (Preferred)
   GEMINI_API_KEY=your_gemini_api_key_here

   # OpenAI API Key
   OPENAI_API_KEY=your_openai_api_key_here

   # Anthropic Claude API Key
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ```

## Running the Project

You can run both the frontend and backend servers simultaneously from the root directory using the provided start script.

**To start the project:**
Ensure you are in the root `queuestorm` directory and run:
```bash
npm run dev
```
This will launch both the backend Node server and the Vite React frontend concurrently.


## How to Use This Project

Once the servers are running:
1. Open your web browser and navigate to the frontend URL (typically `http://localhost:5173` provided by Vite in the terminal).
2. The backend API will be running at `http://localhost:3000`.
3. You can interact with the user interface to perform support ops investigations. The frontend will communicate with the backend API, which in turn will utilize the configured AI models (Gemini, OpenAI, or Anthropic) based on your provided API keys to process the requests.


## Tech Stack
- **Frontend:** React 18, Vite
- **Backend:** Node.js, Express.js
- **AI Integrations:** Gemini API (Fetch), OpenAI API (Fetch), Anthropic SDK

## AI Approach & Safety Logic
The application employs a layered approach to AI-driven ticket resolution:
1. **Prompt Engineering:** The backend constructs detailed context combining the ticket description and transaction history.
2. **AI Inference:** The AI evaluates the evidence to determine the verdict (e.g., consistent, inconsistent), assigns severity, and generates a context-aware customer reply and agent summary.
3. **Deterministic Safety Guardrails (Post-Processing):** After the AI generates a response, a dedicated `safety.service.js` module scans the output. It enforces strict rules:
   - **Credential Protection:** Flags and overrides if the AI asks for a PIN, OTP, or Card Number.
   - **Unauthorized Commitments:** Flags if the AI prematurely confirms a refund, reversal, or account unblock without human approval.
   - **Third-Party Redirection:** Flags if the AI suggests contacting unauthorized channels like WhatsApp, Telegram, or personal phone numbers.
   *If any safety violation is detected, the AI's response is overridden with a standard, safe fallback message, and the ticket is marked for mandatory human review (`human_review_required: true`).*

## MODELS Section
QueueStorm Investigator uses a multi-model fallback strategy to ensure high availability, speed, and cost-effectiveness. The models are executed in the Node.js backend environment.

1. **Gemini 1.5 Flash (Primary)**
   - **Where it runs:** Node.js backend via Google Generative AI REST API.
   - **Why it was chosen:** Extremely fast, highly cost-effective, and offers a massive context window. It also features robust native JSON output capabilities (`responseMimeType: 'application/json'`), which is crucial for our structured API responses.

2. **OpenAI GPT-4o-mini (Fallback 1)**
   - **Where it runs:** Node.js backend via OpenAI REST API.
   - **Why it was chosen:** Provides a strong balance of intelligence and low latency. Excellent at following system prompts and outputting strict JSON objects.

3. **Anthropic Claude 3.5 Haiku (Fallback 2)**
   - **Where it runs:** Node.js backend via `@anthropic-ai/sdk`.
   - **Why it was chosen:** Very fast and possesses strong safety alignments out of the box, making it a reliable final fallback for customer-facing support ops.

## Assumptions
- The input ticket data and transaction history are provided in a structured JSON format.
- The environment has access to at least one valid API key for the LLM providers.
- The primary use case centers around Mobile Financial Services (MFS) and banking support scenarios (e.g., wrong transfers, cash-out issues).

## Known Limitations
- **Hallucinations on Missing Data:** If transaction logs are incomplete or ambiguous, the AI may occasionally hallucinate a resolution.
- **Language Support:** While capable of handling multiple languages, the safety guardrails are primarily optimized for English keywords and standard MFS terminology.
- **No Direct DB Integration:** The current iteration acts as an API layer and does not directly connect to a live production database for autonomous transaction reversals; it only *recommends* actions for human agents.
