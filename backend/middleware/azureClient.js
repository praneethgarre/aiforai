const https = require('https');

async function callAzureOpenAI(messages, maxTokens = 2000, jsonMode = false) {
  const endpoint  = process.env.AZURE_OPENAI_ENDPOINT;
  const key       = process.env.AZURE_OPENAI_API_KEY;
  const deploy    = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';
  const version   = process.env.AZURE_OPENAI_API_VERSION || '2024-02-01';

  if (!endpoint || !key || key === 'your_azure_openai_api_key_here') {
    throw new Error('Azure OpenAI not configured. Add keys to .env file.');
  }

  const url = `${endpoint}openai/deployments/${deploy}/chat/completions?api-version=${version}`;
  const body = JSON.stringify({
    messages,
    max_tokens: maxTokens,
    temperature: 0.7,
    ...(jsonMode ? { response_format: { type: 'json_object' } } : {})
  });

  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': key,
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(parsed.error.message));
          resolve(parsed.choices[0].message.content);
        } catch(e) { reject(new Error('Failed to parse Azure response')); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

module.exports = { callAzureOpenAI };
