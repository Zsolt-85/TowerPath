# Attribution — playerInfo.dat save decoder

TowerPath's `src/app/lib/playersave/` decoder is adapted from the
open-source **TowerSmith** project:

- TowerSmith by AngryBrit — https://github.com/AngryBrit/tower-smith
- License: **CC BY-NC-SA 4.0** (non-commercial; keep this attribution)

Adapted files / logic:

- `nrbf.ts` — faithful decode-only port of TowerSmith
  `src/playerSave/nrbf.ts` (NRBF binary decoder), which itself adapts the
  open-source NRBF parser by **CrispStrobe/nrbf**. The encoder
  (BinaryWriter / NrbfEncoder) was omitted; decode logic is unchanged apart
  from TypeScript strict-safety adaptations.
- `extract.ts` — minimal port of the context/getter helpers from TowerSmith
  `src/playerSave/nrbfExtract.ts`: `findPlayerDataContext`, `getInt32Array`,
  `getBoolArray`, `getInt32`, `getString` (+ reference resolution). The
  module/bot/preset getters were not ported.
- `mappings.ts` — tables derived from TowerSmith evidence:
  - Card save layout from `src/playerSave/cardSaveSlotMap.ts`,
    `src/data/workshopGameCards.ts` (`WORKSHOP_GAME_CARD_ORDER`), and
    `src/playerSave/cardSaveSlotMap.test.ts`.
  - UW save order from `src/playerSave/gameUltimateWeaponMapping.ts`
    (`GAME_ULTIMATE_WEAPON_INDEX`, via Il2Cpp `DevPanelUltimateWeapons`).
  - Workshop attack/defense/utility array roles from
    `src/playerSave/gameWorkshopMapping.ts` and
    `src/playerSave/decodePlayerInfo.ts`.
- `index.ts` — original TowerPath public API (`gunzipIfNeeded`,
  `decodeSaveFile`), modeled on TowerSmith `decodePlayerInfo.ts`
  (`gunzipPlayerInfo` / `decodePlayerInfoBytes` / `decodePlayerInfoFile`)
  but reduced to the TowerPath `DecodedAccount` shape.
