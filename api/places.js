module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  var KEY = process.env.GOOGLE_PLACES_KEY;
  
  return res.status(200).json({
    method: req.method,
    hasKey: !!KEY,
    keyPreview: KEY ? KEY.substring(0, 8) + '...' : 'MISSING',
    body: req.body,
    contentType: req.headers['content-type']
  });
};
