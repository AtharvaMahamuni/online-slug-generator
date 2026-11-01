import { describe, expect, it } from "vitest";
import { slugify } from "../../src/lib/slug/pipeline";
import { DEFAULT_CONFIG } from "../../src/lib/slug/presets";
import { foldLatinAscii } from "../../src/lib/slug/letters";
import { getStopWords } from "../../src/lib/slug/stopwords";

describe("multilingual slug engine", () => {
  it("folds German umlauts to ae, oe, ue when locale is de", () => {
    const input = "München & Köln über alles";
    const res = slugify(input, { ...DEFAULT_CONFIG, locale: "de" });
    expect(res.slug).toBe("muenchen-und-koeln-ueber-alles");
    expect(foldLatinAscii("ä ö ü Ä Ö Ü", "de").text).toBe("ae oe ue ae oe ue");
  });

  it("folds German umlauts to standard Latin a, o, u when locale is en", () => {
    const input = "München & Köln";
    const res = slugify(input, { ...DEFAULT_CONFIG, locale: "en" });
    expect(res.slug).toBe("munchen-and-koln");
  });

  it("converts ampersand according to active locale", () => {
    expect(slugify("Tom & Jerry", { ...DEFAULT_CONFIG, locale: "en" }).slug).toBe("tom-and-jerry");
    expect(slugify("Tom & Jerry", { ...DEFAULT_CONFIG, locale: "es" }).slug).toBe("tom-y-jerry");
    expect(slugify("Tom & Jerry", { ...DEFAULT_CONFIG, locale: "de" }).slug).toBe("tom-und-jerry");
    expect(slugify("Tom & Jerry", { ...DEFAULT_CONFIG, locale: "fr" }).slug).toBe("tom-et-jerry");
    expect(slugify("Tom & Jerry", { ...DEFAULT_CONFIG, locale: "pt" }).slug).toBe("tom-e-jerry");
  });

  it("applies Spanish stop words when enabled", () => {
    const input = "Rosas y Claveles de la Huerta";
    const res = slugify(input, { ...DEFAULT_CONFIG, locale: "es", stopWords: true });
    expect(res.slug).toBe("rosas-claveles-huerta");
    expect(res.flags.stopWordsRemoved).toBe(true);
  });

  it("applies French stop words when enabled", () => {
    const input = "Café et Croissants pour le Matin";
    const res = slugify(input, { ...DEFAULT_CONFIG, locale: "fr", stopWords: true });
    expect(res.slug).toBe("cafe-croissants-matin");
  });

  it("applies Portuguese stop words when enabled", () => {
    const input = "Pão e Queijo do Mercado";
    const res = slugify(input, { ...DEFAULT_CONFIG, locale: "pt", stopWords: true });
    expect(res.slug).toBe("pao-queijo-mercado");
  });

  it("returns language-specific stop word sets", () => {
    expect(getStopWords("es").has("del")).toBe(true);
    expect(getStopWords("de").has("und")).toBe(true);
    expect(getStopWords("fr").has("pour")).toBe(true);
    expect(getStopWords("pt").has("para")).toBe(true);
    expect(getStopWords("en").has("with")).toBe(true);
  });
});
