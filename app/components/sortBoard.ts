interface ScoreEntry {
  time: string;
  email: string;
}

export const sortScoresByTime = (scores: string[]): string[] => {
  // Convert the array of strings into an array of ScoreEntry objects
  const scoreEntries: ScoreEntry[] = scores.map((score) => {
    const [time, email] = score.split(" ");
    return { time, email };
  });

  // Sort the array based on the time values
  scoreEntries.sort((a, b) => compareTimes(a.time, b.time));

  // Convert back to an array of strings
  const sortedScores = scoreEntries.map(
    (entry) => `${entry.time} ${entry.email}`
  );

  return sortedScores;
};

// Helper function to compare time strings ("00:00.00")
const compareTimes = (time1: string, time2: string): number => {
  const [min1, sec1, ms1] = time1.split(":").map(parseFloat);
  const [min2, sec2, ms2] = time2.split(":").map(parseFloat);

  const totalMs1 = min1 * 60000 + sec1 * 1000 + ms1;
  const totalMs2 = min2 * 60000 + sec2 * 1000 + ms2;

  return totalMs1 - totalMs2; // Negative if time1 is smaller, positive if time2 is smaller
};
