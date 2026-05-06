export type AchievementId =
  | "first-steps"
  | "on-a-roll"
  | "half-century"
  | "centurion"
  | "perfect"
  | "speed-demon"
  | "catalogue"
  | "master";

export type AchievementDef = {
  id: AchievementId;
  label: string;
  hint: string;
};

export type Achievement = AchievementDef & { unlocked: boolean };

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first-steps",  label: "First steps",  hint: "Complete your first drill." },
  { id: "perfect",      label: "Perfect run",  hint: "Score 5/5 on any trick." },
  { id: "on-a-roll",    label: "On a roll",    hint: "Complete 10 drills." },
  { id: "half-century", label: "Half-century", hint: "Complete 50 drills." },
  { id: "centurion",    label: "Centurion",    hint: "Complete 100 drills." },
  { id: "speed-demon",  label: "Speed demon",  hint: "Sub-10 seconds on any trick (5/5)." },
  { id: "catalogue",    label: "Catalogue",    hint: "Practice 20 different tricks." },
  { id: "master",       label: "Master",       hint: "Practice all 43 tricks." },
];

type Inputs = {
  totalDrills: number;
  perfectRuns: number;
  fastestSubTenMs: number | null;
  tricksPracticed: number;
};

export function computeAchievements(input: Inputs): Achievement[] {
  return ACHIEVEMENTS.map((def) => ({
    ...def,
    unlocked: isUnlocked(def.id, input),
  }));
}

function isUnlocked(id: AchievementId, x: Inputs): boolean {
  switch (id) {
    case "first-steps":  return x.totalDrills >= 1;
    case "on-a-roll":    return x.totalDrills >= 10;
    case "half-century": return x.totalDrills >= 50;
    case "centurion":    return x.totalDrills >= 100;
    case "perfect":      return x.perfectRuns >= 1;
    case "speed-demon":  return x.fastestSubTenMs !== null && x.fastestSubTenMs < 10_000;
    case "catalogue":    return x.tricksPracticed >= 20;
    case "master":       return x.tricksPracticed >= 43;
  }
}
