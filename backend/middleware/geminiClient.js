const https = require('https');

async function callGemini(messages, maxTokens = 2000) {
  const key = process.env.GEMINI_API_KEY;

  if (!key) {
    throw new Error("Gemini API key not configured.");
  }

  const prompt = messages.map(m => `${m.role}: ${m.content}`).join("\n");

  const body = JSON.stringify({
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: maxTokens
    }
  });

  return new Promise((resolve, reject) => {

    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }

    }, (res) => {

      let data = '';
      res.on('data', chunk => data += chunk);

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);

          const text =
            parsed.candidates?.[0]?.content?.parts?.[0]?.text ||
            "No response";

          resolve(text);

        } catch (err) {
          reject(new Error("Failed to parse Gemini response"));
        }
      });

    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

module.exports = { callGemini };