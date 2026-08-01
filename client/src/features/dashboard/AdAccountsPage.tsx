import { useState } from 'react';
import { Search, ChevronDown, Trash2, Zap } from 'lucide-react';
import { useTranslation } from '../../shared/lib/i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSnapchatAccount, getSnapchatAuthorizeUrl, disconnectSnapchatAccount } from './dashboard.service';

const AdAccountsPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [connecting, setConnecting] = useState(false);

  // Fetch connected account
  const { data: account, isLoading } = useQuery({
    queryKey: ['snapchat', 'me'],
    queryFn: fetchSnapchatAccount,
    retry: false,
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectSnapchatAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snapchat', 'me'] });
    }
  });

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const url = await getSnapchatAuthorizeUrl();
      window.location.assign(url);
    } catch {
      alert('Failed to get authorization URL');
      setConnecting(false);
    }
  };

  const accountsList = account?.externalAccountId ? [account] : [];
  
  // Filter by search
  const filteredAccounts = accountsList.filter(a => 
    a.displayName?.toLowerCase().includes(search.toLowerCase()) || 
    a.externalAccountId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-snap-ink">Ad Accounts</h1>
          <p className="mt-1 text-sm text-snap-muted font-medium">
            {accountsList.length} / 1 accounts <span className="text-emerald-500 ml-1">(Free plan)</span>
          </p>
        </div>
        <button 
          onClick={handleConnect}
          disabled={connecting || accountsList.length >= 1}
          className="flex items-center gap-2 rounded-xl bg-snap-yellow px-5 py-2.5 text-sm font-bold text-snap-ink hover:brightness-105 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:hover:-translate-y-0 disabled:hover:shadow-none transition-all"
        >
          {connecting ? (
            <><div className="h-4 w-4 rounded-full border-2 border-snap-ink/30 border-t-snap-ink animate-spin" /> Connecting...</>
          ) : accountsList.length >= 1 ? (
            <>Account Connected</>
          ) : (
            <><span className="text-lg leading-none">+</span> Connect Account <ChevronDown className="h-4 w-4 ml-1" /></>
          )}
        </button>
      </header>

      {/* Search Bar */}
      <div className="rounded-xl border border-snap-border bg-snap-card">
        <div className="flex items-center gap-3 px-4 py-3">
          <Search className="h-4 w-4 text-snap-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search accounts..."
            className="w-full bg-transparent text-sm text-snap-ink placeholder:text-snap-muted focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-snap-border bg-snap-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-snap-border">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-snap-muted">Account</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-snap-muted">Currency</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-snap-muted">Timezone</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-snap-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-snap-border">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-snap-muted">
                    Loading accounts...
                  </td>
                </tr>
              ) : filteredAccounts.map((acc) => (
                <tr key={acc.externalAccountId} className="hover:bg-snap-soft/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 rounded-lg bg-snap-yellow px-2 py-1 text-xs font-bold text-snap-ink shadow-sm">
                        <span>👻</span> Snap
                      </div>
                      <div>
                        <p className="font-bold text-snap-ink">{acc.displayName || 'Snapchat Account'}</p>
                        <p className="text-xs text-snap-muted mt-0.5">{acc.externalAccountId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-snap-ink">USD</td>
                  <td className="px-6 py-4 font-semibold text-snap-ink">Account Default</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => {
                        if (window.confirm('Are you sure you want to disconnect this Snapchat account?')) {
                          disconnectMutation.mutate();
                        }
                      }}
                      disabled={disconnectMutation.isPending}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-snap-border text-red-500 hover:bg-red-50 hover:border-red-200 disabled:opacity-50 transition-colors"
                      title="Disconnect Account"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && filteredAccounts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-snap-muted">
                    No accounts found. {search && 'Try adjusting your search.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdAccountsPage;
