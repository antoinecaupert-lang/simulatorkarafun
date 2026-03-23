const https = require('https');

function get(url) {
  return new Promise(function(resolve, reject) {
    https.get(url, function(res) {
      var data = '';
      res.on('data', function(chunk) { data += chunk; });
      res.on('end', function() {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(new Error('Parse error')); }
      });
    }).on('error', reject);
  });
}

// Données socio-économiques des principales villes françaises
var cityData = {
  'paris': { pop: 2161000, revenu: 28500, tourisme: 'très élevé', jeunes: 28, score: 95 },
  'marseille': { pop: 861000, revenu: 19800, tourisme: 'élevé', jeunes: 27, score: 72 },
  'lyon': { pop: 522000, revenu: 24200, tourisme: 'élevé', jeunes: 30, score: 85 },
  'toulouse': { pop: 486000, revenu: 23100, tourisme: 'moyen', jeunes: 32, score: 84 },
  'nice': { pop: 342000, revenu: 23800, tourisme: 'très élevé', jeunes: 24, score: 78 },
  'nantes': { pop: 320000, revenu: 23600, tourisme: 'moyen', jeunes: 31, score: 82 },
  'montpellier': { pop: 295000, revenu: 21500, tourisme: 'moyen', jeunes: 34, score: 80 },
  'strasbourg': { pop: 285000, revenu: 22900, tourisme: 'élevé', jeunes: 29, score: 79 },
  'bordeaux': { pop: 257000, revenu: 24100, tourisme: 'élevé', jeunes: 31, score: 83 },
  'lille': { pop: 233000, revenu: 20800, tourisme: 'moyen', jeunes: 30, score: 75 },
  'rennes': { pop: 220000, revenu: 23400, tourisme: 'moyen', jeunes: 33, score: 81 },
  'reims': { pop: 182000, revenu: 21200, tourisme: 'moyen', jeunes: 27, score: 68 },
  'grenoble': { pop: 158000, revenu: 22700, tourisme: 'moyen', jeunes: 31, score: 74 },
  'dijon': { pop: 156000, revenu: 22500, tourisme: 'moyen', jeunes: 28, score: 70 },
  'angers': { pop: 153000, revenu: 21800, tourisme: 'faible', jeunes: 30, score: 69 },
  'nimes': { pop: 151000, revenu: 19900, tourisme: 'moyen', jeunes: 26, score: 64 },
  'aix-en-provence': { pop: 143000, revenu: 26800, tourisme: 'élevé', jeunes: 28, score: 80 },
  'clermont-ferrand': { pop: 143000, revenu: 21600, tourisme: 'faible', jeunes: 30, score: 67 },
  'tours': { pop: 137000, revenu: 22100, tourisme: 'moyen', jeunes: 29, score: 69 },
  'limoges': { pop: 130000, revenu: 20500, tourisme: 'faible', jeunes: 26, score: 60 },
  'amiens': { pop: 134000, revenu: 20100, tourisme: 'faible', jeunes: 28, score: 61 },
  'metz': { pop: 118000, revenu: 21800, tourisme: 'faible', jeunes: 27, score: 63 },
  'brest': { pop: 140000, revenu: 21300, tourisme: 'faible', jeunes: 28, score: 64 },
  'perpignan': { pop: 121000, revenu: 18900, tourisme: 'moyen', jeunes: 25, score: 58 },
  'caen': { pop: 106000, revenu: 21400, tourisme: 'faible', jeunes: 30, score: 65 },
  'rouen': { pop: 110000, revenu: 21700, tourisme: 'faible', jeunes: 27, score: 63 },
  'besancon': { pop: 116000, revenu: 21600, tourisme: 'faible', jeunes: 29, score: 64 },
  'orlean': { pop: 114000, revenu: 22000, tourisme: 'faible', jeunes: 28, score: 64 },
  'orleans': { pop: 114000, revenu: 22000, tourisme: 'faible', jeunes: 28, score: 64 },
  'pau': { pop: 77000, revenu: 22100, tourisme: 'faible', jeunes: 27, score: 60 },
  'toulon': { pop: 176000, revenu: 20600, tourisme: 'moyen', jeunes: 24, score: 65 },
  'nancy': { pop: 104000, revenu: 21900, tourisme: 'faible', jeunes: 30, score: 65 }
};

