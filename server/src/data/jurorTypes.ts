export interface JurorTypeDef {
  id: number;
  type: string;
  name: string;
  nickname: string;
  initialBias: '有罪' | '無罪' | '中立';
  persuadability: number; // 1-5
  description: string;
  moveCondition: string;
}

export const JUROR_TYPES: JurorTypeDef[] = [
  { id: 1, type: '感情屋', name: '田中', nickname: '涙もろい田中', initialBias: '中立', persuadability: 4, description: '感情的で同情しやすい。被告の境遇に弱い。', moveCondition: '感情的な訴えかけが刺さる。証拠より人情' },
  { id: 2, type: '論理派', name: '工藤', nickname: '冷静な工藤', initialBias: '中立', persuadability: 2, description: '論理的で冷静。証拠がなければ動かない。', moveCondition: '物証がないと一切動かない。弱い証拠は逆効果' },
  { id: 3, type: '頑固者', name: '佐藤', nickname: '岩のような佐藤', initialBias: '有罪', persuadability: 1, description: '一度決めたら動かない。矛盾を複数突く必要がある。', moveCondition: '矛盾を2つ以上突かないと翻らない' },
  { id: 4, type: '流され屋', name: '鈴木', nickname: '風見鶏の鈴木', initialBias: '中立', persuadability: 5, description: '周囲の意見に流されやすい。直前の発言に左右される。', moveCondition: '直前の発言に影響される。最終弁論が命' },
  { id: 5, type: '疑い深い', name: '渡辺', nickname: '疑惑の目の渡辺', initialBias: '有罪', persuadability: 2, description: '何でも疑う。完璧な証拠がないと有罪を崩せない。', moveCondition: '完璧なアリバイがないと有罪を崩せない' },
  { id: 6, type: 'お人好し', name: '木村', nickname: '信じやすい木村', initialBias: '無罪', persuadability: 3, description: '人を信じやすい。動機の証拠がないと無罪から動かない。', moveCondition: '強い動機証拠を出さないと無罪から動かない' },
  { id: 7, type: '正義マン', name: '中村', nickname: '燃える中村', initialBias: '中立', persuadability: 4, description: '正義感が強い。「正義」の言葉に弱い。', moveCondition: '「正義」の言葉に動く。テクニカルな議論は嫌い' },
  { id: 8, type: '優柔不断', name: '小林', nickname: '迷える小林', initialBias: '中立', persuadability: 3, description: '常に迷っている。最後までどちらにも転ぶ。', moveCondition: '最後まで迷い続ける。どちらにも転ぶ' },
  { id: 9, type: '天邪鬼', name: '加藤', nickname: '逆張り加藤', initialBias: '中立', persuadability: 1, description: '多数派の逆を行く。戦略的に使える諸刃の剣。', moveCondition: '多数派と逆を行く。戦略的に使える諸刃の剣' },
  { id: 10, type: '陰謀論者', name: '伊藤', nickname: '深読みの伊藤', initialBias: '無罪', persuadability: 2, description: '「真犯人は別にいる」が口癖。大逆転展開に弱い。', moveCondition: '「真犯人は別にいる」思想。大逆転展開に弱い' },
  { id: 11, type: '専門家気取り', name: '山田', nickname: '自称法学者の山田', initialBias: '中立', persuadability: 3, description: '法律用語に弱い。「詳しいですね」に弱い。', moveCondition: '法律用語を使うと動く。「詳しいですね」が効く' },
  { id: 12, type: '推理オタク', name: '坂本', nickname: 'ミステリーマニア坂本', initialBias: '中立', persuadability: 4, description: '意外な真相が大好き。推理を楽しんでいる。', moveCondition: '「意外な真相」を提示すると喜んで票を変える' },
  { id: 13, type: '退屈な人', name: '松田', nickname: '眠そうな松田', initialBias: '中立', persuadability: 4, description: '長い話が嫌い。短くシンプルな主張が有効。', moveCondition: '短くシンプルな主張が有効。長演説は逆効果' },
  { id: 14, type: '哲学者', name: '森', nickname: '考えすぎる森', initialBias: '中立', persuadability: 1, description: '本質的な問いを好む。考え込んで固まることがある。', moveCondition: '「本質的な問い」を投げると固まる。逆手に取れる' },
  { id: 15, type: 'ギャンブラー', name: '高橋', nickname: '直感の高橋', initialBias: '中立', persuadability: 4, description: '直感で決める。自信満々な態度に弱い。', moveCondition: '論理無効。自信満々な態度と断言に弱い' },
  { id: 16, type: '元警官', name: '青木', nickname: '元刑事の青木', initialBias: '有罪', persuadability: 2, description: '元刑事。証人の信憑性を重視する。', moveCondition: '証人の信憑性攻撃が有効。警察不祥事ネタが弱点' },
  { id: 17, type: '元被疑者', name: '石井', nickname: '経験者の石井', initialBias: '無罪', persuadability: 4, description: 'えん罪経験者。被告に同情的。', moveCondition: '「えん罪の可能性」を強調すると強く動く' },
  { id: 18, type: 'SNS中毒', name: '原田', nickname: 'バズる原田', initialBias: '中立', persuadability: 4, description: '世間体を気にする。「世間的にどう見えるか」に弱い。', moveCondition: '「世間的にどう見えるか」の議論に動く' },
];

export function selectRandomJurors(count: number = 6): JurorTypeDef[] {
  const shuffled = [...JUROR_TYPES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getInitialVote(bias: '有罪' | '無罪' | '中立'): '有罪' | '無罪' {
  if (bias === '有罪') return '有罪';
  if (bias === '無罪') return '無罪';
  return Math.random() > 0.5 ? '有罪' : '無罪';
}
