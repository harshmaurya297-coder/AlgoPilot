# AlgoPilot AI 🚀

**An AI-powered DSA learning and problem-solving assistant.**

AlgoPilot AI helps developers improve their Data Structures and Algorithms (DSA) skills through AI-powered problem discovery, personalized recommendations, and structured problem-solving guidance.

## ✨ Features

- 🤖 **AI Problem Assistant** — Get AI-powered assistance for DSA problems.
- 🔎 **Smart Problem Discovery** — Discover relevant problems across different DSA topics.
- 🧠 **Topic-Based Learning** — Explore arrays, strings, binary search, trees, graphs, dynamic programming, and more.
- 🎯 **Personalized Recommendations** — Work toward improving your problem-solving skills with relevant practice suggestions.
- 🔗 **Direct Problem Links** — Navigate to external problem pages to practice.
- ⚡ **Modern Dashboard** — A responsive interface built with Next.js and TypeScript.
- 🗄️ **Supabase Integration** — Backend services and data storage.

## 🛠️ Tech Stack

- **Frontend:** Next.js, React, TypeScript
- **Styling:** CSS
- **Backend and Database:** Supabase
- **AI Integration:** AI-powered problem assistance
- **Development Tools:** Node.js, npm, Git, GitHub

## 📋 Prerequisites

Before running the project, install:

- [Node.js](https://nodejs.org/)
- npm (included with Node.js)
- A [Supabase](https://supabase.com/) account
- An AI provider API key if your configured AI service requires one

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/harshmaurya297-coder/AlgoPilot.git
cd AlgoPilot
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root and add the variables required by your application.

Example:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
AI_API_KEY=your_ai_api_key
```

Use the exact variable names expected by your code. The AI key shown here is an example; never commit real API keys or secrets to GitHub.

### 4. Start the development server

```bash
npm run dev
```

### 5. Open the application

Visit [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```text
algopilot-ai/
├── app/
│   ├── api/
│   │   └── assistant/
│   │       ├── discover/
│   │       └── organise/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── AIProblemAssistant.tsx
├── lib/
├── public/
├── .env.local
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

*Note: This is an overview of the current project structure; additional files may exist.*

## 🎯 Project Goal

The goal of AlgoPilot AI is to make DSA practice more organized, accessible, and personalized by helping learners discover suitable problems and develop stronger problem-solving skills.

## 🗺️ Future Improvements

- Adaptive problem recommendations based on learner progress
- Topic-wise DSA roadmaps and checklists
- Progress tracking and analytics
- Difficulty-aware problem suggestions
- Improved AI explanations and hints
- Integration with additional coding platforms

## 🤝 Contributing

Contributions, bug reports, and feature suggestions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Submit a pull request.

## 📄 License

See the [LICENSE](LICENSE) file for the project's licensing terms.

---

**Built to make DSA practice smarter. Keep learning, keep solving.** 💻
