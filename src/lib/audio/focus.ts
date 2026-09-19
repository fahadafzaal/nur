/**
 * Audio focus — so two things never play over each other.
 *
 * Foreground audio (Qur'an recitation, a nasheed from the library) claims
 * focus when it starts and releases it when it stops. The ambient loop
 * listens: it pauses on claim and resumes on release, but only if it was
 * playing before — it never starts itself unasked.
 *
 * Plain DOM events rather than React context, because the ambient player
 * lives in the root layout and the claimants live deep inside pages.
 */
const CLAIM = "nur:audio-claim";
const RELEASE = "nur:audio-release";

export function claimAudioFocus(owner: string) {
  window.dispatchEvent(new CustomEvent(CLAIM, { detail: owner }));
}

export function releaseAudioFocus(owner: string) {
  window.dispatchEvent(new CustomEvent(RELEASE, { detail: owner }));
}

export function onAudioFocus(handlers: {
  claimed: (owner: string) => void;
  released: (owner: string) => void;
}) {
  const claim = (e: Event) => handlers.claimed((e as CustomEvent).detail);
  const release = (e: Event) => handlers.released((e as CustomEvent).detail);
  window.addEventListener(CLAIM, claim);
  window.addEventListener(RELEASE, release);
  return () => {
    window.removeEventListener(CLAIM, claim);
    window.removeEventListener(RELEASE, release);
  };
}
