import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  activeServiceIdFromPathname,
  isServiceSessionPathname,
  readRememberedServiceId,
  rememberActiveServiceId,
  ACTIVE_SERVICE_STORAGE_KEY,
} from "@/lib/activeService";

describe("activeServiceIdFromPathname", () => {
  it("extrait l’id sur la page service", () => {
    expect(activeServiceIdFromPathname("/service/cmrebg0pq000104jg6dhmuj3z")).toBe(
      "cmrebg0pq000104jg6dhmuj3z",
    );
  });

  it("extrait l’id sur menu et classe", () => {
    expect(
      activeServiceIdFromPathname("/service/cmrebg0pq000104jg6dhmuj3z/menu"),
    ).toBe("cmrebg0pq000104jg6dhmuj3z");
    expect(
      activeServiceIdFromPathname("/service/cmrebg0pq000104jg6dhmuj3z/group/abc"),
    ).toBe("cmrebg0pq000104jg6dhmuj3z");
  });

  it("retourne null sur l’accueil service", () => {
    expect(activeServiceIdFromPathname("/service")).toBeNull();
    expect(isServiceSessionPathname("/service")).toBe(false);
  });
});

describe("rememberActiveServiceId", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal("window", {
      sessionStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
        removeItem: (key: string) => {
          store.delete(key);
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("persiste et relit l’id actif", () => {
    rememberActiveServiceId("svc-123");
    expect(store.get(ACTIVE_SERVICE_STORAGE_KEY)).toBe("svc-123");
    expect(readRememberedServiceId()).toBe("svc-123");
  });

  it("efface l’id (fin de service)", () => {
    rememberActiveServiceId("svc-123");
    rememberActiveServiceId(null);
    expect(readRememberedServiceId()).toBeNull();
  });

  it("tolère un sessionStorage indisponible", () => {
    vi.stubGlobal("window", {
      sessionStorage: {
        getItem: () => {
          throw new Error("blocked");
        },
        setItem: () => {
          throw new Error("blocked");
        },
        removeItem: () => {
          throw new Error("blocked");
        },
      },
    });
    expect(() => rememberActiveServiceId("x")).not.toThrow();
    expect(readRememberedServiceId()).toBeNull();
  });
});
