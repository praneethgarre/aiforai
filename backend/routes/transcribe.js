const express = require('express');
const multer  = require('multer');
const https   = require('https');
const router  = express.Router();
const { callAzureOpenAI } = require('../middleware/azureClient');

// Store files in memory so we don't need disk access
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

// ─────────────────────────────────────────────────────────────
//  POST /api/transcribe/image  →  Gemini Vision
// ─────────────────────────────────────────────────────────────
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file uploaded' });

    const base64   = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype || 'image/jpeg';

    console.log(`📸 Image received: ${req.file.originalname} (${req.file.size} bytes, ${mimeType})`);

    const messages = [{
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: { url: `data:${mimeType};base64,${base64}` }
        },
        {
          type: 'text',
          text: `You are an expert at reading classroom blackboard photos and handwritten notes.
Extract ALL visible text from this image completely and accurately.
Preserve equations, bullet points, numbered lists, and headings exactly as written.
If you see a diagram or chart, describe it briefly in [square brackets].
Output ONLY the extracted content — do not add any commentary or preamble.
If you cannot read any text, respond with: "No readable text found in image."`
        }
      ]
    }];

    const transcript = await callAzureOpenAI(messages, 2000);
    const cleaned    = transcript ? transcript.trim() : 'No readable text found in image.';

    console.log(`✅ Image extraction done. Length: ${cleaned.length} chars`);

    res.json({
      success:    true,
      transcript: cleaned,
      text:       cleaned,
      source:     'image',
      fileName:   req.file.originalname
    });

  } catch(err) {
    console.error('❌ Image transcribe error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
//  POST /api/transcribe/audio  →  Groq Whisper
// ─────────────────────────────────────────────────────────────
router.post('/audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return res.status(500).json({ error: 'GROQ_API_KEY not set in .env' });

    console.log(`🎙 Audio received: ${req.file.originalname} (${req.file.size} bytes)`);

    const transcript = await groqWhisper(
      req.file.buffer,
      req.file.originalname || 'audio.webm',
      req.file.mimetype     || 'audio/webm',
      groqKey
    );

    console.log(`✅ Audio transcription done. Length: ${transcript.length} chars`);

    res.json({
      success:    true,
      transcript: transcript,
      text:       transcript,
      source:     'audio',
      fileName:   req.file.originalname
    });

  } catch(err) {
    console.error('❌ Audio transcribe error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
//  Groq Whisper helper
// ─────────────────────────────────────────────────────────────
async function groqWhisper(buffer, filename, mimeType, key) {
  return new Promise((resolve, reject) => {
    const boundary = 'LectureLens' + Date.now();

    // Normalize extension
    const ext = (filename.split('.').pop() || 'webm').toLowerCase();
    const mimeMap = {
      mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4',
      webm: 'audio/webm', ogg: 'audio/ogg', mp4: 'audio/mp4', flac: 'audio/flac'
    };
    const fileMime = mimeMap[ext] || mimeType || 'audio/webm';

    // Build multipart body
    const filePart = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
        `Content-Type: ${fileMime}\r\n\r\n`
      ),
      buffer,
      Buffer.from('\r\n')
    ]);

    const modelPart = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="model"\r\n\r\n` +
      `whisper-large-v3\r\n`
    );

    const langPart = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="language"\r\n\r\n` +
      `en\r\n`
    );

    const endPart = Buffer.from(`--${boundary}--\r\n`);

    const body = Buffer.concat([filePart, modelPart, langPart, endPart]);

    const reqOpts = {
      hostname: 'api.groq.com',
      path:     '/openai/v1/audio/transcriptions',
      method:   'POST',
      headers: {
        'Authorization':  `Bearer ${key}`,
        'Content-Type':   `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
      }
    };

    const req = https.request(reqOpts, (response) => {
      let data = '';
      response.on('data', c => data += c);
      response.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            return reject(new Error('Groq error: ' + (json.error.message || JSON.stringify(json.error))));
          }
          if (!json.text) {
            return reject(new Error('Groq returned no text. Response: ' + data.substring(0, 200)));
          }
          resolve(json.text);
        } catch(e) {
          reject(new Error('Failed to parse Groq response: ' + data.substring(0, 200)));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

module.exports = router;
