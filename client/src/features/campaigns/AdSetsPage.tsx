import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Zap, ChevronUp, ChevronDown, Search, ChevronRight } from 'lucide-react';
import api from '../../shared/lib/api';
import RuleModal from './components/RuleModal';

const STATUS_BADGE: Record<string, string> = {
  ACTIVE:   'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  PAUSED:   'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  ARCHIVED: 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30',
};

function fmt(v: number | null | undefined, type: 'money' | 'percent' | 'number' = 'money') {
  if (v === null || v === undefined) return '—';
  if (type === 'money') return `$${v.toFixed(2)}`;
  if (type === 'percent') return `${v.toFixed(2)}%`;
  return v.toLocaleString();
}

export default function AdSetsPage() {
  const navigate = useNavigate();
  const { campaignId } = useParams<{ campaignId: string }>();
  const location = useLocation();
  const campaignName = location.state?.campaignName ?? 'Campaign';
  const [search, setSearch] = useState('');
  const [ruleTarget, setRuleTarget] = useState<{ type: 'adsquad'; id: string; name: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['adsets-with-stats', campaignId],
    queryFn: async () => {
      const res = await api.get(`/campaigns/${campaignId}/adsquads`);
      return res.data?.data ?? [];
    },
    enabled: !!campaignId,
  });

  const adsets = (data ?? []).filter((s: any) =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase())
  );

  const COLS = [
    { key: 'name',        label: 'Ad Set',     w: 'min-w-[200px]' },
    { key: 'status',      label: 'Status',      w: 'w-28' },
    { key: 'dailyBudget', label: 'Budget',      w: 'w-24' },
    { key: 'bidStrategy', label: 'Bid Type',    w: 'w-28' },
    { key: 'bidAmount',   label: 'Bid',         w: 'w-20' },
    { key: 'spend',       label: 'Spend',       w: 'w-24' },
    { key: 'cpm',         label: 'CPM',         w: 'w-20' },
    { key: 'ctr',         label: 'CTR',         w: 'w-20' },
    { key: 'cpc',         label: 'CPC',         w: 'w-20' },
    { key: 'conversions', label: 'Purchases',   w: 'w-24' },
    { key: 'cpa',         label: 'CPA',         w: 'w-20' },
    { key: 'rules',       label: 'Rules',       w: 'w-24' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-snap-ink">Ad Sets</h1>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 mt-1 text-sm text-snap-muted">
            <button onClick={() => navigate('/dashboard/campaigns')}
              className="hover:text-snap-ink transition-colors">
              Campaigns
            </button>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-snap-ink font-medium truncate max-w-[200px]">{campaignName}</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-xl border border-snap-border bg-snap-card px-4 py-2.5">
        <Search className="h-4 w-4 text-snap-muted shrink-0" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search ad sets..."
          className="w-full bg-transparent text-sm text-snap-ink placeholder:text-snap-muted focus:outline-none" />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-snap-border bg-snap-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-snap-border bg-snap-soft">
                {COLS.map(col => (
                  <th key={col.key}
                    className={`${col.w} px-3 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-snap-muted`}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-snap-border">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}><td colSpan={12} className="px-4 py-3"><div className="h-5 rounded bg-snap-soft animate-pulse" /></td></tr>
                ))
              ) : adsets.length === 0 ? (
                <tr><td colSpan={12} className="px-4 py-8 text-center text-sm text-snap-muted">No ad sets found.</td></tr>
              ) : adsets.map((s: any) => (
                <tr key={s.id} className="hover:bg-snap-soft/50 transition-colors">
                  <td className="px-3 py-3 min-w-[200px]">
                    <button onClick={() => navigate(`/dashboard/ads/${s.id}`, { state: { campaignName, adSetName: s.name, campaignId } })}
                      className="text-left font-semibold text-snap-ink hover:text-yellow-600 transition-colors truncate max-w-[220px] block">
                      {s.name}
                    </button>
                  </td>
                  <td className="px-3 py-3 w-28">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_BADGE[s.status] ?? STATUS_BADGE.ARCHIVED}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 w-24 font-semibold text-snap-ink">{fmt(s.dailyBudget)}</td>
                  <td className="px-3 py-3 w-28 text-snap-muted">{s.bidStrategy?.replace(/_/g, ' ') ?? '—'}</td>
                  <td className="px-3 py-3 w-20 text-snap-muted">{fmt(s.bidAmount)}</td>
                  <td className="px-3 py-3 w-24 font-semibold text-snap-ink">{fmt(s.spend)}</td>
                  <td className="px-3 py-3 w-20 text-snap-muted">{fmt(s.cpm)}</td>
                  <td className="px-3 py-3 w-20 text-snap-muted">{fmt(s.ctr, 'percent')}</td>
                  <td className="px-3 py-3 w-20 text-snap-muted">{fmt(s.cpc)}</td>
                  <td className="px-3 py-3 w-24 text-snap-muted">{fmt(s.conversions, 'number')}</td>
                  <td className="px-3 py-3 w-20 text-snap-muted">{fmt(s.cpa)}</td>
                  <td className="px-3 py-3 w-24">
                    <button onClick={() => setRuleTarget({ type: 'adsquad', id: s.id, name: s.name })}
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