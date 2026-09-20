/**
 * Proof that the wallet PIN was entered recently, sent to the server as `X-Wallet-Token` on every
 * wallet request (see api-client). Held in memory only, on purpose: a page refresh, a new tab or
 * closing the browser must lock the wallet again, which localStorage/sessionStorage would defeat.
 * The server also expires it (10 minutes) and ties it to this user and PIN, so nothing here is
 * trusted — this module only remembers it.
 */
let token: string | null = null
let expiresAtMs = 0

export function setWalletUnlock(unlockToken: string, expiresInSeconds: number): void {
  token = unlockToken
  expiresAtMs = Date.now() + expiresInSeconds * 1000
}

export function getWalletUnlockToken(): string | null {
  if (token && Date.now() >= expiresAtMs) clearWalletUnlock()
  return token
}

export function getWalletUnlockExpiry(): number {
  return token ? expiresAtMs : 0
}

export function clearWalletUnlock(): void {
  token = null
  expiresAtMs = 0
}
