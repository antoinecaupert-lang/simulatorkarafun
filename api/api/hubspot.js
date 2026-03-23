export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const HUBSPOT_KEY = process.env.HUBSPOT_API_KEY;
  if (!HUBSPOT_KEY) return res.status(500).json({ error: 'Missing HubSpot key' });

  const d = req.body || {};
  const symbol = d.currency === 'USD' ? '$' : '€';

  const roiNote = `Simulation ROI Karafun Business
• Ville : ${d.city || 'Non renseignée'}
• Nombre de boxes : ${d.nbBoxes}
• Investissement total : ${symbol}${Number(d.totalInvest).toLocaleString()}
• CA mensuel estimé : ${symbol}${Number(d.totalRevMonth).toLocaleString()}
• Charges mensuelles : ${symbol}${Number(d.totalChargesMonth).toLocaleString()}
• Résultat net/mois : ${symbol}${Number(d.resultMonth).toLocaleString()}
• ROI annuel : ${d.roiPct}%
• Retour sur investissement : ${d.payback}
• Stade du projet : ${d.stage}`;

  try {
    await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + HUBSPOT_KEY },
      body: JSON.stringify({
        properties: {
          firstname: d.firstName, lastname: d.lastName,
          email: d.email, phone: d.phone,
          hs_lead_status: 'NEW', lifecyclestage: 'lead',
          lead_source: 'Simulateur ROI Karafun Business'
        }
      })
    });

    const searchRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + HUBSPOT_KEY },
      body: JSON.stringify({
        filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: d.email }] }]
      })
    });
    const searchData = await searchRes.json();

    if (searchData.results && searchData.results.length > 0) {
      const contactId = searchData.results[0].id;
      await fetch('https://api.hubapi.com/crm/v3/objects/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + HUBSPOT_KEY },
        body: JSON.stringify({
          properties: { hs_note_body: roiNote, hs_timestamp: Date.now() },
          associations: [{
            to: { id: contactId },
            types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 202 }]
          }]
        })
      });
    }

    return res.status(200).json({ ok: true });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
