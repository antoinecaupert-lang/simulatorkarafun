module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const KEY = process.env.GOOGLE_PLACES_KEY;
  if (!KEY) return res.status(500).json({ error: 'No API key' });

  const { city, radius } = req.body || {};
  if (!city) return res.status(400).json({ error: 'No city' });

  try {
    const geoUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address='
      + encodeURIComponent(city + ', France') + '&key=' + KEY;
    const geoData = await fetch(geoUrl).then(r => r.json());
    if (!geoData.results || !geoData.results[0]) return res.json({ error: 'City not found' });

    const { lat, lng } = geoData.results[0].geometry.location;
    const comp = geoData.results[0].address_components || [];
    const cityName = (comp.find(c => c.types.includes('locality')) || {}).long_name || city;

    const nearUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
      + '?location=' + lat + ',' + lng
      + '&radius=' + (radius || 10000)
      + '&keyword=karaoke+karaoké&type=establishment&key=' + KEY;
    const nearData = await fetch(nearUrl).then(r => r.json());
    const results = (nearData.results || []).slice(0, 10);

    const competitors = results.map(p => ({ name: p.name, rating: p.rating || null, vicinity: p.vicinity || '' }));
    const rated = competitors.filter(c => c.rating);
    const avgRating = rated.length ? (rated.reduce((a, c) => a + c.rating, 0) / rated.length).toFixed(1) : '0';

    res.json({ count: competitors.length, competitors, avgRating, city: cityName });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
