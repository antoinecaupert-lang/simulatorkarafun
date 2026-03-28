const https = require('https');

function hsReq(method, path, body, token) {
    return new Promise((resolve, reject) => {
          const data = JSON.stringify(body);
          const opts = {
      hostname: 'api.hubapi.com', path, method,
                  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token, 'Content-Length': Buffer.byteLength(data) }
};
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(d) }); } catch(e) { resolve({ status: res.statusCode, body: d }); } });
});
    req.on('error', reject); req.write(data); req.end();
});
}

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const TOKEN = process.env.HUBSPOT_API_KEY;
  if (!TOKEN) return res.status(500).json({ error: 'Missing HUBSPOT_API_KEY' });
  const b = req.body || {};
  const { firstname, lastname, email, phone, city, stage, roi, revM, net, invest, pbkY, nb, qualification } = b;
  try {
    const search = await hsReq('POST', '/crm/v3/objects/contacts/search', {
      filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] }],
      properties: ['hs_object_id', 'email']
}, TOKEN);
    let contactId;
    if (search.body.total > 0) {
      contactId = search.body.results[0].id;
      await hsReq('PATCH', '/crm/v3/objects/contacts/' + contactId, { properties: { firstname, lastname, phone, city: city || '' } }, TOKEN);
} else {
      const created = await hsReq('POST', '/crm/v3/objects/contacts', {
        properties: { firstname, lastname, email, phone, city: city || '', hs_lead_status: 'NEW', lifecyclestage: 'lead' }
}, TOKEN);
      contactId = created.body.id;
    }
    const nbBoxes = parseInt(nb) || 1;
    const roiVal = typeof roi === 'number' ? roi.toFixed(1) : (roi || '0');
    const deal = await hsReq('POST', '/crm/v3/objects/deals', {
            properties: {
              dealname: (firstname||'') + ' ' + (lastname||'') + ' — ' + nbBoxes + ' box' + (nbBoxes>1?'es':'') + ' (' + (city||'N/A') + ')',
                        pipeline: 'default', dealstage: 'appointmentscheduled',
                        amount: Math.round(nbBoxes * 199 * 12),
                        closedate: new Date(Date.now() + 90*24*3600*1000).toISOString().split('T')[0],
                        description: 'Qualification : ' + (qualification||'') + ' | ROI : ' + roiVal + '% | CA/mois : ' + Math.round(revM||0) + ' EUR | Net/mois : ' + Math.round(net||0) + ' EUR | Retour : ' + (pbkY ? parseFloat(pbkY).toFixed(1)+' ans' : 'N/A') + ' | Stade : ' + (stage||'')
                }
                }, TOKEN);
                    const dealId = deal.body.id;
    if (contactId && dealId) {
      await hsReq('POST', '/crm/v4/associations/contacts/deals/batch/create', {
        inputs: [{ from: { id: contactId }, to: { id: dealId }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }] }]
}, TOKEN);
}
    const lineItemIds = [];
    for (let i = 0; i < nbBoxes; i++) {
      const li = await hsReq('POST', '/crm/v3/objects/line_items', {
                properties: { name: 'Abonnement Karafun Business', quantity: '1', price: '199', hs_recurring_billing_period: 'P12M', recurringbillingfrequency: 'monthly', description: 'Box ' + (i+1) + '/' + nbBoxes + ' — 199 EUR/mois x 12 mois' }
    }, TOKEN);
      if (li.body.id) lineItemIds.push(li.body.id);
    }
    if (dealId && lineItemIds.length > 0) {
      await hsReq('POST', '/crm/v4/associations/deals/line_items/batch/create', {
        inputs: lineItemIds.map(liId => ({ from: { id: dealId }, to: { id: liId }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 19 }] }))
}, TOKEN);
}
    return res.status(200).json({ ok: true, contactId, dealId, lineItemIds });
} catch(e) {
    console.error('HubSpot error:', e.message);
    return res.status(500).json({ error: e.message });
}
};
