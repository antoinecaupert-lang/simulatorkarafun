const https = require('https');

function get(url) {
  return new Promise(function(resolve, reject) {
    https.get(url, function(res) {
      var data = '';
      res.on('data', function(chunk) { data += chunk; });
      res.on('end', function() {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(new Error('JSON parse error')); }
      });
    }).on('error', reject);
  });
}

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var KEY = process.env.GOOGLE_PLACES_KEY;
  if (!KEY) return res.status(500).json({ error: 'No API key' });

  var body = req.body || {};
  var city = body.city;
  var radius = parseInt(body.radius) || 10000;
  var country = body.country || 'France';
  if (!city) return res.status(400).json({ error: 'No city' });

  try {
    var geoData = await get(
      'https://maps.googleapis.com/maps/api/geocode/json?address='
      + encodeURIComponent(city + ', ' + country) + '&key=' + KEY
    );
    if (!geoData.results || !geoData.results[0]) return res.json({ count: 0, competitors: [], avgRating: '0', city: city });

    var loc = geoData.results[0].geometry.location;
    var comps = geoData.results[0].address_components || [];
    var cityName = city;
    for (var i = 0; i < comps.length; i++) {
      if (comps[i].types.indexOf('locality') !== -1) { cityName = comps[i].long_name; break; }
    }

    var placesData = await get(
      'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
      + '?location=' + loc.lat + ',' + loc.lng
      + '&radius=' + radius
      + '&keyword=karaoke+karaoké&type=establishment&key=' + KEY
    );

    var results = (placesData.results || []).slice(0, 10);
    var competitors = results.map(function(p) {
      return { name: p.name, rating: p.rating || null, vicinity: p.vicinity || '' };
    });
    var rated = competitors.filter(function(c) { return c.rating; });
    var avgRating = rated.length
      ? (rated.reduce(function(a, c) { return a + c.rating; }, 0) / rated.length).toFixed(1)
      : '0';

    return res.json({ count: competitors.length, competitors: competitors, avgRating: avgRating, city: cityName });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};
