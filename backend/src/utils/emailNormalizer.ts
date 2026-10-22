export interface NormalizedEmailResult {
  rawEmail: string;
  canonicalEmail: string;
  domain: string;
  localPart: string;
}

export function normalizeEmail(rawEmail: string): NormalizedEmailResult {
  const trimmed = rawEmail.trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf("@");

  if (atIndex <= 0 || atIndex === trimmed.length - 1) {
    throw new Error("Invalid email address format");
  }

  let local = trimmed.slice(0, atIndex);
  let domain = trimmed.slice(atIndex + 1);

  // Strip +aliases (e.g. arpit+test@... -> arpit@...)
  const plusIndex = local.indexOf("+");
  if (plusIndex !== -1) {
    local = local.slice(0, plusIndex);
  }

  // Google / Gmail specific normalization
  if (domain === "gmail.com" || domain === "googlemail.com") {
    // Remove all dots in the local part
    local = local.replace(/\./g, "");
    domain = "gmail.com";
  }

  return {
    rawEmail: trimmed,
    canonicalEmail: `${local}@${domain}`,
    domain,
    localPart: local,
  };
}