import withCors from '../_lib/cors.js';

function handler(req, res) {
  const lookId = (req.query.look_id || '').toString();
  if (!lookId) return res.status(200).json({ error: '缺少 look_id', status: 400 });

  const look = {
    look_id: lookId,
    profile_id: 'P001',
    title: 'Weekend Layering',
    images: ['https://picsum.photos/seed/look1/600/800','https://picsum.photos/seed/look1b/600/800'],
    size_summary: '身高 170 ｜ 上衣 M ｜ 下身 L',
    metrics: { likes: 10, refs: 2, pm: 1 },
    items: [{ title: '打摺長褲', product_url: 'https://shop.example.com/p/123', size: 'L', color: '軍綠' }],
    published_at: new Date().toISOString()
  };

  res.status(200).json({ look });
}

export default withCors(handler);
