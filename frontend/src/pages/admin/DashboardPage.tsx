import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  CalendarHeart,
  CheckCircle2,
  Clock3,
  HeartHandshake,
  Mail,
  Plus,
  Send,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import { api, getApiErrorMessage } from '@/lib/api'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { PageHeader, PageLoader, StatCard, Badge, EmptyState } from '@/components/ui/Primitives'
import { Button } from '@/components/ui/Button'
import { formatDateTime, relativeTime } from '@/lib/utils'
import type { ApiEnvelope, DashboardMetrics } from '@/types'

const activityIcons: Record<string, typeof Sparkles> = {
  created: Sparkles,
  published: Send,
  rsvp_received: Mail,
  section_added: CalendarHeart,
  section_updated: CalendarHeart,
  updated: Clock3,
}

export function DashboardPage() {
  useDocumentTitle('Dashboard — Ever After Studio')

  const query = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<DashboardMetrics>>('/dashboard')
      return data.data
    },
  })

  if (query.isLoading) return <PageLoader label="Gathering the latest" />

  if (query.isError || !query.data) {
    return (
      <EmptyState
        title="The dashboard could not be loaded"
        description={getApiErrorMessage(query.error)}
        action={
          <Button onClick={() => query.refetch()} variant="outline">
            Try again
          </Button>
        }
      />
    )
  }

  const metrics = query.data
  const recentRsvps = metrics.recent_rsvps
  const activities = metrics.recent_activity
  const maxRsvps = Math.max(1, ...metrics.invitation_breakdown.map((invitation) => invitation.rsvps_count))

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Studio overview"
        title={
          <>
            Every celebration,
            <span className="block italic text-wine">held in one place.</span>
          </>
        }
        description="A quiet view of what is published, who has replied and what needs your attention next."
        actions={
          <>
            <Link to="/admin/rsvps" className="btn-outline">
              <Mail className="h-3.5 w-3.5" /> All RSVPs
            </Link>
            <Link to="/admin/invitations/new" className="btn-primary">
              <Plus className="h-3.5 w-3.5" /> New invitation
            </Link>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Invitations"
          value={metrics.invitations.total}
          hint={`${metrics.invitations.published} published · ${metrics.invitations.draft} in draft`}
          icon={<CalendarHeart className="h-4 w-4" />}
        />
        <StatCard
          label="RSVP responses"
          value={metrics.rsvps.total}
          hint={`${metrics.rsvps.attending_responses} accepting · ${metrics.rsvps.declined_responses} declining`}
          icon={<Mail className="h-4 w-4" />}
        />
        <StatCard
          label="Confirmed guests"
          value={metrics.rsvps.confirmed_guests}
          hint="Seats promised across every celebration"
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="Attendance rate"
          value={`${Math.round(metrics.attendance_rate)}%`}
          hint="Of responses received so far"
          icon={<TrendingUp className="h-4 w-4" />}
          accent
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        <section className="admin-card overflow-hidden xl:col-span-8">
          <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-5 py-4">
            <div>
              <h2 className="font-display text-2xl leading-none text-ink">Latest replies</h2>
              <p className="mt-1 text-xs text-ink/40">The most recent guests to answer your invitation.</p>
            </div>
            <Link to="/admin/rsvps" className="btn-ghost btn-sm">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentRsvps.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<Mail className="h-5 w-5" />}
                title="No replies yet"
                description="When a guest sends an RSVP it will appear here with their meal choice, notes and guest count."
                className="border-0 bg-transparent py-10"
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table min-w-[38rem]">
                <thead>
                  <tr>
                    <th>Guest</th>
                    <th>Invitation</th>
                    <th>Reply</th>
                    <th>Received</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRsvps.map((rsvp) => (
                    <tr key={rsvp.id}>
                      <td>
                        <p className="font-medium text-ink">{rsvp.guest_name}</p>
                        <p className="mt-0.5 text-xs text-ink/40">{rsvp.email ?? rsvp.phone ?? 'No contact shared'}</p>
                      </td>
                      <td>
                        <p className="max-w-[12rem] truncate text-xs text-ink/60">{rsvp.invitation?.title ?? 'Invitation'}</p>
                      </td>
                      <td>
                        {rsvp.attendance === 'attending' ? (
                          <Badge tone="green">
                            <CheckCircle2 className="h-3 w-3" /> {rsvp.guest_count} attending
                          </Badge>
                        ) : (
                          <Badge tone="red">Declined</Badge>
                        )}
                      </td>
                      <td>
                        <span title={formatDateTime(rsvp.created_at)} className="text-xs text-ink/45">
                          {relativeTime(rsvp.created_at)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="admin-card xl:col-span-4">
          <div className="border-b border-ink/10 px-5 py-4">
            <h2 className="font-display text-2xl leading-none text-ink">Studio activity</h2>
            <p className="mt-1 text-xs text-ink/40">A thread of the latest changes.</p>
          </div>
          <div className="px-5 py-4">
            {activities.length === 0 ? (
              <p className="py-8 text-center text-xs text-ink/40">Nothing has happened yet.</p>
            ) : (
              <ol className="relative space-y-4 border-l border-ink/10 pl-5">
                {activities.map((activity) => {
                  const Icon = activityIcons[activity.type] ?? Clock3
                  return (
                    <li key={activity.id} className="relative">
                      <span className="absolute -left-[1.65rem] flex h-6 w-6 items-center justify-center rounded-full border border-ink/10 bg-cream text-ink/45">
                        <Icon className="h-3 w-3" />
                      </span>
                      <p className="text-xs leading-snug text-ink/70">{activity.description}</p>
                      <p className="mt-1 text-[0.6rem] uppercase tracking-[0.12em] text-ink/30">
                        {relativeTime(activity.created_at)}
                        {activity.user?.name ? ` · ${activity.user.name}` : ''}
                      </p>
                    </li>
                  )
                })}
              </ol>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        <section className="admin-card xl:col-span-8">
          <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-5 py-4">
            <div>
              <h2 className="font-display text-2xl leading-none text-ink">Invitation pulse</h2>
              <p className="mt-1 text-xs text-ink/40">Responses and confirmed guests by invitation.</p>
            </div>
            <Link to="/admin/invitations" className="btn-ghost btn-sm">
              Manage <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-4 p-5">
            {metrics.invitation_breakdown.length === 0 ? (
              <p className="py-8 text-center text-xs text-ink/40">Create your first invitation to see the pulse.</p>
            ) : (
              metrics.invitation_breakdown.map((invitation) => (
                <div key={invitation.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <Link
                        to={`/admin/invitations/${invitation.id}/edit`}
                        className="truncate text-sm font-medium text-ink hover:text-wine"
                      >
                        {invitation.title}
                      </Link>
                      <Badge tone={invitation.status === 'published' ? 'green' : invitation.status === 'draft' ? 'neutral' : 'amber'}>
                        {invitation.status}
                      </Badge>
                    </div>
                    <span className="shrink-0 text-[0.62rem] uppercase tracking-[0.12em] text-ink/40">
                      {invitation.rsvps_count} replies · {invitation.confirmed_guests} guests
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-ink/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-wine to-gold transition-all duration-700"
                      style={{ width: `${Math.max(4, (invitation.rsvps_count / maxRsvps) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-2xl bg-wine-deep p-6 text-cream xl:col-span-4">
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full border border-gold/20" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full border border-gold/10" />
          <Sparkles className="h-5 w-5 text-gold" />
          <h2 className="mt-4 font-display text-3xl leading-tight">A new story is one click away.</h2>
          <p className="mt-2 text-xs leading-relaxed text-cream/50">
            Start from a template, add your theme and compose the sections that feel like you.
          </p>
          <Link to="/admin/invitations/new" className="btn-gold mt-6 w-full">
            <Plus className="h-3.5 w-3.5" /> Create an invitation
          </Link>
          <div className="mt-5 flex items-center gap-3 border-t border-white/10 pt-4 text-[0.6rem] uppercase tracking-[0.14em] text-cream/35">
            <HeartHandshake className="h-4 w-4 text-gold/60" />
            Six themes · Six animations · Endless combinations
          </div>
        </section>
      </div>
    </div>
  )
}
