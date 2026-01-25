# Project Interviewer

An AI-powered technical interview simulator designed to help students and professionals practice project-based and subject-specific interviews.

## Features

- **Project-Based Interviews**: Enter your project details (title, description, tech stack) and get tailored questions testing your architectural decisions and technical depth.
- **Subject-Specific Practice**: Choose from preset Computer Science subjects (Data Structures, Algorithms, System Design, etc.) to practice fundamental concepts.
- **Dual LLM Support**:
  - **Cloud LLM**: Integration with Google Gemini (requires API Key).
  - **Local LLM**: Support for Ollama (running locally with `gemma3:4b` or similar models).
- **Voice Interaction**: Speak your answers and hear the interviewer's questions using browser-based Speech-to-Text and Text-to-Speech.
- **Real-time Feedback**: Get instant feedback on your answers, including ratings, improvements, and sample answers.
- **Comprehensive Summary**: Receive a detailed performance report with strengths, weaknesses, and revision topics after each session.

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion, Shadcn UI
- **Backend**: Node.js, Express
- **Storage**: In-Memory Storage (Demo Mode) - *Easily extensible to PostgreSQL/Drizzle*
- **AI Integration**:
  - Google Generative AI SDK (Gemini)
  - Custom Ollama Provider (Local)

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- **For Local LLM**: [Ollama](https://ollama.com/) installed and running (`ollama run gemma3:4b`)
- **For Cloud LLM**: A [Google Gemini API Key](https://aistudio.google.com/app/apikey)

## Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd Project-Interviewer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser at `http://localhost:5001`.

## Usage

1. **Select Interview Type**:
   - **Project**: Fill in your project details.
   - **Subject**: Select a CS topic from the dashboard.
2. **Choose AI Provider**:
   - **Gemini**: Enter your API key (stored temporarily in session).
   - **Ollama**: Ensure Ollama is running locally.
3. **Start Interview**: Answer the questions via text or voice.
4. **Review**: End the session to see your detailed summary and analytics.

## License

MIT
