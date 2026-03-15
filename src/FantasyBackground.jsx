import React, { useMemo } from 'react';
import './FantasyBackground.css';
import './FantasyBackgroundStages.css';

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

const ADVENTURE_STAGES = [
  {
    key: 'beginning-village',
    label: 'Stage 1 始まりの村',
    minLevel: 1,
    theme: {
      '--scene-hill-back': '#54785d',
      '--scene-hill-mid': '#31513b',
      '--scene-ground': '#4f693d',
      '--scene-house': '#c7a480',
      '--scene-house-trim': '#6f513d',
      '--scene-roof': '#7d5045',
      '--scene-tree-leaves-back': '#699163',
      '--scene-tree-leaves-front': '#8bc57d',
      '--scene-path': 'rgba(235, 219, 185, 0.72)'
    }
  },
  {
    key: 'grassland-road',
    label: 'Stage 2 草原の道',
    minLevel: 4,
    theme: {
      '--scene-sky-top': '#5ba8ea',
      '--scene-sky-bottom': '#dff3ff',
      '--scene-glow': 'rgba(255, 243, 180, 0.3)',
      '--scene-cloud': 'rgba(255, 255, 255, 0.42)',
      '--scene-hill-back': '#89b96d',
      '--scene-hill-mid': '#577b47',
      '--scene-ground': '#698345',
      '--scene-ground-edge': 'rgba(217, 230, 165, 0.46)',
      '--scene-house': '#ceb08b',
      '--scene-roof': '#95664b',
      '--scene-tree-leaves-back': '#7cad68',
      '--scene-tree-leaves-front': '#a0da87',
      '--scene-path': 'rgba(247, 228, 179, 0.82)',
      '--scene-flower': '#ffd37d'
    }
  },
  {
    key: 'forest-maze',
    label: 'Stage 3 森の迷宮',
    minLevel: 7,
    theme: {
      '--scene-sky-top': '#18352d',
      '--scene-sky-bottom': '#4a7850',
      '--scene-glow': 'rgba(137, 220, 161, 0.2)',
      '--scene-cloud': 'rgba(214, 246, 224, 0.14)',
      '--scene-hill-back': '#244730',
      '--scene-hill-mid': '#173221',
      '--scene-ground': '#243722',
      '--scene-house': '#6f7a5b',
      '--scene-house-trim': '#36412d',
      '--scene-roof': '#46583a',
      '--scene-window': '#e5ffd0',
      '--scene-window-glow': 'rgba(206, 255, 162, 0.3)',
      '--scene-tree-leaves-back': '#2f7440',
      '--scene-tree-leaves-front': '#50a75b',
      '--scene-path': 'rgba(155, 126, 82, 0.62)',
      '--scene-crystal': '#7df2c6'
    }
  },
  {
    key: 'desert-town',
    label: 'Stage 4 砂漠の町',
    minLevel: 10,
    theme: {
      '--scene-sky-top': '#e3a75f',
      '--scene-sky-bottom': '#f6e7b8',
      '--scene-glow': 'rgba(255, 213, 125, 0.28)',
      '--scene-cloud': 'rgba(255, 242, 210, 0.24)',
      '--scene-hill-back': '#d29a54',
      '--scene-hill-mid': '#ae733f',
      '--scene-ground': '#9a6a3a',
      '--scene-ground-edge': 'rgba(255, 215, 152, 0.3)',
      '--scene-house': '#d3ad7b',
      '--scene-house-trim': '#8c5d34',
      '--scene-roof': '#a7653b',
      '--scene-door': '#6a4127',
      '--scene-tree-leaves-back': '#9e844a',
      '--scene-tree-leaves-front': '#c2a466',
      '--scene-path': 'rgba(245, 213, 154, 0.78)',
      '--scene-crystal': '#8ed9ff',
      '--scene-flower': '#ffd28e'
    }
  },
  {
    key: 'seaside-port',
    label: 'Stage 5 海辺の港',
    minLevel: 13,
    theme: {
      '--scene-sky-top': '#4fa8d9',
      '--scene-sky-bottom': '#d9f7ff',
      '--scene-glow': 'rgba(255, 240, 175, 0.28)',
      '--scene-cloud': 'rgba(255, 255, 255, 0.38)',
      '--scene-hill-back': '#4a7f85',
      '--scene-hill-mid': '#305963',
      '--scene-ground': '#5f6c44',
      '--scene-ground-edge': 'rgba(190, 226, 199, 0.34)',
      '--scene-house': '#d1b28c',
      '--scene-house-trim': '#855f49',
      '--scene-roof': '#9a634d',
      '--scene-tree-leaves-back': '#4c9da3',
      '--scene-tree-leaves-front': '#70c8bf',
      '--scene-path': 'rgba(231, 214, 180, 0.72)',
      '--scene-crystal': '#7be3ff'
    }
  },
  {
    key: 'snow-fortress',
    label: 'Stage 6 雪山の砦',
    minLevel: 16,
    theme: {
      '--scene-sky-top': '#7ca7d9',
      '--scene-sky-bottom': '#eef7ff',
      '--scene-glow': 'rgba(214, 235, 255, 0.28)',
      '--scene-cloud': 'rgba(255, 255, 255, 0.34)',
      '--scene-hill-back': '#8ba8c6',
      '--scene-hill-mid': '#5d7693',
      '--scene-ground': '#dbe6ef',
      '--scene-ground-edge': 'rgba(255, 255, 255, 0.54)',
      '--scene-house': '#b7c4d2',
      '--scene-house-trim': '#617285',
      '--scene-roof': '#74879b',
      '--scene-door': '#58677a',
      '--scene-window': '#f6fbff',
      '--scene-window-glow': 'rgba(196, 231, 255, 0.42)',
      '--scene-tree-leaves-back': '#85a9b1',
      '--scene-tree-leaves-front': '#a6cfd8',
      '--scene-fence': '#b8cad9',
      '--scene-path': 'rgba(246, 250, 255, 0.78)',
      '--scene-crystal': '#b7f4ff',
      '--scene-flower': '#d8ebff'
    }
  },
  {
    key: 'ancient-ruins',
    label: 'Stage 7 古代遺跡',
    minLevel: 19,
    theme: {
      '--scene-sky-top': '#62524d',
      '--scene-sky-bottom': '#d0a36c',
      '--scene-glow': 'rgba(255, 207, 129, 0.22)',
      '--scene-cloud': 'rgba(244, 220, 184, 0.2)',
      '--scene-hill-back': '#756153',
      '--scene-hill-mid': '#493b35',
      '--scene-ground': '#615041',
      '--scene-house': '#9d8a71',
      '--scene-house-trim': '#5f4f42',
      '--scene-roof': '#6d5b4b',
      '--scene-window': '#ffe7bf',
      '--scene-window-glow': 'rgba(255, 223, 170, 0.32)',
      '--scene-tree-leaves-back': '#7a7458',
      '--scene-tree-leaves-front': '#9b946c',
      '--scene-path': 'rgba(208, 185, 147, 0.66)',
      '--scene-crystal': '#ffd991'
    }
  },
  {
    key: 'magic-city',
    label: 'Stage 8 魔法都市',
    minLevel: 22,
    theme: {
      '--scene-sky-top': '#251c56',
      '--scene-sky-bottom': '#8e58c9',
      '--scene-glow': 'rgba(165, 152, 255, 0.3)',
      '--scene-cloud': 'rgba(232, 223, 255, 0.22)',
      '--scene-hill-back': '#463181',
      '--scene-hill-mid': '#291d4f',
      '--scene-ground': '#322d58',
      '--scene-house': '#8d79c0',
      '--scene-house-trim': '#4c3b77',
      '--scene-roof': '#5f4896',
      '--scene-window': '#d7efff',
      '--scene-window-glow': 'rgba(142, 241, 255, 0.42)',
      '--scene-tree-leaves-back': '#4d9fe1',
      '--scene-tree-leaves-front': '#76dfd4',
      '--scene-path': 'rgba(195, 180, 255, 0.52)',
      '--scene-crystal': '#8beeff',
      '--scene-flower': '#e0a4ff'
    }
  },
  {
    key: 'demon-lord-castle',
    label: 'Stage 9 魔王城',
    minLevel: 25,
    theme: {
      '--scene-sky-top': '#17040d',
      '--scene-sky-bottom': '#52141f',
      '--scene-glow': 'rgba(255, 94, 54, 0.2)',
      '--scene-cloud': 'rgba(130, 72, 80, 0.22)',
      '--scene-star': '#ffd0cb',
      '--scene-hill-back': '#39111f',
      '--scene-hill-mid': '#220914',
      '--scene-ground': '#2a1015',
      '--scene-ground-edge': 'rgba(198, 92, 84, 0.24)',
      '--scene-house': '#65404a',
      '--scene-house-trim': '#31171f',
      '--scene-roof': '#48202a',
      '--scene-door': '#240910',
      '--scene-window': '#ffb38d',
      '--scene-window-glow': 'rgba(255, 130, 84, 0.45)',
      '--scene-tree-trunk': '#2a1014',
      '--scene-tree-leaves-back': '#6d2f36',
      '--scene-tree-leaves-front': '#a1483d',
      '--scene-fence': '#664045',
      '--scene-path': 'rgba(125, 74, 64, 0.5)',
      '--scene-crystal': '#ff7d5f',
      '--scene-lantern-light': '#ff8f58',
      '--scene-flower': '#c86c7a'
    }
  }
];

