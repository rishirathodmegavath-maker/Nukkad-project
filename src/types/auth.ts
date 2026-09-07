export interface Session {
  userId: string
  /** First/display name at the time of login — used for the "Welcome back" greeting. */
  name: string
  /** Whether this account has completed the onboarding flow; false routes to /onboarding. */
  onboardingCompleted: boolean
  /** Access token — sent as the Authorization bearer header. */
  token: string
  /** Opaque refresh token, used to silently mint a new access token on 401. */
  refreshToken: string
  /** ISO timestamp the access token expires at. */
  expiresAt: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupPayload {
  name: string
  email: string
  password: string
}

export interface DeviceSession {
  id: string
  deviceLabel: string
  ipAddress?: string
  lastUsedAt?: string
  createdAt: string
  isCurrent: boolean
}
