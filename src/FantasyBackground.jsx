import React, { useMemo } from 'react';
import './FantasyBackground.css';

const GAME_SCENE_CONFIG = {
  clouds: [
    { left: '8%', top: '12%', width: 92, height: 22, duration: '29s', delay: '-4s' },
    { left: '38%', top: '20%', width: 70, height: 18, duration: '36s', delay: '-12s' },
    { left: '68%', top: '10%', width: 108, height: 24, duration: '32s', delay: '-18s' }
  ],
  stars: [
    { left: '16%', top: '16%', size: 5, delay: '0s' },
    { left: '25%', top: '26%', size: 4, delay: '1.1s' },
    { left: '61%', top: '15%', size: 6, delay: '0.5s' },
    { left: '80%', top: '24%', size: 4, delay: '1.6s' }
  ],
  houses: [
    { className: 'gs-house gs-house--left', left: '12%', width: 88, height: 42, roofHeight: 20, windows: 2, chimney: true },
    { className: 'gs-house gs-house--center', left: '40%', width: 110, height: 54, roofHeight: 26, windows: 3, chimney: false },
    { className: 'gs-house gs-house--right', left: '72%', width: 82, height: 38, roofHeight: 18, windows: 2, chimney: true }
  ],
  trees: [
    { className: 'gs-tree gs-tree--left', left: '4%', scale: 0.95 },
    { className: 'gs-tree gs-tree--mid', left: '31%', scale: 0.8 },
    { className: 'gs-tree gs-tree--right', left: '88%', scale: 1.05 }
  ],
  lanterns: [
    { left: '27%', bottom: 36, delay: '0.2s' },
    { left: '63%', bottom: 34, delay: '1.4s' }
  ]
};

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

export function GameScene() {
  return (
    <div className="game-scene" aria-hidden="true">
      <div className="gs-sky-glow" />

      {GAME_SCENE_CONFIG.stars.map((star, index) => (
        <span
          key={`scene-star-${index}`}
          className="gs-star"
          style={{
            left: star.left,
            top: star.top,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: star.delay
          }}
        />
      ))}

      {GAME_SCENE_CONFIG.clouds.map((cloud, index) => (
        <div
          key={`scene-cloud-${index}`}
          className="gs-cloud"
          style={{
            left: cloud.left,
            top: cloud.top,
            width: `${cloud.width}px`,
            height: `${cloud.height}px`,
            animationDuration: cloud.duration,
            animationDelay: cloud.delay
          }}
        />
      ))}

      <div className="gs-fog-bank gs-fog-bank--back" />
      <div className="gs-hill gs-hill--back" />
      <div className="gs-hill gs-hill--mid" />

      <div className="gs-village">
        <div className="gs-watchtower">
          <span className="gs-window gs-window--tower" />
          <span className="gs-flag" />
        </div>

        {GAME_SCENE_CONFIG.houses.map((house, index) => (
          <div
            key={`house-${index}`}
            className={house.className}
            style={{
              left: house.left,
              width: `${house.width}px`,
              '--house-height': `${house.height}px`,
              '--roof-height': `${house.roofHeight}px`
            }}
          >
            {house.chimney && <span className="gs-chimney" />}
            <span className="gs-roof" />
            <span className="gs-house-body" />
            <span className="gs-door" />
            {Array.from({ length: house.windows }, (_, windowIndex) => (
              <span
                key={windowIndex}
                className={`gs-window gs-window--house gs-window--${windowIndex + 1}`}
              />
            ))}
          </div>
        ))}

        {GAME_SCENE_CONFIG.lanterns.map((lantern, index) => (
          <div
            key={`lantern-${index}`}
            className="gs-lantern"
            style={{
              left: lantern.left,
              bottom: `${lantern.bottom}px`,
              animationDelay: lantern.delay
            }}
          >
            <span className="gs-lantern-post" />
            <span className="gs-lantern-light" />
          </div>
        ))}

        {GAME_SCENE_CONFIG.trees.map((tree, index) => (
          <div
            key={`tree-${index}`}
            className={tree.className}
            style={{
              left: tree.left,
              transform: `scale(${tree.scale})`
            }}
          >
            <span className="gs-tree-trunk" />
            <span className="gs-tree-leaves gs-tree-leaves--back" />
            <span className="gs-tree-leaves gs-tree-leaves--front" />
          </div>
        ))}

        <div className="gs-fence">
          {Array.from({ length: 14 }, (_, index) => (
            <span key={index} className="gs-fence-post" />
          ))}
        </div>

        <div className="gs-path" />
        <div className="gs-flower-cluster gs-flower-cluster--left" />
        <div className="gs-flower-cluster gs-flower-cluster--right" />
        <div className="gs-crystal" />

        <div className="gs-smoke-stack gs-smoke-stack--left">
          <span className="gs-smoke gs-smoke--1" />
          <span className="gs-smoke gs-smoke--2" />
          <span className="gs-smoke gs-smoke--3" />
        </div>

        <div className="gs-smoke-stack gs-smoke-stack--right">
          <span className="gs-smoke gs-smoke--1" />
          <span className="gs-smoke gs-smoke--2" />
        </div>
      </div>

      <div className="gs-fog-bank gs-fog-bank--front" />
      <div className="gs-ground" />
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
