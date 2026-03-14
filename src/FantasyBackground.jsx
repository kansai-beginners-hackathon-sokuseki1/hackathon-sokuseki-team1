import React, { useMemo } from 'react';
import './FantasyBackground.css';

// シード付き疑似乱数（毎レンダーで同じ星配置になるよう）
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateStars(count) {
  const rand = seededRandom(42);
  return Array.from({ length: count }, (_, i) => {
    const size   = 0.8 + rand() * 2.2;
    const x      = rand() * 100;
    const y      = rand() * 62;          // 空の上部62%に配置
    const opacity = 0.35 + rand() * 0.65;
    const dur    = 2.5 + rand() * 4.5;
    const delay  = rand() * 9;
    // 明るい星（上位15%）は少し大きく
    const bright = i < count * 0.15;
    return { size: bright ? size * 1.4 : size, x, y, opacity, dur, delay, bright };
  });
}

export function FantasyBackground() {
  const stars = useMemo(() => generateStars(110), []);

  return (
    <div className="fantasy-bg" aria-hidden="true">

      {/* 星 */}
      {stars.map((s, i) => (
        <div
          key={i}
          className="fantasy-star"
          style={{
            left:    `${s.x}%`,
            top:     `${s.y}%`,
            width:   `${s.size}px`,
            height:  `${s.size}px`,
            backgroundColor: s.bright ? '#e8e8ff' : '#ffffff',
            '--star-opacity': s.opacity,
            '--star-dur':     `${s.dur}s`,
            '--star-delay':   `${s.delay}s`,
          }}
        />
      ))}

      {/* 月 */}
      <div className="fantasy-moon-wrap">
        <div className="fantasy-moon-glow" />
        <div className="fantasy-moon" />
      </div>

      {/* 流れ星 */}
      <div className="fantasy-shooting-star s1" />
      <div className="fantasy-shooting-star s2" />
      <div className="fantasy-shooting-star s3" />

      {/* 山脈・城シルエット（SVGインライン） */}
      <svg
        className="fantasy-mountains"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1920 700"
        preserveAspectRatio="xMidYMax slice"
      >
        {/* 遠景山脈 */}
        <path
          d="M0,520 L60,420 L130,450 L220,370 L310,410 L420,330
             L520,380 L630,300 L730,350 L850,270 L960,320
             L1080,260 L1190,310 L1310,240 L1430,290
             L1550,220 L1670,270 L1790,210 L1880,255 L1920,230
             L1920,700 L0,700 Z"
          fill="#1a1060"
          opacity="0.85"
        />
        {/* 中景山脈 */}
        <path
          d="M0,580 L80,490 L170,520 L280,450 L390,490 L500,420
             L620,470 L740,390 L860,450 L980,380 L1100,440
             L1220,370 L1340,430 L1460,360 L1580,420
             L1700,355 L1820,415 L1920,375
             L1920,700 L0,700 Z"
          fill="#120a40"
        />
        {/* 近景の丘 */}
        <path
          d="M0,630 L100,568 L200,590 L330,550 L460,580 L600,545
             L740,575 L880,540 L1020,572 L1160,538
             L1300,568 L1440,540 L1580,570 L1720,542
             L1860,572 L1920,555
             L1920,700 L0,700 Z"
          fill="#0a0620"
        />

        {/* 城シルエット */}
        <g fill="#0d0a30">
          <rect x="1598" y="378" width="184" height="122" />
          <rect x="1648" y="288" width="42" height="112" />
          <polygon points="1648,288 1690,288 1669,248" />
          <rect x="1602" y="328" width="30" height="82" />
          <polygon points="1602,328 1632,328 1617,294" />
          <rect x="1752" y="322" width="30" height="88" />
          <polygon points="1752,322 1782,322 1767,287" />
          {/* 窓の灯り */}
          <rect x="1660" y="340" width="7" height="9" fill="#ffcc44" opacity="0.9" />
          <rect x="1676" y="340" width="7" height="9" fill="#ffcc44" opacity="0.9" />
          <rect x="1660" y="362" width="7" height="9" fill="#ffcc44" opacity="0.7" />
        </g>

        {/* 左側の木々 */}
        <g fill="#050310">
          <polygon points="118,640 143,558 168,640" />
          <polygon points="128,602 150,524 172,602" />
          <polygon points="138,568 158,494 178,568" />
          <rect x="146" y="640" width="10" height="38" />

          <polygon points="198,648 226,562 254,648" />
          <polygon points="208,610 233,528 258,610" />
          <polygon points="218,576 241,498 264,576" />
          <rect x="226" y="648" width="11" height="32" />

          <polygon points="50,648 72,578 94,648" />
          <polygon points="58,614 78,546 98,614" />
          <rect x="65" y="648" width="9" height="35" />
        </g>

        {/* 右側の木々 */}
        <g fill="#050310">
          <polygon points="1818,652 1840,590 1862,652" />
          <polygon points="1826,620 1846,560 1866,620" />
          <rect x="1834" y="652" width="8" height="32" />

          <polygon points="1870,660 1894,596 1918,660" />
          <polygon points="1878,626 1900,564 1922,626" />
          <rect x="1888" y="660" width="8" height="28" />
        </g>
      </svg>

      {/* 霧レイヤー */}
      <div className="fantasy-fog f1" />
      <div className="fantasy-fog f2" />
      <div className="fantasy-fog f3" />

      {/* 魔法の光点 */}
      <div className="fantasy-magic-light" style={{
        bottom: '18%', left: '16%',
        width: '360px', height: '80px',
        background: 'radial-gradient(ellipse, rgba(0,200,255,0.2) 0%, transparent 70%)',
      }} />
      <div className="fantasy-magic-light" style={{
        bottom: '16%', left: '50%',
        width: '480px', height: '60px',
        background: 'radial-gradient(ellipse, rgba(80,50,200,0.15) 0%, transparent 70%)',
        animationDelay: '3s',
      }} />
      <div className="fantasy-magic-light" style={{
        bottom: '17%', right: '12%',
        width: '320px', height: '70px',
        background: 'radial-gradient(ellipse, rgba(0,180,255,0.18) 0%, transparent 70%)',
        animationDelay: '5s',
      }} />

    </div>
  );
}
