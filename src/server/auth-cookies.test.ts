import { describe, expect, it } from "vitest";
import {
  MAX_ESTABLISHMENT_SESSIONS,
  pruneEstablishmentSessionsMap,
} from "@/server/auth-cookies";

describe("pruneEstablishmentSessionsMap", () => {
  it("laisse de la place pour keepId puis plafonne à max", () => {
    const map: Record<string, string> = {};
    for (let i = 0; i < MAX_ESTABLISHMENT_SESSIONS + 3; i++) {
      map[`est-${i}`] = `token-${i}`;
    }
    const pruned = pruneEstablishmentSessionsMap(map, "est-new");
    expect(Object.keys(pruned)).not.toContain("est-new");
    expect(Object.keys(pruned).length).toBe(MAX_ESTABLISHMENT_SESSIONS - 1);
    const withLogin = { ...pruned, "est-new": "token-new" };
    expect(Object.keys(withLogin)).toHaveLength(MAX_ESTABLISHMENT_SESSIONS);
    expect(withLogin["est-new"]).toBe("token-new");
  });

  it("conserve keepId déjà présent sans dépasser max", () => {
    const map = {
      a: "1",
      b: "2",
      c: "3",
      d: "4",
      e: "5",
    };
    const pruned = pruneEstablishmentSessionsMap(map, "e", 5);
    expect(pruned.e).toBe("5");
    expect(Object.keys(pruned)).toHaveLength(5);
  });
});
