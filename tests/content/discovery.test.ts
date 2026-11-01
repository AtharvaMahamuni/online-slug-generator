import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { identityGraph } from "../../src/lib/site";

const publicDir = path.resolve("public");

function read(name: string): string {
  return readFileSync(path.join(publicDir, name), "utf8");
}

const allow = ["Googlebot", "Bingbot", "OAI-SearchBot", "Claude-SearchBot", "PerplexityBot", "Applebot"];
const disallow = ["GPTBot", "ClaudeBot", "Google-Extended", "Applebot-Extended", "CCBot"];

describe("discovery files", () => {
  it("keeps identity.json equal to the page graph and free of an address", () => {
    const file = JSON.parse(read("identity.json")) as { "@graph": unknown[] };
    expect(file).toEqual(identityGraph());
    expect(JSON.stringify(file).toLowerCase()).not.toContain("streetaddress");
    expect(JSON.stringify(file)).toContain("https://x.com/athmatwt");
  });

  it("keeps ai.json on the same crawler policy as robots.txt", () => {
    const robots = read("robots.txt");
    const ai = JSON.parse(read("ai.json")) as {
      policy: { training: string };
      crawlers: { allow: string[]; disallow: string[] };
    };
    expect(ai.policy.training).toBe("disallowed");
    expect(ai.crawlers.allow).toEqual(allow);
    expect(ai.crawlers.disallow).toEqual(disallow);
    for (const bot of allow) {
      expect(robots).toContain(`User-agent: ${bot}\nAllow: /`);
    }
    for (const bot of disallow) {
      expect(robots).toContain(`User-agent: ${bot}\nDisallow: /`);
      expect(read("ai.txt")).toContain(`User-agent: ${bot}\nDisallow: /`);
      expect(read("robots-ai.txt")).toContain(`User-agent: ${bot}\nDisallow: /`);
    }
  });

  it("lists the standard files from llms.txt and does not call them a ranking method", () => {
    const llms = read("llms.txt");
    for (const file of ["llms-full.txt", "ai.txt", "ai.json", "identity.json", "brand.txt", "faq-ai.txt", "llm.txt", "robots-ai.txt"]) {
      expect(llms).toContain(file);
      expect(read(file).length).toBeGreaterThan(40);
    }
    expect(llms.toLowerCase()).toContain("does not help or hurt google search");
    expect(read("faq-ai.txt")).not.toContain("FAQPage");
  });
});
