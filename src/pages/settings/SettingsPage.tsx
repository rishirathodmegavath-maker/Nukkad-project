import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Camera, UserX, Monitor, LogOut as LogOutIcon, ShieldCheck } from 'lucide-react'
import { GoogleSignInButton } from '@/components/domain/GoogleSignInButton'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import {
  updateCurrentUser,
  uploadAvatar,
  listBlockedUsers,
  unblockUser,
  listMutedUsers,
  unmuteUser,
} from '@/services/users.service'
import { changePassword, listSessions, revokeSession, logoutAllOtherSessions } from '@/services/auth.service'
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationType,
} from '@/services/notification-preferences.service'
import { getAccountPrivacy, updateAccountPrivacy } from '@/services/account-privacy.service'
import { clearSession } from '@/lib/session'
import { cn } from '@/lib/utils'
import { useThemeStore, type ThemePreference } from '@/store/theme.store'
import { PresetGrid } from '@/components/settings/appearance/PresetGrid'
import { ColorPickerPanel } from '@/components/settings/appearance/ColorPickerPanel'
import { AdvancedCustomizationPanel } from '@/components/settings/appearance/AdvancedCustomizationPanel'
import { LivePreviewPanel } from '@/components/settings/appearance/LivePreviewPanel'
import type { AccountPrivacySettings, ConnectPermission, MessagePermission, ProfileVisibility } from '@/types'
import { PageHeader } from '@/components/domain/PageHeader'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Input, PasswordInput, Textarea, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { UploadButton, UploadSpinnerOverlay, type UploadPhase } from '@/components/ui/UploadButton'
import { Skeleton } from '@/components/ui/Skeleton'
import { toast } from '@/store/toast.store'
import type { Availability, User } from '@/types'

function AvatarUpload({ user }: { user: User }) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<UploadPhase>('idle')

  const mutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      toast.success('Profile picture updated')
      setPhase('done')
      setTimeout(() => setPhase('idle'), 1400)
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
      setPhase('idle')
    },
  })

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setPhase('uploading')
      mutation.mutate(file)
    }
    e.target.value = ''
  }

  return (
    <div className="flex items-center gap-4 mb-2">
      <button
        type="button"
        onClick={() => phase === 'idle' && fileInputRef.current?.click()}
        className="relative group cursor-pointer rounded-full"
        aria-label="Change profile picture"
      >
        <Avatar src={user.avatarUrl} name={user.name} size="xl" />
        <span className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Camera className="size-5 text-white" />
        </span>
        <UploadSpinnerOverlay phase={phase} />
      </button>
      <div>
        <UploadButton
          variant="secondary"
          size="sm"
          phase={phase}
          idleLabel="Change photo"
          uploadingLabel="Uploading…"
          doneLabel="Updated"
          onClick={() => fileInputRef.current?.click()}
        />
        <p className="text-xs text-fg-muted mt-1">PNG, JPEG, WEBP or GIF. Max 50MB.</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}

function ProfileForm({ user }: { user: User }) {
  const queryClient = useQueryClient()
  const [headline, setHeadline] = useState(user.headline)
  const [location, setLocation] = useState(user.location)
  const [bio, setBio] = useState(user.bio)
  const [availability, setAvailability] = useState<Availability>(user.availability)

  const mutation = useMutation({
    mutationFn: () => updateCurrentUser({ headline, location, bio, availability }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      toast.success('Profile updated')
    },
  })

  return (
    <Card>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          mutation.mutate()
        }}
        className="flex flex-col gap-4"
      >
        <AvatarUpload user={user} />
        <Input label="Headline" value={headline} onChange={(e) => setHeadline(e.target.value)} />
        <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        <Select label="Availability" value={availability} onChange={(e) => setAvailability(e.target.value as Availability)}>
          <option value="Full-time">Full-time</option>
          <option value="Part-time">Part-time</option>
          <option value="Weekends">Weekends</option>
          <option value="Not available">Not available</option>
        </Select>
        <Textarea label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
        <Button type="submit" isLoading={mutation.isPending} className="self-start mt-2">
          Save changes
        </Button>
      </form>
    </Card>
  )
}

function ConnectGoogleSection({ user }: { user: User }) {
  const queryClient = useQueryClient()

  function handleLinked() {
    queryClient.invalidateQueries({ queryKey: ['currentUser'] })
    toast.success('Google account connected.')
  }

  function handleError(err: Error) {
    toast.error(err.message || 'Could not connect Google account')
  }

  return (
    <Card>
      <h2 className="font-semibold text-fg mb-1">Google account</h2>
      <p className="text-sm text-fg-muted mb-3">
        Connect Google to use "Continue with Google" the next time you log in.
      </p>
      {user.googleLinked ? (
        <div className="flex items-center gap-2 text-sm font-medium text-success-500">
          <ShieldCheck className="size-4" />
          Google connected
        </div>
      ) : (
        <GoogleSignInButton mode="link" onSuccess={handleLinked} onError={handleError} />
      )}
    </Card>
  )
}

