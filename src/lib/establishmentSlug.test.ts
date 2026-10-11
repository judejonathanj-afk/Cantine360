import { describe, expect, it } from "vitest";
import {
  normalizeEstablishmentSlug,
  slugFromEstablishmentName,
} from "@/lib/establishmentSlug";

describe("establishmentSlug", () => {
  it("translitère les accents français", () => {
    expect(slugFromEstablishmentName("École élémentaire Les Tilleuls")).toBe(
      "ecole-elementaire-les-tilleuls",
    );
  });

  it("normalise le slug saisi à la connexion comme à la création", () => {
    expect(normalizeEstablishmentSlug("  ÉCOLE-Martin  ")).toBe("ecole-martin");
  });
});
