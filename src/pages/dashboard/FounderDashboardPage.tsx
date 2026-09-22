import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Eye, Handshake, Briefcase, Heart, CalendarDays, Rocket, Pencil, UserPlus, Landmark } from 'lucide-react'
import { getFounderDashboard } from '@/services/dashboard.service'
import { PageHeader } from '@/components/domain/PageHeader'
import { StatTile } from '@/components/domain/StatTile'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'

export default function FounderDashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard', 'founder'],
    queryFn: getFounderDashboard,
  })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return <ErrorState title="Couldn't load your dashboard" onRetry={refetch} />
  }

  if (!data.hasFoundedStartup) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Founder Dashboard" description="Track how people are discovering and engaging with what you're building." />
        <EmptyState
          icon={<Rocket className="size-6" />}
          title="You haven't founded a startup yet"
          description="Register a startup on BuildAdda to unlock your dashboard — profile views, investor interest, applications, followers, and more."
          action={
            <Link to="/startups/new">
              <Button size="sm">Register your startup</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Founder Dashboard"
        description={
          data.startupCount > 1
            ? `Aggregated across the ${data.startupCount} startups you founded.`
            : `A snapshot of how ${data.primaryStartupName} is doing.`
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatTile icon={<Eye className="size-5" />} label="Profile views" value={data.profileViews} />
        <StatTile icon={<Handshake className="size-5" />} label="Investor interests" value={data.investorInterests} />
        <StatTile icon={<Briefcase className="size-5" />} label="Job applications" value={data.jobApplications} />
        <StatTile icon={<Heart className="size-5" />} label="Followers" value={data.followers} />
        <StatTile icon={<CalendarDays className="size-5" />} label="Event RSVPs" value={data.eventRsvps} />
      </div>

      <Card>
        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 className="font-semibold text-fg">Profile completion</h2>
          <span className="text-sm font-bold text-fg">{data.profileCompletionPercent}%</span>
        </div>
        <div className="h-2 rounded-full bg-surface-sunken overflow-hidden">
          <div className="h-full bg-brand-500" style={{ width: `${data.profileCompletionPercent}%` }} />
        </div>
        {data.profileCompletionPercent < 100 && data.primaryStartupId && (
          <p className="text-sm text-fg-muted mt-3">
            A fuller profile shows up better in discovery.{' '}
            <Link to={`/startups/${data.primaryStartupId}`} className="text-fg-brand hover:underline font-medium">
              Complete your profile
            </Link>
          </p>
        )}
      </Card>

      <Card>
        <h2 className="font-semibold text-fg mb-3">Quick actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {data.primaryStartupId && (
            <Link to={`/startups/${data.primaryStartupId}`}>
              <Button variant="secondary" className="w-full" leftIcon={<Pencil className="size-3.5" />}>
                Edit startup profile
              </Button>
            </Link>
          )}
          <Link to={`/opportunities/new${data.primaryStartupId ? `?startupId=${data.primaryStartupId}` : ''}`}>
            <Button variant="secondary" className="w-full" leftIcon={<Briefcase className="size-3.5" />}>
              Post an opportunity
            </Button>
          </Link>
          <Link to="/investors">
            <Button variant="secondary" className="w-full" leftIcon={<Landmark className="size-3.5" />}>
              Find investors
            </Button>
          </Link>
          {data.primaryStartupId && (
            <Link to={`/startups/${data.primaryStartupId}`}>
              <Button variant="secondary" className="w-full" leftIcon={<UserPlus className="size-3.5" />}>
                Manage team
              </Button>
            </Link>
          )}
        </div>
      </Card>
    </div>
  )
}
