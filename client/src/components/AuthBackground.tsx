/**
 * AuthBackground
 *
 * Renders the full-viewport background for the auth pages.
 * Uses a fixed-position container so it sits behind all content.
 *
 * Design: dark deep-crimson gradient (matches existing app palette)
 * layered with a subtle repeating SVG pattern of tiny pixel-art
 * controller outlines and diamond grid marks — dark-on-dark, barely
 * visible, so it adds texture without competing with the form.
 */
export function AuthBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        background: "linear-gradient(145deg, #0D0204 0%, #1a0308 45%, #32050F 100%)",
        overflow: "hidden",
      }}
    >
      {/* SVG pattern layer */}
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "absolute", inset: 0, opacity: 0.18 }}
      >
        <defs>
          {/* ── Tile: 80×80px, contains one mini controller outline ── */}
          <pattern
            id="cp-controller-tile"
            x="0"
            y="0"
            width="80"
            height="80"
            patternUnits="userSpaceOnUse"
          >
            {/* Diamond cross-hair dot at tile centre */}
            <rect
              x="38" y="36" width="4" height="4"
              rx="1"
              fill="none"
              stroke="#9E1B32"
              strokeWidth="0.8"
              transform="rotate(45 40 38)"
            />

            {/* Tiny controller body — left grip */}
            <rect x="12" y="28" width="12" height="16" rx="5"
              fill="none" stroke="#9E1B32" strokeWidth="0.7" />
            {/* Right grip */}
            <rect x="56" y="28" width="12" height="16" rx="5"
              fill="none" stroke="#9E1B32" strokeWidth="0.7" />
            {/* Centre bridge */}
            <rect x="24" y="30" width="32" height="12" rx="3"
              fill="none" stroke="#9E1B32" strokeWidth="0.7" />

            {/* D-pad arms (left side) */}
            <rect x="17" y="32" width="5" height="2" rx="0.5"
              fill="#9E1B32" opacity="0.7" />
            <rect x="19" y="30" width="2" height="5" rx="0.5"
              fill="#9E1B32" opacity="0.7" />

            {/* ABXY dots (right side) */}
            <circle cx="63" cy="31" r="1.2" fill="#9E1B32" opacity="0.7" />
            <circle cx="66" cy="33" r="1.2" fill="#9E1B32" opacity="0.7" />
            <circle cx="63" cy="35" r="1.2" fill="#9E1B32" opacity="0.7" />
            <circle cx="60" cy="33" r="1.2" fill="#9E1B32" opacity="0.7" />

            {/* Corner tick marks at tile edges — grid feel */}
            <line x1="0" y1="0" x2="4" y2="0" stroke="#5a1020" strokeWidth="0.5" />
            <line x1="0" y1="0" x2="0" y2="4" stroke="#5a1020" strokeWidth="0.5" />
            <line x1="80" y1="80" x2="76" y2="80" stroke="#5a1020" strokeWidth="0.5" />
            <line x1="80" y1="80" x2="80" y2="76" stroke="#5a1020" strokeWidth="0.5" />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#cp-controller-tile)" />
      </svg>

      {/* Soft radial vignette — pulls focus toward the centre where the form sits */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 70% 70% at 50% 50%, transparent 30%, rgba(13,2,4,0.82) 100%)",
        }}
      />
    </div>
  );
}