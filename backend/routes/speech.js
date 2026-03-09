const express = require('express');
const https   = require('https');
const router  = express.Router();

router.post('/synthesize', async (req, res) => {
  try {
    const { text, voice, speed } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });

    const key    = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION || 'eastus';

    if (!key || key === 'your_azure_speech_key_here') {
      return res.json({ success: false, demo: true, message: 'Azure Speech key not configured.' });
    }

    const voices = {
      english_female: 'en-IN-NeerjaNeural',
      english_male:   'en-IN-PrabhatNeural',
      hindi_female:   'hi-IN-SwaraNeural',
      hindi_male:     'hi-IN-MadhurNeural'
    };
    const selectedVoice = voices[voice] || voices.english_female;
    const rate = speed || '1.0';
    const safeText = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').substring(0,3000);

    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-IN">
  <voice name="${selectedVoice}"><prosody rate="${rate}">${safeText}</prosody></voice>
</speak>`;

    // Get token
    const token = await new Promise((resolve, reject) => {
      const r = https.request({
        hostname: `${region}.api.cognitive.microsoft.com`,
        path: '/sts/v1.0/issueToken',
        method: 'POST',
        headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Length': 0 }
      }, (res) => {
        let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(d));
      });
      r.on('error', reject); r.end();
    });

    const audio = await new Promise((resolve, reject) => {
      const r = https.request({
        hostname: `${region}.tts.speech.microsoft.com`,
        path: '/cognitiveservices/v1',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
          'User-Agent': 'LectureLensAI'
        }
      }, (res) => {
        const chunks = []; res.on('data', c => chunks.push(c)); res.on('end', () => resolve(Buffer.concat(chunks)));
      });
      r.on('error', reject); r.write(ssml); r.end();
    });

    res.set({ 'Content-Type': 'audio/mpeg', 'Content-Length': audio.length });
    res.send(audio);

  } catch(err) {
    console.error('Speech error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
