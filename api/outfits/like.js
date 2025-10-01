import withCors from '../_lib/cors';

function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ error: 'Method Not Allowed', status: 405 });
  const email = req.headers['x-auth-email'];
  if (!email) return res.status(200).json({ error: '未登入', status: 401 });
  // TODO: 以 email 解析 profile_id；寫入 interactions（去重）；回最新計數
  res.status(200).json({ ok: true });
}

export default withCors(handler);
