export function getSafeRedirectPath(
  candidate: string | null | undefined
): string {
  if (
    !candidate ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    /[\u0000-\u001f]/.test(candidate)
  ) {
    return "/";
  }

  try {
    const decoded = decodeURIComponent(candidate);
    if (decoded.startsWith("//") || decoded.includes("\\")) {
      return "/";
    }

    const destination = new URL(candidate, "https://addis-eats.invalid");
    return destination.origin === "https://addis-eats.invalid"
      ? `${destination.pathname}${destination.search}${destination.hash}`
      : "/";
  } catch {
    return "/";
  }
}