function getAdventureStage(level = 1) {
  let currentStage = ADVENTURE_STAGES[0];
  for (const stage of ADVENTURE_STAGES) {
    if (level >= stage.minLevel) currentStage = stage;
  }
  return currentStage;
}

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

export function GameScene({ level = 1 }) {
  const stage = getAdventureStage(level);
  const isForestLike = stage.key === 'forest-maze';
  const isDesertLike = stage.key === 'desert-town';
  const isPortLike = stage.key === 'seaside-port';
  const isSnowLike = stage.key === 'snow-fortress';
  const isRuinsLike = stage.key === 'ancient-ruins';
  const isMagicLike = stage.key === 'magic-city';
  const isCastleLike = stage.key === 'demon-lord-castle';

  return (
    <div className="game-scene" data-stage={stage.key} style={stage.theme} aria-hidden="true">
      <div className="gs-sky-glow" />
      <div className="gs-stage-badge">{stage.label}</div>

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
        {isPortLike && <div className="gs-water" />}
        {isSnowLike && <div className="gs-snowcaps" />}
        {isRuinsLike && <div className="gs-ruins" />}
        {isMagicLike && <div className="gs-magic-spires" />}
        {isCastleLike && <div className="gs-castle" />}

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
            className={`${tree.className}${isForestLike ? ' gs-tree--dense' : ''}${isSnowLike ? ' gs-tree--snow' : ''}`}
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
        {isDesertLike && <div className="gs-dune-field" />}
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
