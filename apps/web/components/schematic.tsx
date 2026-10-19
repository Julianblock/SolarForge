export function Schematic({ battery }: { battery: boolean }) {
  return (
    <svg viewBox="0 0 640 180" role="img" aria-label="Preliminary one-line diagram">
      <rect x="20" y="50" width="90" height="50" fill="#122238" stroke="#f5b942" />
      <text x="38" y="80" fill="#e8eef8" fontSize="13">Modules</text>
      <path d="M110 75 H180" stroke="#f5b942" strokeWidth="2" />
      <rect x="180" y="50" width="90" height="50" fill="#122238" stroke="#e8eef8" />
      <text x="196" y="80" fill="#e8eef8" fontSize="13">Combiner</text>
      <path d="M270 75 H340" stroke="#f5b942" strokeWidth="2" />
      <rect x="340" y="40" width="110" height="70" fill="#122238" stroke="#f07a32" />
      <text x="358" y="80" fill="#e8eef8" fontSize="13">{battery ? "Hybrid inverter" : "Inverter"}</text>
      {battery ? (
        <>
          <path d="M395 110 V145 H250" stroke="#3dbe8b" strokeWidth="2" />
          <rect x="160" y="125" width="90" height="40" fill="#122238" stroke="#3dbe8b" />
          <text x="178" y="150" fill="#e8eef8" fontSize="13">Battery</text>
        </>
      ) : null}
      <path d="M450 75 H520" stroke="#e8eef8" strokeWidth="2" />
      <rect x="520" y="50" width="90" height="50" fill="#122238" stroke="#e8eef8" />
      <text x="538" y="80" fill="#e8eef8" fontSize="13">Loads</text>
    </svg>
  );
}
