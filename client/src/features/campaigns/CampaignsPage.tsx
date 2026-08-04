import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Zap, ChevronUp, ChevronDown, Search } from 'lucide-react';
import api from '../../shared/lib/api';
import RuleModal from './components/RuleModal';

const STATUS_BADGE: Record<string, string> = {
  ACTIVE:   'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  PAUSED:   'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  ARCHIVED: 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30',
  DRAFT:    'bg-blue-500/20 text-blue-400 border border-blue-500/30',
};

function fmt(v: number | null | undefined, type: 'money' | 'percent' | 'number' = 'money') {
  if (v === null || v === undefined) return '—';
  if (type === 'money') return `$${v.toFixed(2)}`;
  if (type === 'percent') return `${v.toFixed(2)}%`;
  return v.toLocaleString();
}

function SortIcon({ col, sort }: { col: string; sort: { col: string; dir: 'asc' | 'desc' } }) {
  if (sort.col !== col) return <span className="text-zinc-600 ml-1">↕</span>;
  return sort.dir === 'asc'
    ? <ChevronUp className="inline h-3 w-3 ml-1 text-snap-yellow" />
    : <ChevronDown className="inline h-3 w-3 ml-1 text-snap-yellow" />;
}

export default function CampaignsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [sort, setSort] = useState<{ col: string; dir: 'asc' | 'desc' }>({ col: 'name', dir: 'asc' });
  const [ruleTarget, setRuleTarget] = useState<{ type: 'campaign'; id: string; name: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns-with-stats', search, status],
    queryFn: async () => {
      const res = await api.get('/campaigns', { params: { q: search || undefined, status: status !== 'ALL' ? status : undefined, pageSize: 100 } });
      return res.data?.data ?? [];
    },
  });

  const campaigns = (data ?? [])
    .filter((c: any) => status === 'ALL' || c.status === status)
    .sort((a: any, b: any) => {
      const va = a[sort.col] ?? 0;
      const vb = b[sort.col] ?? 0;
      return sort.dir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });

  const toggleSort = (col: string) => {
    setSort(prev => prev.col === col ? { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'desc' });
  };

  const COLS = [
    { key: 'name',        label: 'Campaign',   w: 'min-w-[200px]' },
    { key: 'status',      label: 'Status',      w: 'w-28' },
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
          <h1 className="text-2xl font-bold text-snap-ink">Campaigns</h1>
          <p className="text-sm text-snap-muted mt-0.5">{campaigns.length} total campaigns</p>
        </div>
        <button onClick={() => navigate('/dashboard/campaigns/launch')}
          className="flex items-center gap-2 rounded-xl bg-snap-yellow px-4 py-2.5 text-sm font-bold text-snap-ink hover:brightness-105 transition-all">
          <Zap className="h-4 w-4" /> Launch Campaign
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex items-center gap-2 flex-1 rounded-xl border border-snap-border bg-snap-card px-4 py-2.5">
          <Search className="h-4 w-4 text-snap-muted shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search campaigns..."
            className="w-full bg-transparent text-sm text-snap-ink placeholder:text-snap-muted focus:outline-none" />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="rounded-xl border border-snap-border bg-snap-card px-4 py-2.5 text-sm text-snap-ink focus:outline-none">
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-snap-border bg-snap-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-snap-border bg-snap-soft">
                {COLS.map(col => (
                  <th key={col.key}
                    onClick={() => col.key !== 'rules' && toggleSort(col.key)}
                    className={`${col.w} px-3 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-snap-muted ${col.key !== 'rules' ? 'cursor-pointer hover:text-snap-ink' : ''} transition-colors`}>
                    {col.label}
                    {col.key !== 'rules' && <SortIcon col={col.key} sort={sort} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-snap-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={9} className="px-4 py-3">
                      <div className="h-5 rounded bg-snap-soft animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-snap-muted">
                    No campaigns found.
                  </td>
                </tr>
              ) : campaigns.map((c: any) => (
                <tr key={c.id} className="hover:bg-snap-soft/50 transition-colors group">
                  {/* Campaign name — cliquable */}
                  <td className="px-3 py-3 min-w-[200px]">
                    <button onClick={() => navigate(`/dashboard/adsets/${c.id}`, { state: { campaignName: c.name } })}
                      className="text-left font-semibold text-snap-ink hover:text-yellow-600 transition-colors truncate max-w-[220px] block">
                      {c.name}
                    </button>
                    <p className="text-[10px] text-snap-muted mt-0.5">{c.objective ?? '—'}</p>
                  </td>
                  {/* Status */}
                  <td className="px-3 py-3 w-28">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_BADGE[c.status] ?? STATUS_BADGE.ARCHIVED}`}>
                      {c.status}
                    </span>
                  </td>
                  {/* Stats */}
                  <td className="px-3 py-3 w-24 font-semibold text-snap-ink">{fmt(c.spend)}</td>
                  <td className="px-3 py-3 w-20 text-snap-muted">{fmt(c.cpm)}</td>
                  <td className="px-3 py-3 w-20 text-snap-muted">{fmt(c.ctr, 'percent')}</td>
                  <td className="px-3 py-3 w-20 text-snap-muted">{fmt(c.cpc)}</td>
                  <td className="px-3 py-3 w-24 text-snap-muted">{fmt(c.conversions, 'number')}</td>
                  <td className="px-3 py-3 w-20 text-snap-muted">{fmt(c.cpa)}</td>
                  {/* Rules */}
                  <td className="px-3 py-3 w-24">
                    <button onClick={() => setRuleTarget({ type: 'campaign', id: c.id, name: c.name })}
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