interface ScoreMap {
  [key: string]: string; // Assuming string format "00:00.00"
}

export const sortScoresByTime = (scores: ScoreMap): ScoreMap => {
  // Convert the object into an array of [key, value] pairs
  const scoreEntries = Object.entries(scores);

  // Sort the array based on the time values
  scoreEntries.sort(([, timeA], [, timeB]) => compareTimes(timeA, timeB));

  // Convert back to an object
  const sortedScores: ScoreMap = {};
  scoreEntries.forEach(([key, value]) => {
    sortedScores[key] = value;
  });

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
