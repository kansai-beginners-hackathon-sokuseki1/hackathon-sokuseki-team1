import React from 'react';
import './FantasyBackground.css';
import './FantasyBackgroundStages.css';
import {
  CastleStructures,
  ForestStructures,
  HarborStructures,
  MagicCityStructures,
  RuinsStructures,
  RuneRoadStructures,
  SceneLights,
  VillageStructures
} from './StageStructures';

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

const STAGE_DEFINITIONS = [
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
    },
    scene: {
      focus: 'settlement',
      props: {
        structureSet: 'village',
        showWatchtower: true,
        houseCount: 3,
        showLanterns: true,
        showTrees: true,
        showFence: true,
        showFlowers: true,
        showSmoke: true
      },
      characters: [
        { role: 'hero', variant: 'adventurer', x: 34 },
        { role: 'guide', variant: 'villager', x: 67 }
      ]
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
    },
    scene: {
      focus: 'road',
      props: {
        structureSet: 'rune-road',
        showWatchtower: false,
        houseCount: 0,
        showLanterns: false,
        showCrystal: false,
        showPath: false,
        showTrees: true,
        showFence: false,
        showFlowers: true,
        showSmoke: false
      },
      characters: [
        { role: 'hero', variant: 'traveler', x: 56 }
      ]
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
    },
    scene: {
      focus: 'forest',
      props: {
        structureSet: 'forest',
        showWatchtower: false,
        houseCount: 0,
        showLanterns: false,
        showTrees: true,
        denseTrees: true,
        showFence: false,
        showFlowers: false,
        showSmoke: false
      },
      characters: [
        { role: 'hero', variant: 'ranger', x: 50 },
        { role: 'spirit', variant: 'sprite', x: 65 }
      ]
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
    },
    scene: {
      focus: 'trade-town',
      props: {
        structureSet: 'village',
        showWatchtower: false,
        houseCount: 2,
        showLanterns: true,
        showTrees: true,
        showFence: false,
        showFlowers: false,
        showSmoke: false,
        showDuneField: true
      },
      characters: [
        { role: 'hero', variant: 'traveler', x: 58 },
        { role: 'merchant', variant: 'merchant', x: 38 }
      ]
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
    },
    scene: {
      focus: 'harbor',
      props: {
        structureSet: 'harbor',
        showWatchtower: true,
        houseCount: 2,
        showLanterns: true,
        showTrees: true,
        showFence: false,
        showFlowers: false,
        showSmoke: true,
        showWater: true
      },
      characters: [
        { role: 'hero', variant: 'sailor', x: 42 },
        { role: 'worker', variant: 'dockhand', x: 60 }
      ]
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
    },
    scene: {
      focus: 'fortress',
      props: {
        structureSet: 'village',
        showWatchtower: true,
        houseCount: 1,
        showLanterns: true,
        showTrees: true,
        snowTrees: true,
        showFence: true,
        showFlowers: false,
        showSmoke: true,
        showSnowcaps: true
      },
      characters: [
        { role: 'hero', variant: 'warden', x: 48 },
        { role: 'guard', variant: 'guard', x: 62 }
      ]
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
    },
    scene: {
      focus: 'ruins',
      props: {
        structureSet: 'ruins',
        showWatchtower: false,
        houseCount: 0,
        showLanterns: false,
        showTrees: true,
        showFence: false,
        showFlowers: false,
        showSmoke: false,
        showRuins: true
      },
      characters: [
        { role: 'hero', variant: 'explorer', x: 54 }
      ]
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
    },
    scene: {
      focus: 'arcane-city',
      props: {
        structureSet: 'magic-city',
        showWatchtower: false,
        houseCount: 1,
        showLanterns: true,
        showTrees: true,
        showFence: false,
        showFlowers: true,
        showSmoke: false,
        showMagicSpires: true
      },
      characters: [
        { role: 'hero', variant: 'mage', x: 44 },
        { role: 'guide', variant: 'mage', x: 60 }
      ]
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
    },
    scene: {
      focus: 'boss-castle',
      props: {
        structureSet: 'castle',
        showWatchtower: false,
        houseCount: 0,
        showLanterns: true,
        showTrees: true,
        showFence: true,
        showFlowers: false,
        showSmoke: false,
        showCastle: true
      },
      characters: [
        { role: 'hero', variant: 'champion', x: 44 },
        { role: 'boss', variant: 'boss', x: 62 }
      ]
    }
  }
];

const SCENE_RULES = [
  '背景の主役は1つだけにする',
  '建物を多く置くのは生活圏ステージだけにする',
  '探索系ステージでは建物の代わりに痕跡や地形を主役にする',
  'キャラクターは主人公を中心に、必要なステージだけ同行者やNPCを追加する',
  '前景の情報量はUIを邪魔しない範囲に抑える'
];

