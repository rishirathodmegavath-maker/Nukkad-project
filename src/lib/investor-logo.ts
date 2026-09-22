/**
 * The logo fallback chain for a catalog investor: (1) an admin-uploaded logo, (2) a real logo derived from the
 * investor's own domain — never fabricated, only used when that domain is genuinely on file — via a public
 * logo-lookup service, (3) an initials avatar. Step 3 isn't handled here: `<Avatar>` already falls through to
 * initials on its own `onError`, so this just picks what `src` it gets to try first.
 */
export function investorLogoSrc(logoUrl?: string, domain?: string): string | undefined {
  if (logoUrl) return logoUrl
  if (domain) return `https://logo.clearbit.com/${domain}?size=128`
  return undefined
}
