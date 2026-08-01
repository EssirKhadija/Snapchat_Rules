import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, Trash2 } from 'lucide-react';
import { useTranslation } from '../../shared/lib/i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSnapchatAccount,
  fetchSnapchatPendingAccounts,
  getSnapchatAuthorizeUrl,
  selectSnapchatAccount,
  disconnectSnapchatAccount,
} from './dashboard.service';

const AdAccountsPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [selectedPendingAccountId, setSelectedPendingAccountId] = useState<string | null>(null);
  const [disconnectCandidate, setDisconnectCandidate] = useState<{ id?: string; name: string } | null>(null);

  // Fetch connected account
  const { data: account, isLoading } = useQuery({
    queryKey: ['snapchat', 'me'],
    queryFn: fetchSnapchatAccount,
    retry: false,
  });

  const { data: pendingAccounts, isLoading: isPendingLoading } = useQuery({
    queryKey: ['snapchat', 'pending'],
    queryFn: fetchSnapchatPendingAccounts,
    retry: false,
    enabled: !account && !isLoading,
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectSnapchatAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snapchat', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['snapchat', 'pending'] });
    }
  });

  useEffect(() => {
    if (disconnectMutation.isSuccess) {
      setDisconnectCandidate(null);
    }
  }, [disconnectMutation.isSuccess]);

  const selectMutation = useMutation({
    mutationFn: selectSnapchatAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snapchat', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['snapchat', 'pending'] });
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
  const hasPendingSelection = (pendingAccounts ?? []).length > 0;
  const selectedPendingAccount = pendingAccounts?.find(acc => acc.id === selectedPendingAccountId) ?? null;

  // Set default selection when pending accounts arrive
  React.useEffect(() => {
    if (!selectedPendingAccountId && pendingAccounts?.length) {
      setSelectedPendingAccountId(pendingAccounts[0].id);
    }
  }, [pendingAccounts, selectedPendingAccountId]);

  // Filter by search
  const filteredAccounts = accountsList.filter(a => 
    a.displayName?.toLowerCase().includes(search.toLowerCase()) || 
    a.externalAccountId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {hasPendingSelection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-snap-ink/60 backdrop-blur-sm" aria-hidden="true" />
          <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-3xl border border-snap-border bg-snap-card shadow-2xl">
            <div className="border-b border-snap-border px-6 py-5">
              <h2 className="text-xl font-semibold text-snap-ink">Choose Snapchat Ad Account</h2>
              <p className="mt-1 text-sm text-snap-muted">Select the Snapchat ad account you want to connect.</p>
            </div>
            <div className="space-y-3 px-6 py-5">
              {pendingAccounts?.map((acc) => {
                const isSelected = acc.id === selectedPendingAccountId;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setSelectedPendingAccountId(acc.id)}
                    className={`w-full rounded-3xl border p-4 text-left transition-all ${isSelected ? 'border-snap-yellow bg-snap-yellow/10' : 'border-snap-border bg-white/80 hover:border-snap-ink'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-snap-yellow text-snap-ink text-xl shadow-sm">👻</div>
                      <div className="flex-1">
                        <p className="font-semibold text-snap-ink">{acc.name}</p>
                        <p className="text-sm text-snap-muted">{acc.organizationId} · {acc.currency}</p>
                      </div>
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full border ${isSelected ? 'border-snap-yellow bg-snap-yellow text-snap-ink' : 'border-snap-border text-snap-muted'}`}>
                        {isSelected ? '✓' : ''}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col gap-3 border-t border-snap-border bg-snap-soft px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setSelectedPendingAccountId(null)}
                className="rounded-xl border border-snap-border bg-white px-4 py-2 text-sm font-semibold text-snap-ink hover:bg-snap-muted/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!selectedPendingAccount) return;
                  selectMutation.mutate({
                    adAccountId: selectedPendingAccount.id,
                    organizationId: selectedPendingAccount.organizationId,
                    displayName: selectedPendingAccount.name,
                  });
                }}
                disabled={!selectedPendingAccount || selectMutation.isPending}
                className="rounded-xl bg-snap-ink px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {selectMutation.isPending ? 'Connecting...' : 'Select account'}
              </button>
            </div>
          </div>
        </div>
      )}
      {disconnectCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-snap-ink/60 backdrop-blur-sm" aria-hidden="true" />
          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-snap-border bg-snap-card shadow-2xl">
            <div className="border-b border-snap-border px-6 py-5">
              <h2 className="text-xl font-semibold text-snap-ink">Disconnect Snapchat Account</h2>
              <p className="mt-1 text-sm text-snap-muted">
                Are you sure you want to disconnect <span className="font-semibold text-snap-ink">{disconnectCandidate.name}</span>?
              </p>
            </div>
            <div className="space-y-4 px-6 py-6">
              <p className="text-sm leading-6 text-snap-muted">
                Disconnecting will remove access to this ad account. You can reconnect later if needed.
              </p>
            </div>
            <div className="flex flex-col gap-3 border-t border-snap-border bg-snap-soft px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDisconnectCandidate(null)}
                className="rounded-xl border border-snap-border bg-white px-4 py-2 text-sm font-semibold text-snap-ink hover:bg-snap-muted/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </div>
          </div>
        </div>
      )}
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
          disabled={connecting || accountsList.length >= 1 || hasPendingSelection}
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
              {isLoading || isPendingLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-snap-muted">
                    Loading accounts...
                  </td>
                </tr>
              ) : hasPendingSelection ? (
                (pendingAccounts ?? []).map((acc) => (
                  <tr key={acc.id} className="hover:bg-snap-soft/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 rounded-lg bg-snap-yellow px-2 py-1 text-xs font-bold text-snap-ink shadow-sm">
                          <span>👻</span> Snap
                        </div>
                        <div>
                          <p className="font-bold text-snap-ink">{acc.name}</p>
                          <p className="text-xs text-snap-muted mt-0.5">{acc.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-snap-ink">{acc.currency}</td>
                    <td className="px-6 py-4 font-semibold text-snap-ink">{acc.timezone}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => selectMutation.mutate({
                          adAccountId: acc.id,
                          organizationId: acc.organizationId,
                          displayName: acc.name,
                        })}
                        disabled={selectMutation.isPending}
                        className="inline-flex items-center rounded-xl bg-snap-yellow px-4 py-2 text-sm font-bold text-snap-ink hover:brightness-105 transition-all"
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))
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
                      onClick={() => setDisconnectCandidate({ id: acc.externalAccountId, name: acc.displayName || acc.externalAccountId })}
                      disabled={disconnectMutation.isPending}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-snap-border text-red-500 hover:bg-red-50 hover:border-red-200 disabled:opacity-50 transition-colors"
                      title="Disconnect Account"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && !isPendingLoading && !hasPendingSelection && filteredAccounts.length === 0 && (
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
