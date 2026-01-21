# 🎥 AI Video Summarizer

An AI-powered web application that summarizes YouTube videos by extracting captions and generating clean, readable summaries using a modern UI.

Built with **Next.js**, **Gemini API**, and **Tailwind CSS**, this project demonstrates a complete full-stack AI workflow — from video input to structured AI output.

---

## ✨ Features

- 🔗 Paste any **public YouTube video link**
- 📝 Automatically extracts **captions / subtitles**
- 🤖 Generates an **AI-powered summary** using Gemini
- 🎨 Elegant, light-themed **modern UI**
- 📋 Copy or download summaries
- 🚀 No database — fast, stateless, and simple
- 🛠️ Fallback logic for subtitles using `yt-dlp`

---

## 🖥️ Demo

Run locally and open:

http://localhost:3000


Paste a YouTube link and click **Summarize**.

---

## 🧠 How It Works

1. User submits a YouTube URL
2. Backend tries:
   - YouTube captions API (fast path)
   - Subtitle download via `yt-dlp`
3. Transcript is cleaned and sent to **Gemini API**
4. AI generates a formatted summary
5. Result is returned instantly to the frontend

---

## 🛠️ Tech Stack

**Frontend**
- Next.js (App Router)
- React
- Tailwind CSS

**Backend**
- Next.js API Routes
- Node.js
- `yt-dlp`
- `ffmpeg`

**AI**
- Google Gemini API

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/video-summarizer.git
cd video-summarizer
2️⃣ Install dependencies
npm install
3️⃣ Set environment variables
Create a file called .env.local in the project root:

GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_ENDPOINT=your_gemini_endpoint_here
⚠️ Never commit .env files — they are ignored by .gitignore.

4️⃣ Run the development server
npm run dev
Open:

http://localhost:3000
📂 Project Structure
video-summarizer/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── summarize/
│   │   │       └── route.ts
│   │   └── page.tsx
├── public/
├── package.json
├── README.md
└── .gitignore
🚧 Limitations
Works best with videos that have captions or subtitles

Very long videos may require chunking (future improvement)

Private or restricted videos are not supported.
