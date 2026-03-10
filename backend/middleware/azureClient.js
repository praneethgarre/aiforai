const https = require('https');

// Strip ```json fences that some models wrap responses in
function stripJsonFences(text) {
  return text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

async function callAzureOpenAI(messages, maxTokens = 2000, jsonMode = false) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY not set in .env');

  // Detect if this is a vision request
  const isVision = messages.some(m =>
    Array.isArray(m.content) &&
    m.content.some(c => c.type === 'image_url')
  );

  // Vision: meta-llama/llama-4-scout-17b-16e-instruct (free, supports images)
  // Text:   llama-3.3-70b-versatile (free, fast, great quality)
  const model = isVision
    ? 'meta-llama/llama-4-scout-17b-16e-instruct'
    : 'llama-3.3-70b-versatile';

  // Build Groq messages (same as OpenAI format)
  const groqMessages = messages.map(m => {
    if (typeof m.content === 'string') {
      return { role: m.role, content: m.content };
    }
    if (Array.isArray(m.content)) {
      const parts = m.content.map(c => {
        if (c.type === 'text') return { type: 'text', text: c.text };
        if (c.type === 'image_url') return { type: 'image_url', image_url: { url: c.image_url.url } };
        return null;
      }).filter(Boolean);
      return { role: m.role, content: parts };
    }
    return { role: m.role, content: String(m.content) };
  });

  const bodyObj = {
    model,
    messages: groqMessages,
    max_tokens: maxTokens,
    temperature: 0.7,
    // JSON mode only works on text models, not vision
    ...(jsonMode && !isVision ? { response_format: { type: 'json_object' } } : {})
  };

  const body = JSON.stringify(bodyObj);
  console.log(`🤖 Groq: model=${model}, jsonMode=${jsonMode && !isVision}, vision=${isVision}`);

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.groq.com',
      path:     '/openai/v1/chat/completions',
      method:   'POST',
      headers: {
        'Authorization':  `Bearer ${key}`,
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            return reject(new Error('Groq error: ' + (parsed.error.message || JSON.stringify(parsed.error))));
          }
          const text = parsed.choices?.[0]?.message?.content;
          if (!text) {
            return reject(new Error('Empty Groq response. Raw: ' + data.substring(0, 300)));
          }
          resolve(jsonMode ? stripJsonFences(text) : text);
        } catch(e) {
          reject(new Error('Parse error: ' + e.message + ' | Raw: ' + data.substring(0, 200)));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

module.exports = { callAzureOpenAI };
