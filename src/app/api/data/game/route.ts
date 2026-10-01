import { NextResponse } from "next/server";
import { LAB_GROUPS, LabValues, MAX_INTEREST_LEVELS } from "@/app/data/labs-data";
import { WORKSHOP_UPGRADES } from "@/app/data/workshop-data";
import { ULTIMATE_WEAPONS } from "@/app/data/ultimate-weapons-data";
import { BOTS } from "@/app/data/bots-data";
import { CARDS } from "@/app/data/cards-data";
import { StandardPerks, UltimatePerks, TradeoffPerks } from "@/app/data/perks-data";

export async function GET() {
  const data = {
    labs: {
      groups: LAB_GROUPS,
      labValues: Object.keys(LabValues),
      maxInterestLevels: MAX_INTEREST_LEVELS,
    },
    workshop: WORKSHOP_UPGRADES,
    ultimateWeapons: ULTIMATE_WEAPONS,
    bots: BOTS,
    cards: CARDS,
    perks: {
      standard: StandardPerks,
      ultimate: UltimatePerks,
      tradeoff: TradeoffPerks,
    },
  };
  return NextResponse.json(data);
}
