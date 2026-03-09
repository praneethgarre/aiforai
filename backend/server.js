require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/transcribe', require('./routes/transcribe'));
app.use('/api/process',    require('./routes/process'));
app.use('/api/learn',      require('./routes/learn'));
app.use('/api/speech',     require('./routes/speech'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Page routes
app.get('/',        (req, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')));
app.get('/capture', (req, res) => res.sendFile(path.join(__dirname, '../frontend/pages/capture.html')));
app.get('/notes',   (req, res) => res.sendFile(path.join(__dirname, '../frontend/pages/notes.html')));
app.get('/learn',   (req, res) => res.sendFile(path.join(__dirname, '../frontend/pages/learn.html')));
app.get('/quiz',    (req, res) => res.sendFile(path.join(__dirname, '../frontend/pages/quiz.html')));
app.get('/summary', (req, res) => res.sendFile(path.join(__dirname, '../frontend/pages/summary.html')));

app.listen(PORT, () => {
  console.log(`\n🎓 LectureLens AI running at http://localhost:${PORT}\n`);
});
