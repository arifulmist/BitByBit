# QueueStorm Investigator

QueueStorm Investigator is an AI-powered SupportOps copilot designed to analyze customer complaints for a digital finance platform (e.g., bKash). It cross-checks complaints against recent transaction logs, classifies issues, routes them to the correct department, evaluates security risks, and drafts safe responses.

---

## 🚀 Quick Start / Setup Runbook

This project contains both the **Express Backend** and **React Frontend**. Follow these steps to run both concurrently.

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Installation & Execution
From the root `queuestorm` directory:

1. **Install Root and Workspace Dependencies**:
   ```bash
   # Install root scripts
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   
   # Go back to root
   cd ..
   ```

2. **Configure Environment Variables**:
   In the `backend` folder, copy the example template to `.env`:
   ```bash
   cd backend
   cp .env.example .env
   ```
   *Note: If no API keys are provided in `.env`, the system automatically runs the local rule-based heuristic analyzer. You do not need API keys to run and test this app!*

3. **Start Frontend and Backend in Parallel**:
   From the root `queuestorm` directory, run:
   ```bash
   npm run dev
   ```
   This will start:
   - **Backend Server** on `http://localhost:3000`
   - **Frontend App** on `http://localhost:5173` (Vite will proxy API requests to port 3000 automatically)

---

## 🔌 API Endpoints

### 1. `GET /health`
Verifies the service status and readiness.
- **Response**: `200 OK`
- **Body**:
  ```json
  { "status": "ok" }
  ```

### 2. `POST /analyze-ticket`
Accepts a ticket payload and returns a structured investigation.
- **Request Body**:
  ```json
  {
    "ticket_id": "TKT-001",
    "complaint": "I sent 5000 BDT to the wrong number +8801719876543 around 2 PM today...",
    "language": "en",
    "channel": "in_app_chat",
    "user_type": "customer",
    "campaign_context": "boishakh_bonanza_day_1",
    "transaction_history": [
      {
        "transaction_id": "TXN-9101",
        "timestamp": "2026-04-14T14:08:22Z",
        "type": "transfer",
        "amount": 5000,
        "counterparty": "+8801719876543",
        "status": "completed"
      }
    ]
  }
  ```
- **Response Body**:
  ```json
  {
    "ticket_id": "TKT-001",
    "relevant_transaction_id": "TXN-9101",
    "evidence_verdict": "consistent",
    "case_type": "wrong_transfer",
    "severity": "high",
    "department": "dispute_resolution",
    "agent_summary": "Customer reports sending 5000 BDT to a wrong wallet.",
    "recommended_next_action": "Hold funds in recipient wallet and contact recipient.",
    "customer_reply": "We have received your wrong transfer complaint. Any eligible amount will be returned through official channels...",
    "human_review_required": true,
    "confidence": 0.9,
    "reason_codes": ["wrong_transfer_claim", "transaction_match"]
  }
  ```

---

## 🤖 MODELS Section

QueueStorm dynamically adapts to available keys in the environment:

1. **Gemini 1.5 Flash (Preferred)**:
   - **Where it runs**: Google AI Cloud via REST API.
   - **Why chosen**: Ultra-fast response latency, native support for JSON schema enforcement via `responseMimeType`, high daily free tier quotas, and massive 1M+ token context window allowing extensive transaction logs to be passed.
2. **OpenAI GPT-4o-mini (First Fallback)**:
   - **Where it runs**: OpenAI Cloud via REST API.
   - **Why chosen**: High schema compliance using `response_format: { type: "json_object" }` and highly competitive cost-efficiency.
3. **Anthropic Claude 3.5 Haiku / Sonnet (Second Fallback)**:
   - **Where it runs**: Anthropic Cloud via the `@anthropic-ai/sdk`.
   - **Why chosen**: Superior reasoning capabilities and strong English/Bengali cross-lingual translation.
4. **Local Heuristic Analyzer (Standalone Fallback)**:
   - **Where it runs**: Runs 100% locally on Node.js.
   - **Why chosen**: Guaranteed zero-dependency execution. If no API keys are provided, the backend analyzes transactions and text using rule-based parsing. The system never crashes and returns perfectly valid JSON data.

---

## 🛡️ Safety Guardrails & Logic

Safety is checked at two separate boundaries:

1. **System Prompt Level**:
   The AI models are instructed with strict rules to ignore prompt injection (instructions embedded inside the complaint) and to follow safety enums.
2. **Post-Processing Service (`safety.service.js`)**:
   Every response drafted by the LLM is scanned before it leaves the API. We scan for:
   - **Credential Theft**: Requests for PIN, OTP, password, card numbers, or CVV.
   - **Unauthorized Commitments**: Explicit statements like "we will refund you", "we will reverse", "unblock your account".
   - **Suspicious Redirections**: Directing customers to WhatsApp, Telegram, or unofficial phone numbers.
   
   If any check triggers a flag, **the backend automatically overrides the reply** with a standard official template, forces `human_review_required` to `true`, and appends `safety_flag` to the reasons.

---

## 🧠 Assumptions and Limitations

- **Stateless Design**: No database is required as both the complaint and transaction history are provided dynamically in the request body.
- **Language**: The local heuristic fallback is optimized for English, Bengali, and Banglish (English letters spelling Bengali words) keyword variants.
