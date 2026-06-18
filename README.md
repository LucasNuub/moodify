# Moodify 🎵

> Describe how you feel. Get the perfect songs for it.

An AI-powered mood playlist curator built with React + Groq (Llama 3). Pick a mood category, describe your vibe in your own words, choose Hindi or English — and get a curated playlist in seconds. Each song links straight to Spotify.

---

## Features

- 6 mood categories — Sad, Hype, Late Night, Happy, Reflective, Romantic
- Hindi / English language toggle (Bollywood or English songs)
- Powered by Groq's free Llama 3.3 70B model
- One-click search on Spotify for the full playlist or individual songs
- Dark UI with mood-reactive accent colours

---

## Getting Started

### 1. Get a free Groq API key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up for free (no credit card needed)
3. Click **API Keys** → **Create API Key**
4. Copy the key — it starts with `gsk_`

### 2. Create your `.env` file

In the root of the project, create a file named `.env`:

```
VITE_GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx
```

> This file is in `.gitignore` — it will never be committed.

### 3. Install & run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Tech Stack

| Layer | Tool |
|-------|------|
| Framework | React 19 + Vite |
| AI | Groq API — Llama 3.3 70B Versatile (free tier) |
| Styling | Inline styles, no CSS framework |
| Music | Spotify deep links |

---

## Project Structure

```
moodify/
├── src/
│   ├── App.jsx       # Main app — all UI and API logic
│   └── main.jsx      # React entry point
├── public/
├── index.html
├── vite.config.js
└── .env              # Your API key (not committed)
```

---

made with ❤️ by Lucas
