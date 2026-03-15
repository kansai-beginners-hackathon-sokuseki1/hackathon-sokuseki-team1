import React from 'react';

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
        <span
          key={windowIndex}
          className={`gs-window gs-window--house gs-window--${windowIndex + 1}`}
        />
      ))}
    </div>
  );
}

export function VillageStructures({ props, houses, stageKey }) {
  return (
    <>
      {props.showWatchtower && (
        <div className="gs-watchtower">
          <span className="gs-window gs-window--tower" />
          <span className="gs-flag" />
        </div>
      )}

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
      </div>

      {props.showWatchtower && (
        <div className="gs-watchtower gs-watchtower--harbor">
          <span className="gs-window gs-window--tower" />
          <span className="gs-flag" />
        </div>
      )}

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
    </>
  );
}
