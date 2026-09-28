/**
 * Finish work after the response has been sent.
 *
 * Public forms should not make the visitor wait while we send their confirmation
 * email or mirror the record into Future Assist — that is three network round
 * trips of dead time on /api/join. Vercel's `waitUntil()` keeps the invocation
 * alive for that work; the row is already stored by then, so a slow or failing
 * send can only affect the emails, never the record itself.
 *
 * Outside Vercel (the local dev server, or any plain Node host) there is no
 * request context to extend, so the promise is simply left to run. Everything
 * routed through here must be safe to lose and must handle its own errors.
 */

import { waitUntil } from '@vercel/functions';

export function runInBackground(promise) {
  const guarded = Promise.resolve(promise).catch((err) => {
    console.error('[background] task failed:', err);
  });

  try {
    waitUntil(guarded);
  } catch {
    // No Vercel request context: the promise keeps running on this process.
  }

  return guarded;
}
