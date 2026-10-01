import { NextResponse } from "next/server";

export async function GET() {
  const data = {
    gameSpeed: [
      { level: 1, cost: 300, time: "9m", value: "x2.0" },
      { level: 2, cost: 2500, time: "2h30m", value: "x2.5" },
      { level: 3, cost: 12000, time: "9h48m", value: "x3.0" },
      { level: 4, cost: 50000, time: "1d10h", value: "x3.5" },
      { level: 5, cost: 150000, time: "3d19h", value: "x4.0" },
      { level: 6, cost: 500000, time: "14d1h", value: "x4.5" },
      { level: 7, cost: 1000000, time: "25d11h", value: "x5.0" },
    ],
    waveDuration: 26,
    normalCooldown: 9,
    bossCooldown: 12,
    spawnThresholds: [0, 50, 200, 500, 1000],
    gemRushCosts: [
      { time: "1 hour", gems: 7.5 },
      { time: "1 day", gems: 163 },
      { time: "1 week", gems: 1000 },
      { time: "30 days", gems: 3550 },
      { time: "90 days", gems: 8000 },
      { time: "360 days", gems: 25000 },
    ],
    eliteCellCosts: [
      { boost: "1.5x", oneHour: 15, oneDay: 360, oneWeek: 2400 },
      { boost: "2x", oneHour: 100, oneDay: 800, oneWeek: 5600 },
      { boost: "3x", oneHour: 840, oneDay: 6720, oneWeek: 47040 },
      { boost: "5x", oneHour: 11900, oneDay: 95200, oneWeek: 666400 },
    ],
  };
  return NextResponse.json(data);
}
