// api/_lib/cors.js
export default function withCors(handler) {
  return async (req, res) => {
    const allowList = (process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const origin = req.headers.origin;
    if (origin && allowList.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (allowList.length) {
      res.setHeader('Access-Control-Allow-Origin', allowList[0]);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Auth-Email');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    return handler(req, res);
  };
}
