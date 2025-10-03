const withCors = require('./_lib/cors');
module.exports = withCors((req, res) => {
res.status(200).json({ ok: true, time: new Date().toISOString() });
});
