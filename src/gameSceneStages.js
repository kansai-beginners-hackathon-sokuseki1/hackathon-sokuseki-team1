export const STAGE_DEFINITIONS = [
  {
    key: 'beginning-village',
    label: 'Stage 1 蟋九∪繧翫・譚・',
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
    label: 'Stage 2 闕牙次縺ｮ驕・',
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
    label: 'Stage 3 譽ｮ縺ｮ霑ｷ螳ｮ',
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
        { role: 'monster', variant: 'beast', x: 34 },
        { role: 'hero', variant: 'ranger', x: 50 },
        { role: 'spirit', variant: 'sprite', x: 65 }
      ]
    }
  },
  {
    key: 'desert-town',
    label: 'Stage 4 遐よｼ縺ｮ逕ｺ',
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
    label: 'Stage 5 豬ｷ霎ｺ縺ｮ貂ｯ',
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
        { role: 'worker', variant: 'dockhand', x: 60 },
        { role: 'spirit', variant: 'wisp', x: 74 }
      ]
    }
  },
  {
    key: 'snow-fortress',
    label: 'Stage 6 髮ｪ螻ｱ縺ｮ遐ｦ',
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
    label: 'Stage 7 蜿､莉｣驕ｺ霍｡',
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
        { role: 'hero', variant: 'explorer', x: 54 },
        { role: 'monster', variant: 'golem', x: 72 }
      ]
    }
  },
  {
    key: 'magic-city',
    label: 'Stage 8 鬲疲ｳ暮・蟶・',
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
        { role: 'guide', variant: 'mage', x: 60 },
        { role: 'spirit', variant: 'wisp', x: 74 }
      ]
    }
  },
  {
    key: 'demon-lord-castle',
    label: 'Stage 9 鬲皮視蝓・',
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
        { role: 'boss', variant: 'boss', x: 62 },
        { role: 'monster', variant: 'drake', x: 78 }
      ]
    }
  }
];

export const SCENE_RULES = [
  '閭梧勹縺ｮ荳ｻ蠖ｹ縺ｯ1縺､縺縺代↓縺吶ｋ',
  '蟒ｺ迚ｩ繧貞､壹￥鄂ｮ縺上・縺ｯ逕滓ｴｻ蝨上せ繝・・繧ｸ縺縺代↓縺吶ｋ',
  '謗｢邏｢邉ｻ繧ｹ繝・・繧ｸ縺ｧ縺ｯ蟒ｺ迚ｩ縺ｮ莉｣繧上ｊ縺ｫ逞戊ｷ｡繧・慍蠖｢繧剃ｸｻ蠖ｹ縺ｫ縺吶ｋ',
  '繧ｭ繝｣繝ｩ繧ｯ繧ｿ繝ｼ縺ｯ荳ｻ莠ｺ蜈ｬ繧剃ｸｭ蠢・↓縲∝ｿ・ｦ√↑繧ｹ繝・・繧ｸ縺縺大酔陦瑚・ｄNPC繧定ｿｽ蜉縺吶ｋ',
  '蜑肴勹縺ｮ諠・ｱ驥上・UI繧帝が鬲斐＠縺ｪ縺・ｯ・峇縺ｫ謚代∴繧・'
];

export function getAdventureStages() {
  return STAGE_DEFINITIONS;
}

export function getAdventureStageByKey(stageKey) {
  return STAGE_DEFINITIONS.find((stage) => stage.key === stageKey) ?? null;
}

export function getAdventureStage(level = 1) {
  let currentStage = STAGE_DEFINITIONS[0];
  for (const stage of STAGE_DEFINITIONS) {
    if (level >= stage.minLevel) currentStage = stage;
  }
  return currentStage;
}
