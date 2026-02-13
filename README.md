# upGrad Interviewer 🤖

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Electron](https://img.shields.io/badge/Electron-47848F?style=flat&logo=electron&logoColor=white)](https://www.electronjs.org/)

**upGrad Interviewer** is a versatile, AI-powered educational platform designed for **In-class** and **Post-class** environments. It serves as a dual-purpose tool: an **AI Interviewer** for concept validation and a **Project Interviewer** for technical depth assessment. By providing a realistic simulation of technical discussions, it helps students reinforce classroom learning and prepare for real-world professional evaluations with real-time feedback and comprehensive analytics.

---

## 🎓 Educational Workflows

### 🏫 In-Class Validation (AI Interviewer)
Used during live sessions to instantly verify if students have grasped the core concepts. It provides an interactive way for instructors to gauge class understanding and for students to identify immediate knowledge gaps.

### 🏠 Post-Class Mastery (AI Interviewer)
Students can use the tool after class to practice real-world interview scenarios. By utilizing the detailed feedback and ratings provided after each session, they can refine their technical communication and deepen their understanding of subject matter.

### 🏗️ Post-Project Readiness (Project Interviewer)
Designed to be used any time after a project is completed. This module prepares students for rigorous project defense and technical interviews by simulating deep-dive questions into their architecture, tech stack, and implementation choices.

---

## 🚀 Key Features

### 🛠️ Project-Based Interviews
Tailor your practice session by providing project titles, descriptions, and tech stacks. The AI deep-dives into your specific implementation details, testing your architectural decisions and technical depth.

### 📚 Subject-Specific Practice
Choose from a wide range of preset Computer Science subjects including:
- Data Structures & Algorithms
- Database Management Systems
- System Design
- Operating Systems
- Machine Learning
- Computer Networks

### 🧠 Dual LLM Engine
Flexibility in choosing your AI backbone:
- **Cloud-Based (Gemini)**: Leverage Google's state-of-the-art Gemini Pro models for high-quality, nuanced interviewing.
- **Local-Based (Ollama)**: Maintain privacy and reduce latency by running models like `gemma3:4b` locally.

### 🎙️ Immersive Voice Interaction
Experience natural conversations with built-in:
- **Speech-to-Text (STT)**: Voice your answers directly.
- **Text-to-Speech (TTS)**: Listen to the interviewer's questions for a more realistic experience.

### 📊 Real-time Analysis & Feedback
Receive instant, constructive feedback after every answer, including:
- **Score/Rating**: Objective assessment of your response.
- **Sample Answers**: High-quality examples of how to improve.
- **Common Mistakes**: Insights into typical pitfalls for specific topics.

### 📈 Detailed Performance Reports
At the end of each session, get a comprehensive summary highlighting:
- **Strengths & Weaknesses**: Clear identification of where you excel and where you need improvement.
- **Revision Topics**: Personalized study recommendations.
- **Project Improvement Suggestions**: Actionable advice to enhance your projects.

---

## 💻 Tech Stack

### Frontend
- **Framework**: [React](https://reactjs.org/) with [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **State Management**: [TanStack Query](https://tanstack.com/query/latest) (React Query)
- **Routing**: [Wouter](https://github.com/molecula-js/wouter)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/)
- **Server**: [Express](https://expressjs.com/)
- **Database/ORM**: [Drizzle ORM](https://orm.drizzle.team/) (PostgreSQL ready, currently running on In-Memory Storage)
- **Integration**: Google Sheets API (Analytics recording)

### AI Integration
- **Google Generative AI SDK**: For Gemini Pro integration.
- **Ollama**: For local LLM orchestration.
- **Custom Provider Pattern**: Extensible architecture for adding new LLM providers.

### Desktop
- **Shell**: [Electron](https://www.electronjs.org/)
- **Build Tools**: [Vite](https://vitejs.dev/), [ESBuild](https://esbuild.github.io/), [Electron Builder](https://www.electron.build/)

---

## 📂 Project Structure

```text
├── client/          # React frontend application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── context/     # LLM and Auth contexts
│   │   ├── hooks/       # Custom React hooks
│   │   └── pages/       # Application views (Home, Dashboard, Interview, etc.)
├── server/          # Express backend application
│   ├── lib/llm/     # LLM provider implementations (Gemini, Ollama)
│   ├── routes.ts    # API endpoints
│   └── storage.ts   # Data persistence layer
├── shared/          # Shared types and schemas (Zod/Drizzle)
├── electron/        # Electron main process and configuration
├── release/         # Built desktop applications
└── script/          # Build and deployment scripts
```

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Ollama** (Optional): For local LLM support. [Download here](https://ollama.com/)
- **Gemini API Key** (Optional): For cloud LLM support. [Get it here](https://aistudio.google.com/app/apikey)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd upgrad-interviewer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory (if needed for production/deployment):
   ```env
   DATABASE_URL=your_postgresql_url
   GEMINI_API_KEY=your_api_key
   ```

4. **Run in Development Mode**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5001`.

---

## 📦 Desktop Application

### Build & Run Electron
To run the application as a desktop app in development:
```bash
npm run electron:dev
```

### Create Production DMG (macOS)
To package the application for distribution:
```bash
./make_dmg.sh
```
The output will be located in the `release/` directory.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Developed with ❤️ by the upGrad Team.
