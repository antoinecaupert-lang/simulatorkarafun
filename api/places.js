module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  var KEY = process.env.GOOGLE_PLACES_KEY;
  var body = req.body || {};

  return res.status(200).json({
    method: req.method,
    hasKey: !!KEY,
    keyStart: KEY ? KEY.substring(0, 6) : 'MISSING',
    city: body.city || 'no city received',
    bodyKeys: Object.keys(body)
  });
};
