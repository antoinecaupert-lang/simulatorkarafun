const https = require('https');

function get(url) {
  return new Promise(function(resolve, reject) {
    https.get(url, function(res) {
      var data = '';
      res.on('data', function(chunk) { data += chunk; });
      res.on('end', function() {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(e); }
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
  if (!KEY) return res.status(500).json({ error: 'No API key configured' });

  var body = req.body || {};
  var city = body.city;
  var radius = body.radius || 10000;
  var country = body.country || 'France';

  if (!city) return res.status(400).json({ error: 'No city provided' });

  try {
    var geoUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address='
      + encodeURIComponent(city + ', ' + country)
      + '&key=' + KEY;

    var geoData = await get(geoUrl);

    if (!geoData.results || geoData.results.length === 0) {
      return res.status(200).json({ error: 'City not found' });
    }

    var loc = geoData.results[0].geometry.location;
    var components = geoData.results[0].address_components || [];
    var localityComp = null;
    for (var i = 0; i < components.length; i++) {
      if (components[i].types.indexOf('locality') !== -1) {
        localityComp = components[i];
        break;
      }
    }
    var cityName = localityComp ? localityComp.long_name : city;

    var placesUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
      + '?location=' + loc.lat + ',' + loc.lng
      + '&radius=' + radius
      + '&keyword=karaoke+karaoké'
      + '&type=establishment'
      + '&key=' + KEY;

    var placesData = await get(placesUrl);
    var results = placesData.results || [];
    results = results.slice(0, 10);

    var competitors = results.map(function(p) {
      return { name: p.name, rating: p.rating || null, vicinity: p.vicinity || '' };
    });

    var rated = competitors.filter(function(c) { return c.rating; });
    var avgRating = '0';
    if (rated.length > 0) {
      var sum = rated.reduce(function(a, c) { return a + c.rating; }, 0);
      avgRating = (sum / rated.length).toFixed(1);
    }

    return res.status(200).json({
      count: competitors.length,
      competitors: competitors,
      avgRating: avgRating,
      city: cityName
    });

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};
