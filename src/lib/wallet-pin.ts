export const PIN_LENGTH = 6

/** Keeps only digits, so pasting "12 34-56" or typing a stray letter can't produce an invalid PIN. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '').slice(0, PIN_LENGTH)
}

/**
 * Mirrors the server's WalletPinPolicy so the form can explain the problem before a round trip.
 * The server is the one that actually enforces it.
 */
export function isWeakPin(pin: string): boolean {
  if (pin.length !== PIN_LENGTH) return true
  if (new Set(pin).size === 1) return true // 111111
  let ascending = true
  let descending = true
  for (let i = 1; i < pin.length; i++) {
    const step = pin.charCodeAt(i) - pin.charCodeAt(i - 1)
    ascending &&= step === 1
    descending &&= step === -1
  }
  if (ascending || descending) return true // 123456, 654321
  return [2, 3].some((block) => pin === pin.slice(0, block).repeat(PIN_LENGTH / block)) // 121212, 123123
}

export const WEAK_PIN_MESSAGE = 'Choose a PIN that is harder to guess — not repeated or sequential digits like 111111 or 123456.'
