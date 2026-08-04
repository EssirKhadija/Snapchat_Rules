import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Zap, Search, ChevronRight } from 'lucide-react';
import api from '../../shared/lib/api';
import RuleModal from './components/RuleModal';

const STATUS_BADGE: Record<string, string> = {
  ACTIVE:   'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  PAUSED:   'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  ARCHIVED: 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30',
};

const REVIEW_BADGE: Record<string, string> = {
  APPROVED: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  PENDING:  'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  REJECTED: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

function fmt(v: number | null | undefined, type: 'money' | 'percent' | 'number' = 'money') {
  if (v === null || v === undefined) return '—';
  if (type === 'money') return `$${v.toFixed(2)}`;
  if (type === 'percent') return `${v.toFixed(2)}%`;
  return v.toLocaleString();
}

export default function AdsPage() {
  const navigate = useNavigate();
  const { adSquadId } = useParams<{ adSquadId: string }>();
  const location = useLocation();
  const { campaignName, adSetName, campaignId } = location.state ?? {};
  const [search, setSearch] = useState('');
  const [ruleTarget, setRuleTarget] = useState<{ type: 'ad'; id: string; name: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['ads', adSquadId],
    queryFn: async () => {
      const res = await api.get(`/campaigns/adsquads/${adSquadId}/ads`);
      return res.data?.data ?? [];
    },
    enabled: !!adSquadId,
  });

  const ads = (data ?? []).filter((a: any) =>
    !search || a.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-snap-ink">Ads</h1>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 mt-1 text-sm text-snap-muted flex-wrap">
            <button onClick={() => navigate('/dashboard/campaigns')} className="hover:text-snap-ink transition-colors">Campaigns</button>
            <ChevronRight className="h-3.5 w-3.5" />
            <button onClick={() => navigate(`/dashboard/adsets/${campaignId}`, { state: { campaignName } })} className="hover:text-snap-ink transition-colors truncate max-w-[120px]">{campaignName}</button>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-snap-ink font-medium truncate max-w-[150px]">{adSetName}</span>
          </div>
        </div>
        <button onClick={() => navigate('/dashboard/campaigns/launch')}
          className="flex items-center gap-2 rounded-xl bg-snap-yellow px-4 py-2.5 text-sm font-bold text-snap-ink hover:brightness-105 transition-all">
          <Zap className="h-4 w-4" /> Launch Ads in Bulk
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-xl border border-snap-border bg-snap-card px-4 py-2.5">
        <Search className="h-4 w-4 text-snap-muted shrink-0" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search ads..."
          className="w-full bg-transparent text-sm text-snap-ink placeholder:text-snap-muted focus:outline-none" />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-snap-border bg-snap-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-snap-border bg-snap-soft">
                <th className="min-w-[180px] px-3 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-snap-muted">Ad</th>
                <th className="w-28 px-3 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-snap-muted">Review</th>
                <th className="w-28 px-3 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-snap-muted">Status</th>
                <th className="w-24 px-3 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-snap-muted">Spend</th>
                <th className="w-20 px-3 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-snap-muted">CPM</th>
                <th className="w-20 px-3 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-snap-muted">CTR</th>
                <th className="w-20 px-3 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-snap-muted">CPC</th>
                <th className="w-24 px-3 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-snap-muted">Purchases</th>
                <th className="w-20 px-3 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-snap-muted">CPA</th>
                <th className="w-24 px-3 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-snap-muted">Rules</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-snap-border">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}><td colSpan={10} className="px-4 py-3"><div className="h-5 rounded bg-snap-soft animate-pulse" /></td></tr>
                ))
              ) : ads.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-sm text-snap-muted">No ads found.</td></tr>
              ) : ads.map((a: any) => (
                <tr key={a.id} className="hover:bg-snap-soft/50 transition-colors">
                  <td className="px-3 py-3 min-w-[180px]">
                    <p className="font-semibold text-snap-ink truncate max-w-[200px]">{a.name}</p>
                    <p className="text-[10px] text-snap-muted mt-0.5">{a.type ?? '—'}</p>
                  </td>
                  <td className="px-3 py-3 w-28">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${REVIEW_BADGE[a.reviewStatus] ?? 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30'}`}>
                      {a.reviewStatus ?? 'PENDING'}
                    </span>
                  </td>
                  <td className="px-3 py-3 w-28">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_BADGE[a.status] ?? STATUS_BADGE.ARCHIVED}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 w-24 font-semibold text-snap-ink">{fmt(a.spend)}</td>
                  <td className="px-3 py-3 w-20 text-snap-muted">{fmt(a.cpm)}</td>
                  <td className="px-3 py-3 w-20 text-snap-muted">{fmt(a.ctr, 'percent')}</td>
                  <td className="px-3 py-3 w-20 text-snap-muted">{fmt(a.cpc)}</td>
                  <td className="px-3 py-3 w-24 text-snap-muted">{fmt(a.conversions, 'number')}</td>
                  <td className="px-3 py-3 w-20 text-snap-muted">{fmt(a.cpa)}</td>
                  <td className="px-3 py-3 w-24">
                    <button onClick={() => setRuleTarget({ type: 'ad', id: a.id, name: a.name })}
                      className="flex items-center gap-1 rounded-xl bg-snap-yellow px-3 py-1.5 text-[11px] font-bold text-snap-ink hover:brightness-105 transition-all">
                      <Zap className="h-3 w-3" /> Rule
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {ruleTarget && <RuleModal target={ruleTarget} onClose={() => setRuleTarget(null)} />}
    </div>
  );
}