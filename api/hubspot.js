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
  const TOKEN = process.env.HS_TOKEN || process.env.HUBSPOT_API_KEY;
  if (!TOKEN) return res.status(500).json({ error: 'Missing token' });
  const b = req.body || {};
  const { firstname, lastname, email, phone, city, stage, roi, revM, net, invest, nb, qualification } = b;
  try {
    const nbBoxes = parseInt(nb) || 1;
    const fn = (firstname || '').trim();
    const ln = (lastname || '').trim();
    const ownerId = nbBoxes >= 5 ? '67082377' : '30315142';
    const search = await hsReq('POST', '/crm/v3/objects/contacts/search', {
      filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] }],
      properties: ['hs_object_id']
    }, TOKEN);
    let contactId;
    if (search.body.total > 0) {
      contactId = search.body.results[0].id;
      await hsReq('PATCH', '/crm/v3/objects/contacts/' + contactId, {
        properties: { firstname: fn, lastname: ln, phone, city: city || '', hubspot_owner_id: ownerId }
      }, TOKEN);
    } else {
      const c = await hsReq('POST', '/crm/v3/objects/contacts', {
        properties: { firstname: fn, lastname: ln, email, phone, city: city || '', jobtitle: stage || '', hubspot_owner_id: ownerId }
      }, TOKEN);
      contactId = c.body.id;
    }
    if (!contactId) throw new Error('Contact failed');
    const dealName = 'KaraFun x ' + fn + ' ' + ln + (city ? ' (' + city.toUpperCase() + ')' : '');
    const deal = await hsReq('POST', '/crm/v3/objects/deals', {
      properties: {
        dealname: dealName, pipeline: 'default', dealstage: '1495240938',
        amount: Math.round(nbBoxes * 199 * 12),
        closedate: new Date(Date.now() + 90*24*3600*1000).toISOString().split('T')[0],
        hubspot_owner_id: ownerId,
        description: 'ROI:' + (roi||0).toFixed(1) + '%|CA:' + Math.round(revM||0) + '|Net:' + Math.round(net||0) + '|Invest:' + Math.round(invest||0) + '|' + (qualification||'')
      }
    }, TOKEN);
    const dealId = deal.body.id;
    if (!dealId) throw new Error('Deal failed: ' + JSON.stringify(deal.body).substring(0, 150));
    await hsReq('PUT', '/crm/v3/objects/contacts/' + contactId + '/associations/deals/' + dealId + '/contact_to_deal', {}, TOKEN);
    const lineItemIds = [];
    const li = await hsReq('POST', '/crm/v3/objects/line_items', {
      properties: { hs_product_id: '88115536119', quantity: String(nbBoxes), hs_dealid: String(dealId) }
    }, TOKEN);
    if (li.body.id) {
      lineItemIds.push(li.body.id);
      await hsReq('PUT', '/crm/v3/objects/line_items/' + li.body.id + '/associations/deals/' + dealId + '/line_item_to_deal', {}, TOKEN);
    }
    try {
      await hsReq('POST', '/automation/v4/sequences/enrollments?userId=' + ownerId,
        { contactId: String(contactId), sequenceId: '796519659' }, TOKEN);
    } catch(e2) {}
    return res.status(200).json({ ok: true, contactId, dealId, lineItemIds });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};
