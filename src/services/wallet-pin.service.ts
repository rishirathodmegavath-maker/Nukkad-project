import { apiClient } from '@/lib/api-client'
import { setWalletUnlock } from '@/lib/wallet-unlock'

export interface WalletPinStatus {
  hasPin: boolean
  /** Seconds until a lockout (too many wrong PINs) ends; 0 when not locked. */
  lockedForSeconds: number
}

interface UnlockResponse {
  unlockToken: string
  expiresInSeconds: number
}

/** Every call that proves the PIN (or replaces it) hands back a fresh unlock token; keeping it here
 *  means no caller can forget to store it. */
async function rememberUnlock(request: Promise<UnlockResponse>): Promise<void> {
  const { unlockToken, expiresInSeconds } = await request
  setWalletUnlock(unlockToken, expiresInSeconds)
}

export function getWalletPinStatus(): Promise<WalletPinStatus> {
  return apiClient.get<WalletPinStatus>('/wallet/pin/status')
}

/** First-time setup. The account password is required so a merely-unattended session can't set the PIN. */
export function createWalletPin(pin: string, password: string): Promise<void> {
  return rememberUnlock(apiClient.post<UnlockResponse>('/wallet/pin', { pin, password }))
}

export function verifyWalletPin(pin: string): Promise<void> {
  return rememberUnlock(apiClient.post<UnlockResponse>('/wallet/pin/verify', { pin }))
}

export function changeWalletPin(currentPin: string, newPin: string): Promise<void> {
  return rememberUnlock(apiClient.post<UnlockResponse>('/wallet/pin/change', { currentPin, newPin }))
}

/** "Forgot PIN": proven with the account password instead of the old PIN. */
export function resetWalletPin(password: string, newPin: string): Promise<void> {
  return rememberUnlock(apiClient.post<UnlockResponse>('/wallet/pin/reset', { password, newPin }))
}
