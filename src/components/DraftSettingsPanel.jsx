import React from "react";
import "./UnifiedStyles.css";
import { formatCategoryName } from "../utils/formatters";

export default function DraftSettingsPanel({
  playerCount,
  setPlayerCount,
  draftVariant,
  setDraftVariant,
  draftLimits,
  setDraftLimits,
  firstRoundPickCount,
  setFirstRoundPickCount,
  subsequentRoundPickCount,
  setSubsequentRoundPickCount,
  frankenDrazSettings,
  setFrankenDrazSettings,
  flexiFranken,
  setFlexiFranken,
}) {
  const handleLimitChange = (cat, val) => {
    setDraftLimits({ ...draftLimits, [cat]: parseInt(val) });
  };

  return (
    <div className="settings-panel">
      <h3 className="settings-title">Draft Settings</h3>

      <div className="settings-row">
        <label className="settings-label">
          Players:
          <input
            type="number"
            value={playerCount}
            min={2}
            max={8}
            onChange={(e) => setPlayerCount(parseInt(e.target.value))}
            className="input input-sm"
            style={{ width: "4rem", marginLeft: "0.25rem" }}
          />
        </label>

        <label className="settings-label">
          Variant:
          <select
            value={draftVariant}
            onChange={(e) => setDraftVariant(e.target.value)}
            className="input input-sm"
            style={{ marginLeft: "0.25rem" }}
          >
            <option value="franken">Franken</option>
            <option value="rotisserie">Rotisserie</option>
            <option value="power">Power Draft</option>
            <option value="frankendraz">FrankenDraz</option>
          </select>
        </label>
      </div>

      <div className="settings-row">
        <label className="settings-label">
          First Round Picks:
          <input
            type="number"
            value={firstRoundPickCount}
            onChange={(e) => setFirstRoundPickCount(parseInt(e.target.value))}
            className="input input-sm"
            style={{ width: "4rem", marginLeft: "0.25rem" }}
          />
        </label>

        <label className="settings-label">
          Subsequent Picks:
          <input
            type="number"
            value={subsequentRoundPickCount}
            onChange={(e) =>
              setSubsequentRoundPickCount(parseInt(e.target.value))
            }
            className="input input-sm"
            style={{ width: "4rem", marginLeft: "0.25rem" }}
          />
        </label>
      </div>

      {draftVariant !== "frankendraz" && (
        <div className="settings-grid">
          {Object.keys(draftLimits).map((cat) => (
            <label key={cat} className="settings-label">
              {formatCategoryName(cat)}:
              <input
                type="number"
                value={draftLimits[cat]}
                onChange={(e) => handleLimitChange(cat, e.target.value)}
                className="input input-sm"
                style={{ width: "4rem", marginLeft: "0.25rem" }}
              />
            </label>
          ))}
        </div>
      )}

      {draftVariant === "frankendraz" && (
        <div className="settings-grid mt-4 p-3 border-2 border-purple-600 rounded-lg bg-purple-900/20">
          <h4 className="col-span-full font-bold text-purple-400 mb-2">
            FrankenDraz Bag Contents
          </h4>
          <label className="settings-label">
            Factions per bag:
            <input
              type="number"
              value={frankenDrazSettings.factionsPerBag}
              onChange={(e) =>
                setFrankenDrazSettings({
                  ...frankenDrazSettings,
                  factionsPerBag: parseInt(e.target.value),
                })
              }
              className="input input-sm"
              style={{ width: "4rem", marginLeft: "0.25rem" }}
            />
          </label>
          <label className="settings-label">
            Blue Tiles per bag:
            <input
              type="number"
              value={frankenDrazSettings.blueTilesPerBag}
              onChange={(e) =>
                setFrankenDrazSettings({
                  ...frankenDrazSettings,
                  blueTilesPerBag: parseInt(e.target.value),
                })
              }
              className="input input-sm"
              style={{ width: "4rem", marginLeft: "0.25rem" }}
            />
          </label>
          <label className="settings-label">
            Red Tiles per bag:
            <input
              type="number"
              value={frankenDrazSettings.redTilesPerBag}
              onChange={(e) =>
                setFrankenDrazSettings({
                  ...frankenDrazSettings,
                  redTilesPerBag: parseInt(e.target.value),
                })
              }
              className="input input-sm"
              style={{ width: "4rem", marginLeft: "0.25rem" }}
            />
          </label>
          {/* FlexiFranken toggle */}
          <div className="col-span-full mt-3 pt-3 border-t border-purple-700">
            <div className="flex items-center gap-2 mb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={flexiFranken}
                  onChange={(e) => setFlexiFranken(e.target.checked)}
                />
                <span className="font-bold text-purple-300 text-sm">FlexiFranken Mode</span>
              </label>
              <span
                title={`FlexiFranken — Point Buy System\n\nBase Limits:\n  4 Abilities · 3 Faction Techs\n  1 of everything else\n\nYou have 6 points for extras:\n  Ability/Faction Tech/Agent/Commander/Hero/Promissory/Commodity:\n    1st extra=1pt, 2nd=2pt, 3rd=3pt…\n  Breakthrough/Flagship/Mech: 2pt, max 1 extra.\n\nAuto-gained components are always free.\n\nRedraw Phase (before Build):\n  Round 1 (Free): Swap one faction for an undrafted one.\n  Round 2 (1pt): Swap again for 1 Flexi point.`}
                className="cursor-help text-purple-400 hover:text-purple-200 text-base leading-none"
              >
                ℹ️
              </span>
            </div>
            {flexiFranken && (
              <div className="text-xs text-purple-400 ml-6">
                6-pt point-buy system + redraw phase before build.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
