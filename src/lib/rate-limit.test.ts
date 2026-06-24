import type { checkRateLimit as CheckRateLimitFn } from "./rate-limit";

// Each helper gets a fresh module instance (no shared in-memory bucket state).
function freshCheck(perIp: number, global: number): typeof CheckRateLimitFn {
  process.env.RATE_LIMIT_PER_IP = String(perIp);
  process.env.RATE_LIMIT_GLOBAL = String(global);
  let fn!: typeof CheckRateLimitFn;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ({ checkRateLimit: fn } = require("./rate-limit"));
  });
  return fn;
}

describe("checkRateLimit — per-IP limit", () => {
  it("allows requests within the per-IP limit", () => {
    const check = freshCheck(3, 1000);
    expect(check("1.2.3.4")).toEqual({ allowed: true });
    expect(check("1.2.3.4")).toEqual({ allowed: true });
    expect(check("1.2.3.4")).toEqual({ allowed: true });
  });

  it("blocks the request that exceeds the per-IP limit", () => {
    const check = freshCheck(2, 1000);
    check("5.5.5.5");
    check("5.5.5.5");
    expect(check("5.5.5.5")).toEqual({ allowed: false, reason: "ip_limit" });
  });

  it("tracks different IPs independently", () => {
    const check = freshCheck(1, 1000);
    expect(check("10.0.0.1")).toEqual({ allowed: true });
    expect(check("10.0.0.2")).toEqual({ allowed: true });
    expect(check("10.0.0.1")).toEqual({ allowed: false, reason: "ip_limit" });
    expect(check("10.0.0.2")).toEqual({ allowed: false, reason: "ip_limit" });
  });
});

describe("checkRateLimit — global limit", () => {
  it("blocks when the global limit is exhausted", () => {
    const check = freshCheck(1000, 2);
    check("a.a.a.a");
    check("b.b.b.b");
    expect(check("c.c.c.c")).toEqual({ allowed: false, reason: "global_limit" });
  });

  it("rejects with global_limit before checking per-IP", () => {
    const check = freshCheck(1000, 1);
    check("x.x.x.x");
    // global exhausted — a brand-new IP should still be blocked
    expect(check("y.y.y.y")).toEqual({ allowed: false, reason: "global_limit" });
  });
});

describe("checkRateLimit — UTC day rollover", () => {
  afterEach(() => jest.restoreAllMocks());

  it("resets counts when the UTC day advances", () => {
    const now = Date.now();
    jest.spyOn(Date, "now").mockReturnValue(now);

    const check = freshCheck(1, 1000);
    check("rollover-ip");
    expect(check("rollover-ip")).toEqual({ allowed: false, reason: "ip_limit" });

    // Jump to the next UTC day
    jest.spyOn(Date, "now").mockReturnValue(now + 86_400_000);
    expect(check("rollover-ip")).toEqual({ allowed: true });
  });
});
