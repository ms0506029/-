import withCors from '../_lib/cors';

function handler(req, res) {
  const email = req.headers['x-auth-email'];
  if (!email) return res.status(200).json({ error: '未登入', status: 401 });
  // TODO: 以 email 對照 profiles 表，取得 profile_id 與資料
  res.status(200).json({ me: { email, profile_id: 'P001' } });
}

export default withCors(handler);
