import React from 'react';

function WindowLight({ className }) {
  return <span className={`gs-window ${className}`} />;
}

function LanternLight({ left, bottom, delay, lanternKey }) {
  return (
    <div
      key={lanternKey}
      className="gs-lantern"
      style={{
        left,
        bottom: `${bottom}px`,
        animationDelay: delay
      }}
    >
      <span className="gs-lantern-post" />
      <span className="gs-lantern-light" />
    </div>
  );
}

function CrystalLight() {
  return <div className="gs-crystal" />;
}

function House({ house, houseKey }) {
  return (
    <div
      key={houseKey}
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
        <WindowLight
          key={windowIndex}
          className={`gs-window--house gs-window--${windowIndex + 1}`}
        />
      ))}
    </div>
  );
}

function Watchtower({ harbor = false }) {
  return (
    <div className={`gs-watchtower${harbor ? ' gs-watchtower--harbor' : ''}`}>
      <WindowLight className="gs-window--tower" />
      <span className="gs-flag" />
    </div>
  );
}

export function VillageStructures({ props, houses, stageKey }) {
  return (
    <>
      {props.showWatchtower && <Watchtower />}
      {houses.map((house, index) => (
        <House key={`${stageKey}-house-${index}`} house={house} houseKey={`${stageKey}-house-${index}`} />
      ))}
    </>
  );
}

export function HarborStructures({ props, houses, stageKey }) {
  return (
    <>
      {props.showWater && <div className="gs-water" />}
      <div className="gs-pier" />
      <div className="gs-warehouse">
        <span className="gs-warehouse-roof" />
        <span className="gs-warehouse-door" />
        <WindowLight className="gs-window--warehouse" />
      </div>
      {props.showWatchtower && <Watchtower harbor />}
      {houses.slice(0, 1).map((house, index) => (
        <House key={`${stageKey}-harbor-house-${index}`} house={house} houseKey={`${stageKey}-harbor-house-${index}`} />
      ))}
    </>
  );
}

export function RuinsStructures({ props }) {
  return (
    <>
      {props.showRuins && <div className="gs-ruins" />}
      <div className="gs-ruin-pillars">
        <span className="gs-ruin-pillar gs-ruin-pillar--left" />
        <span className="gs-ruin-pillar gs-ruin-pillar--right" />
      </div>
      <div className="gs-ruin-shrine">
        <span className="gs-ruin-shrine-core" />
      </div>
    </>
  );
}

export function ForestStructures() {
  return (
    <>
      <div className="gs-forest-shrine">
        <span className="gs-forest-shrine-core" />
      </div>
      <div className="gs-fallen-log" />
    </>
  );
}

export function MagicCityStructures({ props, houses, stageKey }) {
  return (
    <>
      {props.showMagicSpires && <div className="gs-magic-spires" />}
      <div className="gs-arcane-ring" />
      {houses.slice(0, 1).map((house, index) => (
        <House key={`${stageKey}-magic-house-${index}`} house={house} houseKey={`${stageKey}-magic-house-${index}`} />
      ))}
    </>
  );
}

export function CastleStructures({ props }) {
  return (
    <>
      {props.showCastle && <div className="gs-castle" />}
      <div className="gs-castle-beacon gs-castle-beacon--left" />
      <div className="gs-castle-beacon gs-castle-beacon--right" />
    </>
  );
}

export function SceneLights({ lanterns = [], showLanterns, showCrystal = true, stageKey }) {
  return (
    <>
      {showLanterns && lanterns.map((lantern, index) => (
        <LanternLight
          key={`${stageKey}-lantern-${index}`}
          lanternKey={`${stageKey}-lantern-${index}`}
          left={lantern.left}
          bottom={lantern.bottom}
          delay={lantern.delay}
        />
      ))}
      {showCrystal && <CrystalLight />}
    </>
  );
}