function getMarketAnalysis(data, cityName) {
  var score = data.score;
  var pop = data.pop;
  var revenu = data.revenu;
  var jeunes = data.jeunes;
  var tourisme = data.tourisme;

  var potential, color, advice;

  if (score >= 85) {
    potential = 'Très fort potentiel';
    color = '#5DE8A6';
    advice = 'Zone extrêmement favorable pour un projet de boxes karaoké. La combinaison d\'une population dense (' + (pop/1000).toFixed(0) + ' 000 hab.), d\'un revenu médian élevé (' + revenu.toLocaleString('fr-FR') + ' €/an) et d\'un taux de jeunes de ' + jeunes + '% crée une demande soutenue pour les loisirs en groupe. Le tourisme ' + tourisme + ' apporte une clientèle additionnelle. C\'est un marché prioritaire pour Karafun Business.';
  } else if (score >= 75) {
    potential = 'Fort potentiel';
    color = '#5DE8A6';
    advice = 'Zone très favorable. Avec ' + (pop/1000).toFixed(0) + ' 000 habitants et un revenu médian de ' + revenu.toLocaleString('fr-FR') + ' €/an, la capacité de dépense en loisirs est solide. Le taux de jeunes (' + jeunes + '%) est un indicateur positif pour la fréquentation des boxes karaoké. Tourisme ' + tourisme + '. Un projet bien positionné a de très bonnes chances de succès.';
  } else if (score >= 65) {
    potential = 'Potentiel modéré';
    color = '#FFD166';
    advice = 'Zone correcte mais avec des nuances. La population (' + (pop/1000).toFixed(0) + ' 000 hab.) offre un bassin de clientèle suffisant, mais le revenu médian (' + revenu.toLocaleString('fr-FR') + ' €/an) et le tourisme ' + tourisme + ' limitent le potentiel de dépenses loisirs. Une étude de marché locale approfondie est recommandée avant de lancer le projet.';
  } else {
    potential = 'Potentiel limité';
    color = '#FF6B6B';
    advice = 'Zone à étudier avec prudence. Le bassin de population (' + (pop/1000).toFixed(0) + ' 000 hab.) est plus restreint et le revenu médian (' + revenu.toLocaleString('fr-FR') + ' €/an) est en dessous de la moyenne nationale. Cela ne signifie pas que le projet est impossible, mais il faudra travailler davantage sur le positionnement prix et la communication locale.';
  }

  return { potential: potential, color: color, advice: advice, score: score, pop: pop, revenu: revenu, jeunes: jeunes, tourisme: tourisme };
}

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var body = req.body || {};
  var city = (body.city || '').toLowerCase().trim();
  city = city.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  var data = cityData[city];

  if (!data) {
    // Ville non trouvée — on essaie via l'API geo.api.gouv.fr
    try {
      var geoData = await get('https://geo.api.gouv.fr/communes?nom=' + encodeURIComponent(body.city) + '&fields=population,nom&boost=population&limit=1');
      if (geoData && geoData[0]) {
        var pop = geoData[0].population || 50000;
        var score = pop > 200000 ? 75 : pop > 100000 ? 65 : pop > 50000 ? 55 : 45;
        data = { pop: pop, revenu: 21000, tourisme: 'non évalué', jeunes: 28, score: score };
      }
    } catch(e) { }
  }

  if (!data) {
    return res.json({
      potential: 'Données insuffisantes',
      color: '#888780',
      advice: 'Nous n\'avons pas pu analyser automatiquement le marché pour cette ville. Contactez un expert Karafun Business pour une analyse personnalisée de votre zone.',
      score: 0, pop: 0, revenu: 0, jeunes: 0, tourisme: 'inconnu',
      city: body.city
    });
  }

  var analysis = getMarketAnalysis(data, city);
  analysis.city = body.city;
  return res.json(analysis);
};