export function getAdventureStage(level = 1) {
  let currentStage = STAGE_DEFINITIONS[0];
  for (const stage of STAGE_DEFINITIONS) {
    if (level >= stage.minLevel) currentStage = stage;
  }
  return currentStage;
}

function StageBackdrop({ stage }) {
  return (
    <>
      <div className="gs-sky-glow" />
      <div className="gs-stage-badge" title={SCENE_RULES.join(' / ')}>{stage.label}</div>

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
      <div className="gs-fog-bank gs-fog-bank--front" />
      <div className="gs-ground" />
    </>
  );
}

function StageProps({ scene, stageKey }) {
  const { props } = scene;
  const houses = GAME_SCENE_CONFIG.houses.slice(0, props.houseCount);
  const structureComponents = {
    village: <VillageStructures props={props} houses={houses} stageKey={stageKey} />,
    harbor: <HarborStructures props={props} houses={houses} stageKey={stageKey} />,
    ruins: <RuinsStructures props={props} />,
    forest: <ForestStructures />,
    'rune-road': <RuneRoadStructures />,
    'magic-city': <MagicCityStructures props={props} houses={houses} stageKey={stageKey} />,
    castle: <CastleStructures props={props} />
  };

  return (
    <div className="gs-props-layer" data-focus={scene.focus}>
      <div className="gs-scene-props">
        {props.showSnowcaps && <div className="gs-snowcaps" />}
        {props.showDuneField && <div className="gs-dune-field" />}
        {structureComponents[props.structureSet] ?? null}
        <SceneLights
          lanterns={GAME_SCENE_CONFIG.lanterns}
          showLanterns={props.showLanterns}
          showCrystal={props.showCrystal !== false}
          stageKey={stageKey}
        />

        {props.showTrees && GAME_SCENE_CONFIG.trees.map((tree, index) => (
          <div
            key={`${stageKey}-tree-${index}`}
            className={`${tree.className}${props.denseTrees ? ' gs-tree--dense' : ''}${props.snowTrees ? ' gs-tree--snow' : ''}`}
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

        {props.showFence && (
          <div className="gs-fence">
            {Array.from({ length: 14 }, (_, index) => (
              <span key={index} className="gs-fence-post" />
            ))}
          </div>
        )}
        {props.showPath !== false && <div className="gs-path" />}
        {props.showFlowers && <div className="gs-flower-cluster gs-flower-cluster--left" />}
        {props.showFlowers && <div className="gs-flower-cluster gs-flower-cluster--right" />}

        {props.showSmoke && (
          <div className="gs-smoke-stack gs-smoke-stack--left">
            <span className="gs-smoke gs-smoke--1" />
            <span className="gs-smoke gs-smoke--2" />
            <span className="gs-smoke gs-smoke--3" />
          </div>
        )}

        {props.showSmoke && (
          <div className="gs-smoke-stack gs-smoke-stack--right">
            <span className="gs-smoke gs-smoke--1" />
            <span className="gs-smoke gs-smoke--2" />
          </div>
        )}
      </div>
    </div>
  );
}

function StageCharacters({ scene, stageKey }) {
  return (
    <div className="gs-characters-layer">
      {scene.characters.map((character, index) => (
        <div
          key={`${stageKey}-character-${character.role}-${index}`}
          className={`gs-character gs-character--${character.role} gs-character--${character.variant}`}
          style={{ left: `${character.x}%` }}
        >
          <span className="gs-character-shadow" />
          <span className="gs-character-aura" />
          <span className="gs-character-back-arm" />
          <span className="gs-character-back-leg" />
          <span className="gs-character-body" />
          <span className="gs-character-belt" />
          <span className="gs-character-front-leg" />
          <span className="gs-character-front-arm" />
          <span className="gs-character-boots" />
          <span className="gs-character-head" />
          <span className="gs-character-hair" />
          <span className="gs-character-face" />
          <span className="gs-character-cloak" />
          {(character.variant === 'traveler' || character.variant === 'adventurer' || character.variant === 'explorer') && (
            <span className="gs-character-pack" />
          )}
          {(character.variant === 'ranger' || character.variant === 'guard' || character.variant === 'warden' || character.variant === 'champion') && (
            <span className="gs-character-weapon" />
          )}
          {(character.variant === 'merchant' || character.variant === 'dockhand') && (
            <span className="gs-character-cargo" />
          )}
          {character.variant === 'boss' && <span className="gs-character-horns" />}
        </div>
      ))}
    </div>
  );
}

export function GameScene({ level = 1, stage: explicitStage = null }) {
  const stage = explicitStage ?? getAdventureStage(level);

  return (
    <div className="game-scene" data-stage={stage.key} style={stage.theme} aria-hidden="true">
      <StageBackdrop stage={stage} />
      <StageProps scene={stage.scene} stageKey={stage.key} />
      <StageCharacters scene={stage.scene} stageKey={stage.key} />
    </div>
  );
}
