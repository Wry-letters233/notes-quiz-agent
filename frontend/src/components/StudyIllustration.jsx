export default function StudyIllustration() {
  return (
    <svg
      viewBox="0 0 420 380"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-sm mx-auto"
    >
      {/* glow halo */}
      <circle cx="210" cy="180" r="170" fill="#00F5FF" opacity="0.06" />
      <circle cx="210" cy="180" r="120" fill="#FF2E92" opacity="0.05" />

      {/* hex core / holographic data orb */}
      <g className="float-slow">
        <polygon points="210,70 290,115 290,205 210,250 130,205 130,115"
          fill="none" stroke="#00F5FF" strokeWidth="2" opacity="0.7" />
        <polygon points="210,95 268,128 268,192 210,225 152,192 152,128"
          fill="#11131F" stroke="#00F5FF" strokeWidth="1.5" opacity="0.9" />
        <circle cx="210" cy="160" r="34" fill="none" stroke="#FF2E92" strokeWidth="2" opacity="0.8" />
        <circle cx="210" cy="160" r="6" fill="#00F5FF" />
        {/* circuit lines radiating out */}
        <line x1="210" y1="95" x2="210" y2="60" stroke="#00F5FF" strokeWidth="1.5" opacity="0.5" />
        <line x1="268" y1="128" x2="305" y2="108" stroke="#FF2E92" strokeWidth="1.5" opacity="0.5" />
        <line x1="268" y1="192" x2="305" y2="212" stroke="#00F5FF" strokeWidth="1.5" opacity="0.5" />
        <line x1="152" y1="192" x2="115" y2="212" stroke="#FF2E92" strokeWidth="1.5" opacity="0.5" />
        <line x1="152" y1="128" x2="115" y2="108" stroke="#00F5FF" strokeWidth="1.5" opacity="0.5" />
        <circle cx="210" cy="60" r="3.5" fill="#00F5FF" />
        <circle cx="305" cy="108" r="3.5" fill="#FF2E92" />
        <circle cx="305" cy="212" r="3.5" fill="#00F5FF" />
        <circle cx="115" cy="212" r="3.5" fill="#FF2E92" />
        <circle cx="115" cy="108" r="3.5" fill="#00F5FF" />
      </g>

      {/* floating quiz card - correct */}
      <g className="float-fast" transform="translate(20, 230) rotate(-7)">
        <rect width="90" height="60" rx="8" fill="#11131F" stroke="#39FF88" strokeWidth="2" />
        <circle cx="22" cy="22" r="11" fill="#39FF88" opacity="0.15" />
        <path d="M15 22 L20 27 L29 15" stroke="#39FF88" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="40" y="15" width="38" height="6" rx="3" fill="#262B42" />
        <rect x="40" y="28" width="28" height="6" rx="3" fill="#262B42" />
      </g>

      {/* floating quiz card - retry */}
      <g className="float-medium-rev" transform="translate(305, 235) rotate(8)">
        <rect width="90" height="60" rx="8" fill="#11131F" stroke="#FF3864" strokeWidth="2" />
        <circle cx="22" cy="22" r="11" fill="#FF3864" opacity="0.12" />
        <path d="M15 15 L29 29 M29 15 L15 29" stroke="#FF3864" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="40" y="15" width="38" height="6" rx="3" fill="#262B42" />
        <rect x="40" y="28" width="26" height="6" rx="3" fill="#262B42" />
      </g>

      {/* sparkles */}
      <g fill="#00F5FF">
        <path className="twinkle-1" d="M360 130 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 z" />
      </g>
      <g fill="#FF2E92">
        <path className="twinkle-2" d="M45 110 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 z" />
      </g>
    </svg>
  );
}
