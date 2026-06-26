# QueueStorm Investigator

AI-powered support ticket analysis API for digital finance platforms.

## Tech Stack
- **Backend**: Node.js + Express
- **AI**: Claude (Anthropic) via claude-sonnet-4-6
- **Frontend**: React + Vite (optional UI)

## Setup

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
npm start
```

### Endpoints
- `GET /health` → `{"status":"ok"}`
- `POST /analyze-ticket` → structured analysis JSON

## Models Used
- **claude-sonnet-4-6**: Main analysis model. Chosen for speed, structured output quality, and cost efficiency.

## Safety Logic
- Post-LLM scan in `safety.service.js` checks for forbidden phrases (PIN, OTP, refund confirmations)
- Prompt injection in complaint text is neutralized by system prompt isolation
- `human_review_required` is forced true for any safety flag

## Assumptions
- Transaction history is provided by the judge harness in the request body
- No database required; service is stateless
