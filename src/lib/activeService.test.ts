import { describe, expect, it } from "vitest";
import {
  activeServiceIdFromPathname,
  isServiceSessionPathname,
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
