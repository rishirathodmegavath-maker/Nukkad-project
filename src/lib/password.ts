/** Mirrors the backend's @StrongPassword rule (StrongPasswordValidator): the server is the real
 *  check; this only lets a form say what's wrong before a round trip. */
export const PASSWORD_REQUIREMENTS =
  'At least 10 characters, with an uppercase letter, a lowercase letter, a number, and a special character.'

export function isStrongPassword(password: string): boolean {
  return (
    password.length >= 10 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9\s]/.test(password)
  )
}
