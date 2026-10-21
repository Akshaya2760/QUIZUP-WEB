# 🚀 QUIZUP — Smart Quiz & Learning Platform

**QUIZUP** is an interactive online quiz platform designed to make learning more engaging, organized, and accessible. It provides a digital space where students can register, participate in quizzes, track their performance, and improve their knowledge through an engaging user experience.

🌐 **Live Demo:** [Visit QUIZUP](https://quizup-gm125567l-bodhi4.vercel.app/)

## ✨ Features

- 🔐 **User Authentication** — Student registration and login.
- 🛡️ **Admin Approval System** — Admin approval for student access.
- 🧠 **Interactive Quizzes** — Participate in quizzes and test your knowledge.
- 📊 **Performance Tracking** — Review quiz results and previous activity.
- 💾 **Database Integration** — MongoDB Atlas for persistent data storage.
- 🤖 **AI-Powered Assistance** — AI chatbot support for an interactive learning experience.
- 🎨 **Modern UI** — Attractive interface with animated backgrounds and responsive design.
- ☁️ **Cloud Deployment** — Hosted on Vercel for online access.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| HTML, CSS & JavaScript | User interface and interactivity |
| Node.js | Server-side runtime |
| Express.js | Backend and API development |
| MongoDB Atlas | Cloud database |
| Vercel | Deployment and hosting |
| Gemini API | AI-powered features, when configured |

*The technologies listed reflect the intended project setup; actual dependencies may vary with the final implementation.*

## 🚀 Getting Started

### Prerequisites

- Node.js and npm
- A MongoDB Atlas account
- Git
- A Gemini API key, if AI features are enabled

### Installation

1. Clone the repository:

   ```bash
   git clone YOUR_GITHUB_REPOSITORY_URL
   ```

2. Open the project directory:

   ```bash
   cd quizup
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Create a `.env` file in the project root and configure the required environment variables.

   ```env
   MONGODB_URI=your_mongodb_connection_string
   SESSION_SECRET=your_secure_random_secret
   GEMINI_API_KEY=your_gemini_api_key
   APP_URL=http://localhost:3000
   ```

   Replace the example values with your actual configuration. Include only variables required by your application.

5. Start the application using the command specified in your `package.json`, for example:

   ```bash
   npm start
   ```

   If your project uses a different start script, use the appropriate command.

## 🔒 Security

- Store credentials and API keys in environment variables.
- Never commit your `.env` file to GitHub.
- Configure environment variables separately in Vercel for production.
- Use secure authentication and session management.
- Restrict database access appropriately.

## 🌍 Live Application

Try the deployed version of QUIZUP:

**[https://quizup-gm125567l-bodhi4.vercel.app/](https://quizup-gm125567l-bodhi4.vercel.app/)**

## 🎯 Project Goal

The goal of QUIZUP is to create a smarter, more engaging quiz experience that combines technology, interactive learning, and performance tracking in one platform.

## 👩‍💻 Developed By

Created as a student technology project with a focus on interactive web development, database integration, and AI-assisted learning.

---

⭐ **QUIZUP — Learn. Play. Challenge Yourself. Grow.**
