import React, { useMemo } from 'react';
import './FantasyBackground.css';
import './FantasyBackgroundStages.css';

function seededRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) & 0xffffffff;
    return (value >>> 0) / 0xffffffff;
  };
}

function generateStars(count) {
  const rand = seededRandom(42);
  const palette = ['#ffffff', '#d9e7ff', '#f6e3ff', '#ffe8a3', '#ffcfe6', '#9fe7ff'];

  return Array.from({ length: count }, (_, index) => {
    const size = 1.2 + rand() * 2.8;
    const x = rand() * 100;
    const y = rand() * 44;
    const opacity = 0.55 + rand() * 0.45;
    const duration = 3 + rand() * 4;
    const delay = rand() * 9;
    const bright = index < count * 0.22;
    const color = palette[Math.floor(rand() * palette.length)];
    const glow = bright
      ? '0 0 8px currentColor, 0 0 18px color-mix(in srgb, currentColor 60%, white 40%)'
      : '0 0 5px currentColor, 0 0 12px color-mix(in srgb, currentColor 45%, white 55%)';

    return {
      size: bright ? size * 1.4 : size,
      x,
      y,
      opacity,
      dur: duration,
      delay,
      bright,
      color,
      glow
    };
  });
}

export function FantasyBackground() {
  return (
    <div className="fantasy-bg" aria-hidden="true">
      <svg
        className="fantasy-mountains"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1920 700"
        preserveAspectRatio="xMidYMax slice"
      >
        <path
          d="M0,520 L60,420 L130,450 L220,370 L310,410 L420,330
             L520,380 L630,300 L730,350 L850,270 L960,320
             L1080,260 L1190,310 L1310,240 L1430,290
             L1550,220 L1670,270 L1790,210 L1880,255 L1920,230
             L1920,700 L0,700 Z"
          fill="#1a1060"
          opacity="0.85"
        />
        <path
          d="M0,580 L80,490 L170,520 L280,450 L390,490 L500,420
             L620,470 L740,390 L860,450 L980,380 L1100,440
             L1220,370 L1340,430 L1460,360 L1580,420
             L1700,355 L1820,415 L1920,375
             L1920,700 L0,700 Z"
          fill="#120a40"
        />
        <path
          d="M0,630 L100,568 L200,590 L330,550 L460,580 L600,545
             L740,575 L880,540 L1020,572 L1160,538
             L1300,568 L1440,540 L1580,570 L1720,542
             L1860,572 L1920,555
             L1920,700 L0,700 Z"
          fill="#0a0620"
        />

        <g fill="#0d0a30">
          <rect x="1598" y="378" width="184" height="122" />
          <rect x="1648" y="288" width="42" height="112" />
          <polygon points="1648,288 1690,288 1669,248" />
          <rect x="1602" y="328" width="30" height="82" />
          <polygon points="1602,328 1632,328 1617,294" />
          <rect x="1752" y="322" width="30" height="88" />
          <polygon points="1752,322 1782,322 1767,287" />
          <rect x="1660" y="340" width="7" height="9" fill="#ffcc44" opacity="0.9" />
          <rect x="1676" y="340" width="7" height="9" fill="#ffcc44" opacity="0.9" />
          <rect x="1660" y="362" width="7" height="9" fill="#ffcc44" opacity="0.7" />
        </g>
      </svg>
    </div>
  );
}

export function FantasyOverlay() {
  const stars = useMemo(() => generateStars(150), []);

  return (
    <div className="fantasy-overlay" aria-hidden="true">
      <div className="fantasy-starfield">
        {stars.map((star, index) => (
          <div
            key={index}
            className="fantasy-star"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              backgroundColor: star.color,
              boxShadow: star.glow,
              '--star-opacity': star.opacity,
              '--star-dur': `${star.dur}s`,
              '--star-delay': `${star.delay}s`
            }}
          />
        ))}
      </div>

      <div className="fantasy-sun">
        <div className="fantasy-sun-glow" />
        <div className="fantasy-sun-core" />
      </div>

      <div className="fantasy-moon-wrap">
        <div className="fantasy-moon-glow" />
        <div className="fantasy-moon" />
      </div>

      <div className="fantasy-shooting-star s1" />
      <div className="fantasy-shooting-star s2" />
      <div className="fantasy-shooting-star s3" />

      <div className="fantasy-fog f1" />
      <div className="fantasy-fog f2" />
      <div className="fantasy-fog f3" />

      <div
        className="fantasy-magic-light"
        style={{
          bottom: '18%',
          left: '16%',
          width: '360px',
          height: '80px',
          background: 'radial-gradient(ellipse, rgba(0,200,255,0.2) 0%, transparent 70%)'
        }}
      />
      <div
        className="fantasy-magic-light"
        style={{
          bottom: '16%',
          left: '50%',
          width: '480px',
          height: '60px',
          background: 'radial-gradient(ellipse, rgba(80,50,200,0.15) 0%, transparent 70%)',
          animationDelay: '3s'
        }}
      />
      <div
        className="fantasy-magic-light"
        style={{
          bottom: '17%',
          right: '12%',
          width: '320px',
          height: '70px',
          background: 'radial-gradient(ellipse, rgba(0,180,255,0.18) 0%, transparent 70%)',
          animationDelay: '5s'
        }}
      />
    </div>
  );
}
