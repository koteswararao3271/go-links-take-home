/** Classic dynamic-programming edit distance — small inputs (slugs), no need for a library. */
export function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));

  for (let i = 0; i < rows; i++) dp[i][0] = i;
  for (let j = 0; j < cols; j++) dp[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return dp[a.length][b.length];
}

/**
 * Finds existing slugs close enough to `target` to be a likely typo.
 * Distance threshold scales with word length so "a" vs "b" (distance 1)
 * doesn't match everything, but a one-character typo in a long slug does.
 */
export function suggestSlugs(
  target: string,
  candidates: string[],
  opts: { limit?: number } = {}
): string[] {
  const limit = opts.limit ?? 3;
  return candidates
    .map((candidate) => ({ candidate, distance: levenshtein(target, candidate) }))
    .filter(({ candidate, distance }) => {
      const maxDistance = Math.max(1, Math.floor(Math.max(target.length, candidate.length) / 3));
      return distance > 0 && distance <= maxDistance;
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}
