# 🎓 LectureLens AI

> **Team AIforAI · IIT Guwahati · Track 3**
> Convert lecture recordings and board photos into structured notes, adaptive quizzes, and smart summaries — powered by Groq LLaMA, Groq Whisper, and ElevenLabs.

---

## What It Does

LectureLens AI takes raw classroom content — an audio recording or a photo of the blackboard — and transforms it into a full personalized learning experience in 3 stages.

```
📷 Photo / 🎙 Audio
        ↓
  Stage 1 — Extract
  (Groq Vision / Groq Whisper)
        ↓
  Stage 2 — Understand
  (LLaMA 3.3 generates structured notes)
        ↓
  Stage 3 — Learn
  (Adaptive Quiz · Smart Summary · Audio Explanation)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express |
| LLM (text) | Groq — LLaMA 3.3 70b |
| LLM (vision/image OCR) | Groq — Llama 4 Scout Vision |
| Audio transcription | Groq — Whisper Large v3 |
| Text to Speech | ElevenLabs — Multilingual v2 |
| Frontend | Vanilla HTML + CSS + JS (no framework) |

---

## Project Structure

```
lecturelens/
│
├── backend/
│   ├── server.js                   # Express server, routes, static serving
│   ├── middleware/
│   │   └── azureClient.js          # Groq API client (LLM + Vision)
│   └── routes/
│       ├── transcribe.js           # POST /api/transcribe/image & /audio
│       ├── process.js              # POST /api/process/notes
│       ├── learn.js                # POST /api/learn/quiz & /summary
│       └── speech.js               # POST /api/speech/synthesize
│
├── frontend/
│   ├── index.html                  # Landing page
│   ├── css/
│   │   └── styles.css              # Global design system (dark theme)
│   ├── js/
│   │   └── utils.js                # Shared helpers: Store, showToast, apiPost, apiUpload
│   └── pages/
│       ├── capture.html            # Stage 1 — Upload audio or image
│       ├── notes.html              # Stage 2 — View structured notes
│       ├── learn.html              # Stage 3 — Choose quiz / summary / audio
│       ├── quiz.html               # Interactive quiz with scoring
│       └── summary.html            # Smart summary display
│
├── .env.example                    # Environment variable template
├── package.json
└── README.md
```

---

## API Endpoints

| Method | Endpoint | What it does |
|--------|----------|--------------|
| `POST` | `/api/transcribe/image` | Extract text from board photo using Groq Vision |
| `POST` | `/api/transcribe/audio` | Transcribe lecture audio using Groq Whisper |
| `POST` | `/api/process/notes` | Generate structured notes from transcript |
| `POST` | `/api/learn/quiz` | Generate adaptive quiz from notes |
| `POST` | `/api/learn/summary` | Generate smart summary from notes |
| `POST` | `/api/speech/synthesize` | Convert text to audio via ElevenLabs |
| `GET`  | `/api/health` | Check server + API key status |

---

## Local Setup

### Prerequisites

- **Node.js** v18 or higher — [nodejs.org](https://nodejs.org)
- **npm** (comes with Node)
- 3 free API keys (see below)

---

### Step 1 — Get Your API Keys

All three are free. No credit card needed for Groq.

**Groq** (handles LLM + vision + audio — one key for everything)
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up → API Keys → Create API Key
3. Copy your key (starts with `gsk_...`)

**ElevenLabs** (text to speech)
1. Go to [elevenlabs.io](https://elevenlabs.io)
2. Sign up free → click your avatar → Profile → API Key
3. Copy your key

---

### Step 2 — Clone and Install

```bash
# Clone the repo
git clone https://github.com/your-username/lecturelens-ai.git
cd lecturelens-ai
```

---

### Step 3 — Configure Environment

Create a new file named `.env` in the root of the project folder and add the following:

```env
GROQ_API_KEY=gsk_your_groq_key_here
ELEVENLABS_API_KEY=your_elevenlabs_key_here
PORT=3000
```

Replace the values with your actual keys from Step 1.

> ⚠️ Never commit your `.env` file to Git. Add `.env` to your `.gitignore` if it isn't already there.

---

### Step 4 — Install Dependencies

```bash
# Install dependencies
npm install
```

This installs Express, Multer, CORS, dotenv, and Nodemon from `package.json`.

---

### Step 5 — Run

```bash
# Development (auto-restarts on file changes)
npm run dev

# OR production
npm start
```

Open your browser at **[http://localhost:3000](http://localhost:3000)**

You should see the terminal print:

```
------------------------------------
🎓 LectureLens AI running
🌐 http://localhost:3000
✅ Groq key:       SET
✅ ElevenLabs key: SET
------------------------------------
```

---

## How to Use

**1. Capture** → Go to `/capture`
- Upload an audio lecture file (MP3, WAV, M4A, WebM) **or** a photo of a blackboard/notes (JPG, PNG)
- Click **Extract Text** — the AI reads everything in the image or transcribes the audio
- Click **Process with AI** — LLaMA organizes it into structured notes

**2. Notes** → Automatically opens at `/notes`
- View your notes broken into sections with key points, glossary, and study tips
- A sidebar shows the topic hierarchy and concept tags

**3. Learn** → Click **Personalized Learning** to go to `/learn`
- Choose one of three modes:
  - 🧪 **Adaptive Quiz** — configure difficulty level and number of questions
  - 📋 **Smart Summary** — quick recap, exam focus, or concept map
  - 🔊 **Audio Explanation** — listen to your notes in English or Hindi voice

---

## Dependencies

```json
"express"           — web server
"multer"            — file upload handling
"cors"              — cross-origin requests
"dotenv"            — environment variables
"nodemon"           — dev auto-restart (devDependency)
```

Install all with `npm install`.

---

## Common Errors

| Error | Fix |
|-------|-----|
| `GROQ_API_KEY not set` | Check your `.env` file — make sure the key is on one line with no spaces |
| `Groq error: rate limit` | Groq free tier allows ~30 requests/min. Wait a few seconds and retry |
| `No image file uploaded` | Make sure you clicked **Browse Image File** and selected a file before clicking Extract |
| `AI returned invalid JSON` | Retry — occasional LLM formatting issue, usually resolves on second attempt |
| `ElevenLabs HTTP 401` | Your ElevenLabs key is wrong or expired — generate a new one |
| Port already in use | Change `PORT=3001` in `.env` |

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | ✅ Yes | Used for image OCR, audio transcription, notes, quiz, and summary |
| `ELEVENLABS_API_KEY` | ✅ Yes | Used for text-to-speech audio generation |
| `PORT` | No | Server port — defaults to `3000` |

---

## Notes for Contributors

- All frontend state is stored in `sessionStorage` via the `Store` helper in `utils.js` — no database needed
- The file `azureClient.js` is named for legacy reasons but now calls the **Groq API**, not Azure
- All API routes are in `backend/routes/` — each file maps to one feature
- The frontend uses no build tools or frameworks — edit HTML/CSS/JS files directly

---

*LectureLens AI — Team AIforAI · IIT Guwahati*