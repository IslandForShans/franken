import { FLEXI_FRANKEN_TOTAL_POINTS } from "../utils/flexiFranken.js";

export function FlexiPointBuyContent() {
  return (
    <div className="space-y-3 text-sm">
      <div
        className="font-bold uppercase"
        style={{ color: "var(--accent-yellow)", fontSize: "1.1rem", letterSpacing: "0.05em" }}
      >
        FlexiFranken — Point Buy
      </div>

      <div style={{ color: "var(--accent-blue)" }} className="font-semibold">
        Base Limits
      </div>
      <div style={{ color: "var(--text-secondary)" }} className="space-y-0.5">
        <div>4 Abilities · 3 Faction Techs</div>
        <div>1 of everything else</div>
      </div>

      <div style={{ color: "var(--accent-blue)" }} className="font-semibold">
        {FLEXI_FRANKEN_TOTAL_POINTS} Points to spend on extras
      </div>
      <div style={{ color: "var(--text-secondary)" }} className="space-y-1">
        <div>
          <span className="text-white font-semibold">1pt base</span>
          {" — "}Ability, Faction Tech, Agent, Commander, Hero, Promissory, Commodity
        </div>
        <div className="text-xs italic">
          Each subsequent extra in the same category costs +1 more.
          <br />(1st = 1pt, 2nd = 2pt, 3rd = 3pt…)
        </div>
        <div className="mt-1">
          <span className="text-white font-semibold">2pt, max 1 extra</span>
          {" — "}Breakthrough, Flagship, Mech
        </div>
      </div>

      <div
        className="text-xs italic pt-2 border-t"
        style={{ color: "var(--text-tertiary)", borderColor: "var(--border-color)" }}
      >
        Auto-gained and swapped components are always free and never cost points.
      </div>
    </div>
  );
}

export function FlexiRedrawContent() {
  return (
    <div className="space-y-3 text-sm">
      <div
        className="font-bold uppercase"
        style={{ color: "var(--accent-yellow)", fontSize: "1.1rem", letterSpacing: "0.05em" }}
      >
        Redraw Phase
      </div>
      <div style={{ color: "var(--text-secondary)" }}>
        Before the Build Phase, there are 2 optional redraw rounds:
      </div>

      <div>
        <div style={{ color: "var(--accent-green)" }} className="font-semibold mb-1">
          Round 1 — Free
        </div>
        <div style={{ color: "var(--text-secondary)" }}>
          Discard one of your drafted factions and draw a replacement from the undrafted pool.
        </div>
      </div>

      <div>
        <div style={{ color: "var(--accent-yellow)" }} className="font-semibold mb-1">
          Round 2 — Costs 1 Flexi Point
        </div>
        <div style={{ color: "var(--text-secondary)" }}>
          One more optional swap, but it spends 1 point from your build budget.
        </div>
      </div>

      <div
        className="text-xs italic pt-2 border-t"
        style={{ color: "var(--text-tertiary)", borderColor: "var(--border-color)" }}
      >
        You may skip either or both rounds.
      </div>
    </div>
  );
}