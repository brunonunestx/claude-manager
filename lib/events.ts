import { EventEmitter } from "node:events";

export type SessionEvent =
  | { type: "status"; status: string }
  | { type: "message"; message: unknown }
  | { type: "done" };

class SessionEventBus extends EventEmitter {
  publish(sessionId: string, event: SessionEvent) {
    this.emit(sessionId, event);
  }

  subscribe(sessionId: string, listener: (event: SessionEvent) => void) {
    this.on(sessionId, listener);
    return () => {
      this.off(sessionId, listener);
    };
  }
}

// Global singleton so route handlers and the runner share the same bus
// across Next.js module reloads in dev.
const globalForEvents = globalThis as unknown as { sessionEvents?: SessionEventBus };

export const sessionEvents = globalForEvents.sessionEvents ?? new SessionEventBus();
sessionEvents.setMaxListeners(0);

if (process.env.NODE_ENV !== "production") {
  globalForEvents.sessionEvents = sessionEvents;
}
