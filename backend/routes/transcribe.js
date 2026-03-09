const express = require('express');
const multer  = require('multer');
const router  = express.Router();
const { callAzureOpenAI } = require('../middleware/azureClient');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

// POST /api/transcribe/image
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file uploaded' });

    const base64   = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    const messages = [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}`, detail: 'high' } },
        { type: 'text', text: `You are an expert at reading classroom blackboard photos and handwritten notes.
Extract ALL text visible in this image completely and accurately.
Preserve equations, bullet points, headings. Describe diagrams in [brackets].
Output the raw extracted content, maintaining structure.` }
      ]
    }];

    const transcript = await callAzureOpenAI(messages, 1500);
    res.json({ success: true, transcript, source: 'image', fileName: req.file.originalname });

  } catch(err) {
    console.error('Image transcribe error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/transcribe/audio
router.post('/audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });

    const speechKey    = process.env.AZURE_SPEECH_KEY;
    const speechRegion = process.env.AZURE_SPEECH_REGION || 'eastus';

    if (!speechKey || speechKey === 'your_azure_speech_key_here') {
      return res.json({
        success: true,
        transcript: `[Demo Mode — Azure Speech key not configured]\n\nFile received: ${req.file.originalname} (${(req.file.size/1024).toFixed(1)} KB)\n\nTo enable real transcription:\n1. Create Azure Speech Services resource\n2. Add AZURE_SPEECH_KEY and AZURE_SPEECH_REGION to .env\n\nSample transcript:\n"Today we will be discussing Newton's Laws of Motion. The first law states that an object at rest stays at rest unless acted upon by an external force — this is also known as the Law of Inertia..."`,
        source: 'audio',
        demo: true
      });
    }

    // Real Azure Speech REST API call
    const transcript = await azureSpeechToText(req.file.buffer, req.file.mimetype, speechKey, speechRegion);
    res.json({ success: true, transcript, source: 'audio', fileName: req.file.originalname });

  } catch(err) {
    console.error('Audio transcribe error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

async function azureSpeechToText(buffer, mimeType, key, region) {
  const https = require('https');
  return new Promise((resolve, reject) => {
    const options = {
      hostname: `${region}.stt.speech.microsoft.com`,
      path: '/speech/recognition/conversation/cognitiveservices/v1?language=en-IN&format=detailed',
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
        'Content-Length': buffer.length
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.DisplayText || json.NBest?.[0]?.Display || 'Could not transcribe audio.');
        } catch(e) { resolve('Transcription completed.'); }
      });
    });
    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}

module.exports = router;
