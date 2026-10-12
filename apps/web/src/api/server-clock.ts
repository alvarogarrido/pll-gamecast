/**
 * Server-authoritative clock.
 *
 * Every API response carries `meta.serverTime`. We anchor to the most recently received one and
 * advance it with the monotonic `performance.now()`, so:
 *   - game logic (countdowns, "x min ago", live state) never depends on the device clock;
 *   - when the server time jumps (e.g. a scenario time-travels), the next response re-anchors us.
 */
class ServerClock {
  private anchor: { serverMs: number; perfMs: number } | null = null;
  private listeners = new Set<() => void>();

  /** Record a freshly received `meta.serverTime` (ISO 8601). */
  sync(serverTimeIso: string): void {
    const serverMs = Date.parse(serverTimeIso);
    if (Number.isNaN(serverMs)) return;
    this.anchor = { serverMs, perfMs: performance.now() };
    this.listeners.forEach((l) => l());
  }

  /** Current server time in epoch ms, or null until the first response arrived. */
  now(): number | null {
    if (!this.anchor) return null;
    return this.anchor.serverMs + (performance.now() - this.anchor.perfMs);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const serverClock = new ServerClock();