function ChangePasswordSection() {
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => changePassword(currentPassword, newPassword),
    onSuccess: () => {
      clearSession()
      toast.success('Password changed. Please log in again.')
      navigate('/login')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Could not change password')
    },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }
    setError('')
    mutation.mutate()
  }

  return (
    <Card>
      <h2 className="font-semibold text-fg mb-1">Change password</h2>
      <p className="text-sm text-fg-muted mb-3">You'll be logged out of all devices after changing your password.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <PasswordInput
          label="Current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <PasswordInput
          label="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
        <PasswordInput
          label="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          error={error || undefined}
          required
        />
        <Button type="submit" isLoading={mutation.isPending} className="self-start mt-2">
          Change password
        </Button>
      </form>
    </Card>
  )
}

function SessionsSection() {
  const queryClient = useQueryClient()
  const { data: sessions, isLoading } = useQuery({ queryKey: ['auth', 'sessions'], queryFn: listSessions })

  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) => revokeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] })
      toast.success('Session logged out')
    },
  })

  const logoutAllMutation = useMutation({
    mutationFn: logoutAllOtherSessions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] })
      toast.success('Logged out of all other devices')
    },
  })

  return (
    <Card>
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-semibold text-fg">Where you're logged in</h2>
        {sessions && sessions.length > 1 && (
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<LogOutIcon className="size-3.5" />}
            isLoading={logoutAllMutation.isPending}
            onClick={() => logoutAllMutation.mutate()}
          >
            Log out of all other devices
          </Button>
        )}
      </div>
      {isLoading ? (
        <Skeleton className="h-20 w-full rounded-xl mt-2" />
      ) : (
        <div className="flex flex-col divide-y divide-border-subtle mt-2">
          {(sessions ?? []).map((session) => (
            <div key={session.id} className="flex items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <Monitor className="size-4 text-fg-muted shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-fg truncate">
                    {session.deviceLabel}
                    {session.isCurrent && <span className="ml-2 text-xs font-normal text-brand-600">This device</span>}
                  </p>
                  <p className="text-xs text-fg-muted truncate">
                    {session.ipAddress ?? 'Unknown IP'}
                    {session.lastUsedAt ? ` · Active ${new Date(session.lastUsedAt).toLocaleString()}` : ''}
                  </p>
                </div>
              </div>
              {!session.isCurrent && (
                <Button
                  size="sm"
                  variant="secondary"
                  isLoading={revokeMutation.isPending && revokeMutation.variables === session.id}
                  onClick={() => revokeMutation.mutate(session.id)}
                >
                  Log out
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

const NOTIFICATION_TYPE_LABELS: { type: NotificationType; label: string }[] = [
  { type: 'connection', label: 'Connections' },
  { type: 'idea_interest', label: 'Idea interest' },
  { type: 'opportunity', label: 'Opportunities' },
  { type: 'startup', label: 'Startup teams' },
  { type: 'endorsement', label: 'Endorsements' },
  { type: 'recommendation', label: 'Recommendations' },
]

function NotificationPreferencesSection() {
  const queryClient = useQueryClient()
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: getNotificationPreferences,
  })

  const mutation = useMutation({
    mutationFn: (updates: Partial<Record<NotificationType, boolean>>) => updateNotificationPreferences(updates),
    onSuccess: (updated) => {
      queryClient.setQueryData(['notification-preferences'], updated)
      toast.success('Notification preferences saved')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save preferences'),
  })

  if (isLoading) return <Skeleton className="h-48 w-full rounded-xl" />

  return (
    <Card>
      <h2 className="font-semibold text-fg mb-1">Notification preferences</h2>
      <p className="text-sm text-fg-muted mb-3">Choose which activity sends you a notification.</p>
      <div className="flex flex-col divide-y divide-border-subtle">
        {NOTIFICATION_TYPE_LABELS.map(({ type, label }) => {
          const enabled = preferences?.[type] ?? true
          return (
            <div key={type} className="flex items-center justify-between gap-3 py-3">
              <span className="text-sm font-medium text-fg">{label}</span>
              <div className="flex gap-1">
                {[
                  { value: true, label: 'On' },
                  { value: false, label: 'Off' },
                ].map((opt) => (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => mutation.mutate({ [type]: opt.value })}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-xs font-medium border cursor-pointer transition-colors',
                      enabled === opt.value
                        ? 'bg-brand-500 text-white border-brand-500'
                        : 'bg-surface text-fg-secondary border-border hover:bg-surface-hover',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function PrivacyPillGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-xl px-3 py-1.5 text-xs font-medium border cursor-pointer transition-all duration-150 active:scale-[0.98]',
            value === opt.value
              ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
              : 'bg-surface text-fg-secondary border-border/80 hover:bg-surface-hover hover:border-border-strong hover:text-fg',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function AccountPrivacySection() {
  const queryClient = useQueryClient()
  const { data: settings, isLoading } = useQuery({ queryKey: ['account-privacy'], queryFn: getAccountPrivacy })

  const mutation = useMutation({
    mutationFn: (updates: Partial<AccountPrivacySettings>) => updateAccountPrivacy(updates),
    onSuccess: (updated) => {
      queryClient.setQueryData(['account-privacy'], updated)
      toast.success('Privacy settings saved')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save privacy settings'),
  })

  if (isLoading || !settings) return <Skeleton className="h-48 w-full rounded-xl" />

  return (
    <Card>
      <h2 className="font-semibold text-fg mb-1">Privacy</h2>
      <p className="text-sm text-fg-muted mb-3">Control who can see your profile, message you, or send you a connection request.</p>
      <div className="flex flex-col divide-y divide-border-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3">
          <span className="text-sm font-medium text-fg">Profile visibility</span>
          <PrivacyPillGroup<ProfileVisibility>
            value={settings.profileVisibility}
            options={[
              { value: 'EVERYONE', label: 'Everyone' },
              { value: 'CONNECTIONS', label: 'Connections only' },
            ]}
            onChange={(profileVisibility) => mutation.mutate({ profileVisibility })}
          />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3">
          <span className="text-sm font-medium text-fg">Who can message me</span>
          <PrivacyPillGroup<MessagePermission>
            value={settings.messagePermission}
            options={[
              { value: 'EVERYONE', label: 'Everyone' },
              { value: 'CONNECTIONS', label: 'Connections only' },
            ]}
            onChange={(messagePermission) => mutation.mutate({ messagePermission })}
          />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3">
          <span className="text-sm font-medium text-fg">Who can connect with me</span>
          <PrivacyPillGroup<ConnectPermission>
            value={settings.connectPermission}
            options={[
              { value: 'EVERYONE', label: 'Everyone' },
              { value: 'MUTUAL_CONNECTIONS', label: 'Mutual connections' },
              { value: 'NOBODY', label: 'Nobody' },
            ]}
            onChange={(connectPermission) => mutation.mutate({ connectPermission })}
          />
        </div>
      </div>
    </Card>
  )
}

function AppearanceSection() {
  const themePreference = useThemeStore((s) => s.themePreference)
  const setThemePreference = useThemeStore((s) => s.setThemePreference)
  const resetTheme = useThemeStore((s) => s.resetTheme)
  const resetToDefault = useThemeStore((s) => s.resetToDefault)
  const [restoringDefault, setRestoringDefault] = useState(false)

  async function handleRestoreDefault() {
    setRestoringDefault(true)
    try {
      await resetToDefault()
      toast.success('Restored Nukkad default appearance')
    } finally {
      setRestoringDefault(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h2 className="font-semibold text-fg mb-1">Preview</h2>
        <p className="text-sm text-fg-muted mb-4">Updates instantly as you change anything below.</p>
        <LivePreviewPanel />
      </Card>

      <Card>
        <h2 className="font-semibold text-fg mb-1">Appearance</h2>
        <p className="text-sm text-fg-muted mb-3">Choose how Nukkad looks on this device.</p>
        <div className="flex items-center justify-between gap-3 py-3">
          <span className="text-sm font-medium text-fg">Theme</span>
          <PrivacyPillGroup<ThemePreference>
            value={themePreference}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ]}
            onChange={setThemePreference}
          />
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-fg">Theme colour</h2>
          <button type="button" onClick={resetTheme} className="text-xs font-medium text-fg-muted hover:text-fg cursor-pointer">
            Reset theme
          </button>
        </div>
        <p className="text-sm text-fg-muted mb-4">Pick a professionally designed accent colour for buttons, links, and active states.</p>
        <PresetGrid />
      </Card>

      <Card>
        <h2 className="font-semibold text-fg mb-1">Custom colour</h2>
        <p className="text-sm text-fg-muted mb-4">Or choose your own — Nukkad generates a complete, accessible palette from it automatically.</p>
        <ColorPickerPanel />
      </Card>

      <Card>
        <AdvancedCustomizationPanel />
      </Card>

      <button
        type="button"
        disabled={restoringDefault}
        onClick={handleRestoreDefault}
        className="self-start text-xs font-medium text-fg-muted hover:text-fg cursor-pointer disabled:opacity-50"
      >
        Reset to Nukkad Default
      </button>
    </div>
  )
}

function BlockedUsersSection() {
  const queryClient = useQueryClient()
  const { data: blockedUsers, isLoading } = useQuery({ queryKey: ['users', 'blocked'], queryFn: listBlockedUsers })

  const unblockMutation = useMutation({
    mutationFn: (userId: string) => unblockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'blocked'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Unblocked')
    },
  })

  if (isLoading) return <Skeleton className="h-24 w-full rounded-xl" />
  if (!blockedUsers || blockedUsers.length === 0) return null

  return (
    <Card>
      <h2 className="font-semibold text-fg mb-1">Blocked accounts</h2>
      <p className="text-sm text-fg-muted mb-3">People you've blocked can't message you or find your profile.</p>
      <div className="flex flex-col divide-y divide-border-subtle">
        {blockedUsers.map((user) => (
          <div key={user.id} className="flex items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar src={user.avatarUrl} name={user.name} size="sm" />
              <span className="text-sm font-medium text-fg truncate">{user.name}</span>
            </div>
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<UserX className="size-3.5" />}
              isLoading={unblockMutation.isPending && unblockMutation.variables === user.id}
              onClick={() => unblockMutation.mutate(user.id)}
            >
              Unblock
            </Button>
          </div>
        ))}
      </div>
    </Card>
  )
}

function MutedAccountsSection() {
  const queryClient = useQueryClient()
  const { data: mutedUsers, isLoading } = useQuery({ queryKey: ['users', 'muted'], queryFn: listMutedUsers })

  const unmuteMutation = useMutation({
    mutationFn: (userId: string) => unmuteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'muted'] })
      toast.success('Unmuted')
    },
  })

  if (isLoading) return <Skeleton className="h-24 w-full rounded-xl" />
  if (!mutedUsers || mutedUsers.length === 0) return null

  return (
    <Card>
      <h2 className="font-semibold text-fg mb-1">Muted accounts</h2>
      <p className="text-sm text-fg-muted mb-3">You won't get notifications about their activity. You're still connected.</p>
      <div className="flex flex-col divide-y divide-border-subtle">
        {mutedUsers.map((user) => (
          <div key={user.id} className="flex items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar src={user.avatarUrl} name={user.name} size="sm" />
              <span className="text-sm font-medium text-fg truncate">{user.name}</span>
            </div>
            <Button
              size="sm"
              variant="secondary"
              isLoading={unmuteMutation.isPending && unmuteMutation.variables === user.id}
              onClick={() => unmuteMutation.mutate(user.id)}
            >
              Unmute
            </Button>
          </div>
        ))}
      </div>
    </Card>
  )
}

type SettingsGroup = 'account' | 'security' | 'privacy' | 'notifications' | 'network' | 'preferences'

const SETTINGS_GROUPS: { key: SettingsGroup; label: string }[] = [
  { key: 'account', label: 'Account' },
  { key: 'security', label: 'Security' },
  { key: 'privacy', label: 'Privacy' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'network', label: 'Network' },
  { key: 'preferences', label: 'Preferences' },
]

export default function SettingsPage() {
  const { data: user, isLoading } = useCurrentUser()
  const [group, setGroup] = useState<SettingsGroup>('account')

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 w-full">
      <PageHeader title="Settings" description="Manage your account preferences, privacy, and security." />
      <Tabs items={SETTINGS_GROUPS} value={group} onChange={(key) => setGroup(key as SettingsGroup)} />

      {group === 'account' &&
        (isLoading || !user ? <Skeleton className="h-96 w-full rounded-xl" /> : <ProfileForm user={user} />)}

      {group === 'security' && (
        <div className="flex flex-col gap-6">
          <SessionsSection />
          <ChangePasswordSection />
          {user && <ConnectGoogleSection user={user} />}
        </div>
      )}

      {group === 'privacy' && <AccountPrivacySection />}

      {group === 'notifications' && <NotificationPreferencesSection />}

      {group === 'network' && (
        <div className="flex flex-col gap-6">
          <BlockedUsersSection />
          <MutedAccountsSection />
        </div>
      )}

      {group === 'preferences' && <AppearanceSection />}
    </div>
  )
}
