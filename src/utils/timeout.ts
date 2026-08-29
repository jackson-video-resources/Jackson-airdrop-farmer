/**
 * Reject if a promise doesn't settle in time.
 *
 * Several L2 RPCs accept a request and then never answer; without a deadline
 * a bridge or transfer hangs the whole run with no error to act on.
 */
export function withTimeout<T>(
  p: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  let timer: NodeJS.Timeout;
  return Promise.race([
    p,
    new Promise<T>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`TIMEOUT after ${ms / 1000}s: ${label}`)),
        ms,
      );
    }),
  ]).finally(() => clearTimeout(timer)) as Promise<T>;
}
