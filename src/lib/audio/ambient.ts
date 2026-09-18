/**
 * App-wide ambient nasheed.
 *
 * Per §5 of the project documentation the background loop is the
 * "Lost and Found" re-edit, 1:08–1:53 (an earlier instruction said
 * 1:06–1:46 — this is the updated window).
 *
 * The player loops that window out of the full track rather than needing a
 * pre-trimmed file, so when the master arrives it can be dropped in as-is
 * and the in/out points adjusted here in one place.
 *
 * Until a file exists at `src`, the player detects the missing asset and
 * hides its own control rather than showing a dead button.
 */
export const AMBIENT_TRACK = {
  src: "/audio/ambient.mp3",
  title: "Lost and Found",
  /** Loop window, in seconds. 1:08 -> 1:53 */
  clipStart: 68,
  clipEnd: 113,
  /** Quiet by default — it must never feel intrusive. */
  defaultVolume: 0.35,
} as const;

export const AMBIENT_STORAGE_KEY = "nur.ambient.v1";
