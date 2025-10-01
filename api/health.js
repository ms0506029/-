import withCors from './_lib/cors';

function handler(req, res) {
  res.status(200).json({ ok: true, time: new Date().toISOString() });
}

export default withCors(handler);
