import crypto from "crypto";

const ADJECTIVES = [
  "swift", "bright", "bold", "crisp", "prime", "vivid", "hyper", "ultra",
  "zen", "cosmic", "solar", "lunar", "epic", "rapid", "steady", "keen"
];

const NOUNS = [
  "fox", "hawk", "lion", "wolf", "stag", "bear", "lynx", "orca",
  "falcon", "tiger", "comet", "spark", "pulse", "beacon", "vector", "orbit"
];

export function generateReferralCode(customPrefix?: string): string {
  const randomSuffix = crypto.randomBytes(3).toString("hex").slice(0, 4);

  if (customPrefix) {
    const cleanPrefix = customPrefix
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 8);
    if (cleanPrefix.length >= 3) {
      return `${cleanPrefix}-${randomSuffix}`;
    }
  }

  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj}-${noun}-${randomSuffix}`;
}