import withCors from '../_lib/cors';

function handler(req, res) {
  const handle = (req.query.handle || '@demo').toString();
  const profile = {
    profile_id: 'P001',
    handle,
    display_name: 'Demo 使用者',
    avatar_url: '',
    size_card: { height_cm: 170, weight_kg: 60, top: 'M', bottom: 'L', shoe_size_jp: 27 },
    stats: { followers: 3, looks: 2 }
  };
  const looks = [
    { look_id: 'L1001', profile_id: 'P001', title: 'Weekend Layering',
      cover: 'https://picsum.photos/seed/look1/600/800',
      size_summary: '身高 170 ｜ 上衣 M ｜ 下身 L',
      metrics: { likes: 10, refs: 2, pm: 1 } },
    { look_id: 'L1002', profile_id: 'P001', title: 'Soft Neutrals',
      cover: 'https://picsum.photos/seed/look2/600/800',
      size_summary: '身高 170 ｜ 上衣 M ｜ 下身 L',
      metrics: { likes: 7, refs: 1, pm: 0 } }
  ];
  res.status(200).json({ profile, looks });
}

export default withCors(handler);
