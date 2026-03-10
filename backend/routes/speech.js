const express = require('express');
const https   = require('https');
const router  = express.Router();

router.post('/synthesize', async (req, res) => {
  try {
    const { text, voice } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Text required' });

    const key = process.env.ELEVENLABS_API_KEY;
    if (!key) return res.status(500).json({ error: 'ELEVENLABS_API_KEY not set in .env' });

    // ElevenLabs pre-made voice IDs (always available on free tier)
    const voices = {
      english_female: 'EXAVITQu4vr4xnSDxMaL',  // Sarah
      english_male:   'TxGEqnHWrfWFTfGW9XjX',  // Josh
      hindi_female:   'EXAVITQu4vr4xnSDxMaL',  // Sarah (best available for multilingual)
      hindi_male:     'TxGEqnHWrfWFTfGW9XjX'   // Josh
    };

    const voiceId = voices[voice] || voices.english_female;
    const safeText = text.trim().substring(0, 2500);

    console.log(`🔊 TTS request: voice=${voice}, length=${safeText.length} chars`);

    const body = JSON.stringify({
      text: safeText,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true
      }
    });

    const audio = await new Promise((resolve, reject) => {
      const apiReq = https.request({
        hostname: 'api.elevenlabs.io',
        path: `/v1/text-to-speech/${voiceId}`,
        method: 'POST',
        headers: {
          'xi-api-key':     key,
          'Content-Type':   'application/json',
          'Accept':         'audio/mpeg',
          'Content-Length': Buffer.byteLength(body)
        }
      }, (response) => {
        // Check for error status
        if (response.statusCode !== 200) {
          let errData = '';
          response.on('data', c => errData += c);
          response.on('end', () => {
            try {
              const j = JSON.parse(errData);
              reject(new Error('ElevenLabs: ' + (j.detail?.message || j.detail || errData.substring(0, 200))));
            } catch {
              reject(new Error('ElevenLabs HTTP ' + response.statusCode + ': ' + errData.substring(0, 200)));
            }
          });
          return;
        }

        const chunks = [];
        response.on('data', c => chunks.push(c));
        response.on('end', () => resolve(Buffer.concat(chunks)));
      });

      apiReq.on('error', reject);
      apiReq.write(body);
      apiReq.end();
    });

    console.log(`✅ Audio generated: ${audio.length} bytes`);
    res.set({ 'Content-Type': 'audio/mpeg', 'Content-Length': audio.length });
    res.send(audio);

  } catch(err) {
    console.error('❌ Speech error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
