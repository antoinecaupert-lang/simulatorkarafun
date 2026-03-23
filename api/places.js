module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const GOOGLE_KEY = process.env.GOOGLE_PLACES_KEY;
  const body = req.body || {};
  const city = body.city;
  const radius = body.radius || 10000;
  const country = body.country || 'France';

  if (!city || !GOOGLE_KEY) return res.status(400).json({ error: 'Missing params' });

  try {
    const geoRes = await fetch(
      'https://maps.googleapis.com/maps/api/geocode/json?address=' +
      encodeURIComponent(city + ', ' + country) +
      '&key=' + GOOGLE_KEY
    );
    const geoData = await geoRes.json();
    if (!geoData.results || !geoData.results[0]) {
      return res.status(200).json({ error: 'City not found' });
    }

    const loc = geoData.results[0].geometry.location;
    const components = geoData.results[0].address_components || [];
    const localityComp = components.find(function(c) { return c.types.includes('locality'); });
    const cityName = localityComp ? localityComp.long_name : city;

    const placesRes = await fetch(
      'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=' +
      loc.lat + ',' + loc.lng +
      '&radius=' + radius +
      '&keyword=karaoké+karaoke+bar&type=establishment&key=' + GOOGLE_KEY
    );
    const placesData = await placesRes.json();
    const results = placesData.results || [];

    const competitors = results.slice(0, 10).map(function(p) {
      return { name: p.name, rating: p.rating || null, reviews: p.user_ratings_total || 0, vicinity: p.vicinity || '' };
    });

    const rated = competitors.filter(function(c) { return c.rating; });
    const avgRating = rated.length > 0
      ? (rated.reduce(function(a, c) { return a + c.rating; }, 0) / rated.length).toFixed(1)
      : '0';

    return res.status(200).json({ count: competitors.length, competitors: competitors, avgRating: avgRating, city: cityName });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};
