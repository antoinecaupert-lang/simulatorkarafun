const https = require('https');

function post(options, body) {
  return new Promise(function(resolve, reject) {
    var req = https.request(options, function(res) {
      var data = '';
      res.on('data', function(chunk) { data += chunk; });
      res.on('end', function() {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(new Error('JSON parse error')); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function parseBody(req) {
  return new Promise(function(resolve) {
    if (req.body && Object.keys(req.body).length > 0) return resolve(req.body);
    var data = '';
    req.on('data', function(chunk) { data += chunk; });
    req.on('end', function() {
      try { resolve(JSON.parse(data)); }
      catch(e) { resolve({}); }
    });
  });
}

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var body = await parseBody(req);
  var prompt = body.prompt;
  if (!prompt) return res.status(400).json({ error: 'No prompt' });

  try {
    var payload = JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    });

    var data = await post({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, payload);

    var text = data.content && data.content[0] ? data.content[0].text : null;
    return res.json({ analysis: text });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};
