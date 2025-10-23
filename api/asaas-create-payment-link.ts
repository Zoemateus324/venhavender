import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const tokenFromEnv = process.env.ASAAS_API_KEY || process.env.ASAAS_ACCESS_TOKEN;
  const tokenFromBody = (req.body as any)?.token; // optional, for local/dev only
  const accessToken = tokenFromEnv || tokenFromBody;

  if (!accessToken) {
    return res.status(400).json({ error: 'Asaas access token missing. Set ASAAS_API_KEY env or pass token.' });
  }

  try {
    const { name, description, value } = (req.body as any) || {};

    if (!name || typeof value !== 'number' || !(value > 0)) {
      return res.status(400).json({ error: 'Missing or invalid fields: name and positive numeric value are required' });
    }

    const payload = {
      name,
      description: description || name,
      value,
      // Let Asaas allow multiple payment methods on link
      // Defaults are used by Asaas when fields are omitted
    } as any;

    const resp = await fetch('https://www.asaas.com/api/v3/paymentLinks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'access_token': accessToken,
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return res.status(resp.status).json({ error: data?.errors?.[0]?.description || data?.message || 'Failed to create Asaas payment link' });
    }

    // Asaas returns fields like: id, url, shortUrl, name, value, ...
    return res.status(200).json({ id: data?.id, url: data?.url || data?.shortUrl, raw: data });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Internal error' });
  }
}