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