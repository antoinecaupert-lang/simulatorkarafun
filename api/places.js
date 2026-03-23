export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const GOOGLE_KEY = process.env.GOOGLE_PLACES_KEY;
  const { city, radius, country } = req.body || {};

  if (!city || !GOOGLE_KEY) return res.status(400).json({ error: 'Missing params' });

  try {
    const geoRes = await fetch(
      'https://maps.googleapis.com/maps/api/geocode/json?address=' +
      encodeURIComponent(city + ', ' + (country || 'France')) +
      '&key=' + GOOGLE_KEY
    );
    const geoData = await geoRes.json();
    if (!geoData.results || !geoData.results[0]) return res.status(200).json({ error: 'City not found' });

    const loc = geoData.results[0].geometry.location;
    const cityName = geoData.results[0].address_components.find(
      c => c.types.includes('locality')
    )?.long_name || city;

    const placesRes = await fetch(
      'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=' +
      loc.lat + ',' + loc.lng +
      '&radius=' + (radius || 10000) +
      '&keyword=karaoké+karaoke+bar&type=establishment&key=' + GOOGLE_KEY
    );
    const placesData = await placesRes.json();
    const results = placesData.results || [];

    const competitors = results.slice(0, 10).map(p => ({
      name: p.name,
      rating: p.rating || null,
      reviews: p.user_ratings_total || 0,
      vicinity: p.vicinity || ''
    }));

    const rated = competitors.filter(c => c.rating);
    const avgRating = rated.length > 0
      ? (rated.reduce((a, c) => a + c.rating, 0) / rated.length).toFixed(1)
      : '0';

    return res.status(200).json({ count: competitors.length, competitors, avgRating, city: cityName });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
