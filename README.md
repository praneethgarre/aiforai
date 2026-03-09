# 🎓 LectureLens AI

> Team AIforAI · IIT Guwahati · Track 3

## Quick Start

```bash
# 1. Install
npm install

# 2. Add Azure keys
cp .env.example .env
# Edit .env and add your keys

# 3. Run
npm run dev

# 4. Open browser
# http://localhost:3000
```

## Project Structure
```
lecturelens/
├── backend/
│   ├── server.js
│   ├── middleware/azureClient.js
│   └── routes/
│       ├── transcribe.js   ← Stage 1: audio + image input
│       ├── process.js      ← Stage 2: GPT-4o concept notes
│       ├── learn.js        ← Stage 3: quiz + summary
│       └── speech.js       ← Azure TTS audio
├── frontend/
│   ├── index.html          ← Landing page
│   ├── css/styles.css
│   ├── js/utils.js
│   └── pages/
│       ├── capture.html    ← Upload audio / image
│       ├── notes.html      ← View structured notes
│       ├── learn.html      ← Choose quiz/summary/audio
│       ├── quiz.html       ← Take adaptive quiz
│       └── summary.html    ← View smart summary
├── .env.example
└── package.json
```

## Azure Keys Needed
| Key | Where to get |
|-----|-------------|
| AZURE_OPENAI_ENDPOINT | Azure Portal → OpenAI resource |
| AZURE_OPENAI_API_KEY | Azure Portal → OpenAI resource → Keys |
| AZURE_OPENAI_DEPLOYMENT | Azure OpenAI Studio → Deployments (deploy gpt-4o) |
| AZURE_SPEECH_KEY | Azure Portal → Speech Services → Keys |
| AZURE_SPEECH_REGION | Region of your Speech resource (e.g. eastus) |

> **No keys?** App works in demo mode — just add keys to enable real AI.
