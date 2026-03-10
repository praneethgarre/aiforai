require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

// Create uploads folder if it doesn't exist (needed by older multer disk configs)
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ── Middleware ─────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ── Static frontend ────────────────────────────────────────────
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// ── API Routes ─────────────────────────────────────────────────
app.use('/api/transcribe', require('./routes/transcribe'));
app.use('/api/process',    require('./routes/process'));
app.use('/api/learn',      require('./routes/learn'));
app.use('/api/speech',     require('./routes/speech'));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'LectureLens AI running',
    apis: {
      gemini:     !!process.env.GEMINI_API_KEY,
      groq:       !!process.env.GROQ_API_KEY,
      elevenlabs: !!process.env.ELEVENLABS_API_KEY
    }
  });
});

// ── Page Routes ────────────────────────────────────────────────
app.get('/',        (req, res) => res.sendFile(path.join(frontendPath, 'index.html')));
app.get('/capture', (req, res) => res.sendFile(path.join(frontendPath, 'pages/capture.html')));
app.get('/notes',   (req, res) => res.sendFile(path.join(frontendPath, 'pages/notes.html')));
app.get('/learn',   (req, res) => res.sendFile(path.join(frontendPath, 'pages/learn.html')));
app.get('/quiz',    (req, res) => res.sendFile(path.join(frontendPath, 'pages/quiz.html')));
app.get('/summary', (req, res) => res.sendFile(path.join(frontendPath, 'pages/summary.html')));

// ── 404 API handler ────────────────────────────────────────────
app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found' }));

// ── Start ──────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n------------------------------------');
  console.log(`🎓 LectureLens AI running`);
  console.log(`🌐 http://localhost:${PORT}`);
  console.log(`✅ Gemini key:     ${process.env.GEMINI_API_KEY     ? 'SET' : '❌ MISSING'}`);
  console.log(`✅ Groq key:       ${process.env.GROQ_API_KEY       ? 'SET' : '❌ MISSING'}`);
  console.log(`✅ ElevenLabs key: ${process.env.ELEVENLABS_API_KEY ? 'SET' : '❌ MISSING'}`);
  console.log('------------------------------------\n');
});
