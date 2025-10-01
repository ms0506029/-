import withCors from '../_lib/cors';

function handler(req, res) {
  const page = parseInt(req.query.page || '1', 10) || 1;
  const pageSize = parseInt(req.query.page_size || '24', 10) || 24;
  const all = [
    { look_id: 'L1001', profile_id: 'P001', title: 'Weekend Layering',
      cover: 'https://picsum.photos/seed/look1/600/800',
      size_summary: '身高 170 ｜ 上衣 M ｜ 下身 L',
      metrics: { likes: 10, refs: 2, pm: 1 } },
    { look_id: 'L1002', profile_id: 'P001', title: 'Soft Neutrals',
      cover: 'https://picsum.photos/seed/look2/600/800',
      size_summary: '身高 170 ｜ 上衣 M ｜ 下身 L',
      metrics: { likes: 7, refs: 1, pm: 0 } }
  ];
  const offset = (page - 1) * pageSize;
  const items = all.slice(offset, offset + pageSize);
  res.status(200).json({ items, pagination: { page, page_size: pageSize, total: all.length } });
}

export default withCors(handler);
