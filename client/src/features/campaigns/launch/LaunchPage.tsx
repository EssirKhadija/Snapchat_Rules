import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Zap, Edit2, Copy, Check, X, Upload, ChevronDown, Image } from 'lucide-react';
import { CampaignTemplate, BulkRow } from './launch.types';
import { getTemplates, deleteTemplate, launchSingleCampaign } from './launch.service';
import TemplateModal from './TemplateModal';

const COUNTRIES = [
  { code: 'SA', name: '🇸🇦 Saudi Arabia' },
  { code: 'AE', name: '🇦🇪 UAE' },
  { code: 'KW', name: '🇰🇼 Kuwait' },
  { code: 'QA', name: '🇶🇦 Qatar' },
  { code: 'BH', name: '🇧🇭 Bahrain' },
  { code: 'OM', name: '🇴🇲 Oman' },
  { code: 'EG', name: '🇪🇬 Egypt' },
  { code: 'JO', name: '🇯🇴 Jordan' },
  { code: 'US', name: '🇺🇸 United States' },
  { code: 'GB', name: '🇬🇧 United Kingdom' },
  { code: 'FR', name: '🇫🇷 France' },
  { code: 'DE', name: '🇩🇪 Germany' },
  { code: 'MA', name: '🇲🇦 Morocco' },
  { code: 'TR', name: '🇹🇷 Turkey' },
  { code: 'PK', name: '🇵🇰 Pakistan' },
];

const newRow = (): BulkRow => ({
  id: `row-${Date.now()}-${Math.random()}`,
  campaignName: '',
  adSquadName: '',
  adName: '',
  budget: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  headline: '',
  creativeUrl: '',
  creativeFile: null,
  creativePreview: '',
  status: 'idle',
});

// ── Creative Cell ──────────────────────────────────────────────
function CreativeCell({ row, onChange, disabled }: {
  row: BulkRow;
  onChange: (file: File | null, url: string, preview: string) => void;
  disabled?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'url' | 'file'>(row.creativeFile ? 'file' : 'url');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    onChange(file, '', preview);
    e.target.value = '';
  };

  return (
    <div className="space-y-2">
      {/* Toggle */}
      <div className="flex gap-1.5">
        <button type="button" onClick={() => setMode('url')}
          className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${mode === 'url' ? 'bg-snap-yellow text-snap-ink' : 'bg-snap-soft text-snap-muted hover:text-snap-ink border border-snap-border'}`}>
          🔗 URL
        </button>
        <button type="button" onClick={() => setMode('file')}
          className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${mode === 'file' ? 'bg-snap-yellow text-snap-ink' : 'bg-snap-soft text-snap-muted hover:text-snap-ink border border-snap-border'}`}>
          📎 Upload
        </button>
      </div>

      {mode === 'url' ? (
        <input type="url" value={row.creativeUrl}
          onChange={e => onChange(null, e.target.value, '')}
          placeholder="https://cdn.../video.mp4"
          disabled={disabled}
          className="w-full rounded-xl border border-snap-border bg-snap-bg px-3 py-2 text-xs text-snap-ink placeholder:text-snap-muted focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-200 disabled:opacity-50 transition-all" />
      ) : (
        <div>
          <input ref={fileRef} type="file" accept="video/*,image/*" className="hidden" onChange={handleFile} />
          {(row.creativeFile || row.creativePreview) ? (
            <div className="relative rounded-xl overflow-hidden border border-snap-border bg-snap-bg">
              {row.creativePreview && (
                row.creativeFile?.type?.startsWith('video') || row.creativeUrl?.match(/\.(mp4|mov|webm)$/i) ? (
                  <video src={row.creativePreview} className="h-20 w-full object-cover" />
                ) : (
                  <img src={row.creativePreview} alt="preview" className="h-20 w-full object-cover" />
                )
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-snap-ink/40 opacity-0 hover:opacity-100 transition-all">
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="rounded-lg bg-snap-card px-2 py-1 text-[10px] font-semibold text-snap-ink">
                  Change
                </button>
              </div>
              <div className="px-2 py-1 text-[10px] text-snap-muted truncate">
                {row.creativeFile?.name ?? 'File selected'}
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()} disabled={disabled}
              className="flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-snap-border bg-snap-bg py-4 text-snap-muted hover:border-snap-muted hover:text-snap-ink disabled:opacity-50 transition-all">
              <Upload className="h-5 w-5" />
              <span className="text-[11px] font-medium">Upload video / image</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Campaign Card ──────────────────────────────────────────────
function CampaignCard({ row, index, onChange, onDuplicate, onRemove, canRemove }: {
  row: BulkRow;
  index: number;
  onChange: (key: keyof BulkRow, value: any) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const isLaunching = row.status === 'launching';
  const isSuccess = row.status === 'success';
  const isError = row.status === 'error';
  const disabled = isLaunching || isSuccess;

  return (
    <div className={`rounded-2xl border-2 transition-all duration-200 ${
      isSuccess ? 'border-emerald-300 bg-emerald-50/40' :
      isError ? 'border-red-300 bg-red-50/40' :
      isLaunching ? 'border-snap-yellow/50 bg-snap-yellow/5' :
      'border-snap-border bg-snap-card hover:border-snap-muted'
    }`}>
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-snap-border/60">
        <div className="flex items-center gap-3">
          <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
            isSuccess ? 'bg-emerald-500 text-white' :
            isError ? 'bg-red-500 text-white' :
            isLaunching ? 'bg-snap-yellow text-snap-ink' :
            'bg-snap-soft text-snap-muted'
          }`}>
            {isSuccess ? <Check className="h-4 w-4" /> :
             isError ? <X className="h-4 w-4" /> :
             isLaunching ? <div className="h-3.5 w-3.5 rounded-full border-2 border-snap-ink/30 border-t-snap-ink animate-spin" /> :
             index + 1}
          </span>
          <div>
            <p className="text-sm font-semibold text-snap-ink">
              {row.campaignName || `Campaign ${index + 1}`}
            </p>
            {isError && <p className="text-[10px] text-red-500">{row.error}</p>}
            {isSuccess && <p className="text-[10px] text-emerald-600 font-medium">Launched successfully ✓</p>}
            {isLaunching && <p className="text-[10px] text-yellow-600 font-medium">Launching...</p>}
          </div>
        </div>
        {!disabled && (
          <div className="flex items-center gap-1.5">
            <button onClick={onDuplicate} title="Duplicate"
              className="flex h-7 w-7 items-center justify-center rounded-xl border border-snap-border text-snap-muted hover:text-snap-ink hover:border-snap-muted transition-all">
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button onClick={onRemove} disabled={!canRemove} title="Remove"
              className="flex h-7 w-7 items-center justify-center rounded-xl border border-snap-border text-snap-muted hover:text-red-500 hover:border-red-200 disabled:opacity-30 transition-all">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

        {/* Campaign name */}
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-snap-muted mb-1.5">
            Campaign name *
          </label>
          <input value={row.campaignName} onChange={e => onChange('campaignName', e.target.value)}
            placeholder="Hairband KSA — Aug 2026"
            disabled={disabled}
            className="w-full rounded-xl border border-snap-border bg-snap-bg px-3 py-2.5 text-sm text-snap-ink placeholder:text-snap-muted focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-200 disabled:opacity-50 transition-all" />
        </div>

        {/* Ad Squad name */}
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-snap-muted mb-1.5">
            Ad Squad name
          </label>
          <input value={row.adSquadName} onChange={e => onChange('adSquadName', e.target.value)}
            placeholder="Auto (same as campaign)"
            disabled={disabled}
            className="w-full rounded-xl border border-snap-border bg-snap-bg px-3 py-2.5 text-sm text-snap-ink placeholder:text-snap-muted focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-200 disabled:opacity-50 transition-all" />
        </div>

        {/* Ad name */}
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-snap-muted mb-1.5">
            Ad name
          </label>
          <input value={row.adName} onChange={e => onChange('adName', e.target.value)}
            placeholder="Auto (same as campaign)"
            disabled={disabled}
            className="w-full rounded-xl border border-snap-border bg-snap-bg px-3 py-2.5 text-sm text-snap-ink placeholder:text-snap-muted focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-200 disabled:opacity-50 transition-all" />
        </div>

        {/* Budget */}
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-snap-muted mb-1.5">
            Daily budget * <span className="normal-case font-normal text-snap-muted">(min $20)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-snap-muted">$</span>
            <input type="number" min={20} value={row.budget}
              onChange={e => onChange('budget', e.target.value)}
              placeholder="20"
              disabled={disabled}
              className="w-full rounded-xl border border-snap-border bg-snap-bg pl-7 pr-3 py-2.5 text-sm text-snap-ink placeholder:text-snap-muted focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-200 disabled:opacity-50 transition-all" />
          </div>
        </div>

        {/* Start date */}
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-snap-muted mb-1.5">
            Start date *
          </label>
          <input type="date" value={row.startDate}
            onChange={e => onChange('startDate', e.target.value)}
            disabled={disabled}
            className="w-full rounded-xl border border-snap-border bg-snap-bg px-3 py-2.5 text-sm text-snap-ink focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-200 disabled:opacity-50 transition-all" />
        </div>

        {/* End date */}
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-snap-muted mb-1.5">
            End date <span className="normal-case font-normal">(optional)</span>
          </label>
          <input type="date" value={row.endDate} min={row.startDate}
            onChange={e => onChange('endDate', e.target.value)}
            disabled={disabled}
            className="w-full rounded-xl border border-snap-border bg-snap-bg px-3 py-2.5 text-sm text-snap-ink focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-200 disabled:opacity-50 transition-all" />
        </div>

        {/* Headline */}
        <div className="sm:col-span-2">
          <label className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-snap-muted mb-1.5">
            Headline * <span className="normal-case font-normal">({row.headline.length}/34)</span>
          </label>
          <input value={row.headline} maxLength={34}
            onChange={e => onChange('headline', e.target.value)}
            placeholder="Shop our summer collection"
            disabled={disabled}
            className="w-full rounded-xl border border-snap-border bg-snap-bg px-3 py-2.5 text-sm text-snap-ink placeholder:text-snap-muted focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-200 disabled:opacity-50 transition-all" />
        </div>

        {/* Creative */}
        <div className="row-span-2">
          <label className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-snap-muted mb-1.5">
            Creative *
          </label>
          <CreativeCell row={row} disabled={disabled}
            onChange={(file, url, preview) => {
              onChange('creativeFile', file);
              onChange('creativeUrl', url);
              onChange('creativePreview', preview);
            }} />
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function LaunchPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<CampaignTemplate[]>(getTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(templates[0] ?? null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CampaignTemplate | null>(null);
  const [rows, setRows] = useState<BulkRow[]>([newRow()]);
  const [launching, setLaunching] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const refreshTemplates = () => {
    const t = getTemplates();
    setTemplates(t);
    if (!selectedTemplate && t.length > 0) setSelectedTemplate(t[0]);
  };

  const updateRow = (id: string, key: keyof BulkRow, value: any) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, [key]: value } : r));

  const addRow = () => setRows(prev => [...prev, newRow()]);

  const duplicateRow = (id: string) => {
    const row = rows.find(r => r.id === id);
    if (!row) return;
    const dup: BulkRow = { ...row, id: `row-${Date.now()}`, status: 'idle', error: undefined };
    setRows(prev => {
      const idx = prev.findIndex(r => r.id === id);
      const next = [...prev];
      next.splice(idx + 1, 0, dup);
      return next;
    });
  };

  const removeRow = (id: string) => {
    if (rows.length === 1) return;
    setRows(prev => prev.filter(r => r.id !== id));
  };

  // CSV import
  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split('\n').slice(1);
      const imported: BulkRow[] = lines.map(line => {
        const [campaignName, adSquadName, adName, budget, startDate, endDate, headline, creativeUrl] =
          line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
        return {
          id: `row-${Date.now()}-${Math.random()}`,
          campaignName: campaignName ?? '',
          adSquadName: adSquadName ?? '',
          adName: adName ?? '',
          budget: budget ?? '',
          startDate: startDate ?? new Date().toISOString().split('T')[0],
          endDate: endDate ?? '',
          headline: headline ?? '',
          creativeUrl: creativeUrl ?? '',
          creativeFile: null,
          creativePreview: '',
          status: 'idle',
        };
      });
      setRows(imported);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const canLaunch = !!selectedTemplate && rows.some(r =>
    r.status === 'idle' &&
    r.campaignName.trim() &&
    r.budget &&
    r.startDate &&
    r.headline.trim() &&
    (r.creativeUrl.trim() || r.creativeFile)
  );

  const handleLaunch = async () => {
    if (!selectedTemplate || !canLaunch) return;
    setLaunching(true);
    setDone(false);

    await Promise.allSettled(
      rows
        .filter(r => r.status === 'idle')
        .map(async (row) => {
          updateRow(row.id, 'status', 'launching');
          try {
            await launchSingleCampaign(selectedTemplate, row);
            updateRow(row.id, 'status', 'success');
          } catch (err: any) {
            updateRow(row.id, 'status', 'error');
            updateRow(row.id, 'error', err.response?.data?.message ?? err.message ?? 'Error');
          }
        })
    );

    setLaunching(false);
    setDone(true);
  };

  const successCount = rows.filter(r => r.status === 'success').length;
  const errorCount = rows.filter(r => r.status === 'error').length;
  const launchingCount = rows.filter(r => r.status === 'launching').length;
  const idleCount = rows.filter(r => r.status === 'idle').length;

  return (
    <div className="space-y-5 pb-24">

      {/* Header */}
      <header className="rounded-2xl border border-snap-border bg-snap-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-snap-yellow">
                <Zap className="h-4 w-4 text-snap-ink" />
              </div>
              <h1 className="text-xl font-semibold text-snap-ink">Bulk Launch</h1>
            </div>
            <p className="mt-1 text-sm text-snap-muted pl-10">
              Select a template → fill campaign cards → launch all at once
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 rounded-xl border border-snap-border bg-snap-soft px-3 py-2 text-xs font-medium text-snap-muted hover:text-snap-ink transition-all">
              <Upload className="h-3.5 w-3.5" /> Import CSV
            </button>
            <button onClick={() => navigate('/dashboard/campaigns')}
              className="rounded-xl border border-snap-border bg-snap-soft px-4 py-2 text-sm text-snap-muted hover:text-snap-ink transition-all">
              ← Back
            </button>
          </div>
        </div>
      </header>

      {/* Done banner */}
      {done && (errorCount > 0 || successCount > 0) && (
        <div className={`rounded-2xl border p-4 flex items-center justify-between ${
          errorCount === 0 ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
        }`}>
          <div className="text-sm font-medium">
            {successCount > 0 && <span className="text-emerald-700">✅ {successCount} campaign{successCount > 1 ? 's' : ''} launched. </span>}
            {errorCount > 0 && <span className="text-red-600">❌ {errorCount} failed — check the cards below.</span>}
          </div>
          {errorCount === 0 && (
            <button onClick={() => navigate('/dashboard/campaigns')}
              className="rounded-xl bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 transition-all">
              View campaigns →
            </button>
          )}
        </div>
      )}

      {/* ── STEP 1 : Template ── */}
      <div className="rounded-2xl border border-snap-border bg-snap-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-snap-yellow text-[11px] font-bold text-snap-ink">1</span>
            <div>
              <h2 className="text-sm font-semibold text-snap-ink">Select a template</h2>
              <p className="text-xs text-snap-muted">Targeting, bidding & pixel — shared across all campaigns</p>
            </div>
          </div>
          <button onClick={() => { setEditingTemplate(null); setShowTemplateModal(true); }}
            className="flex items-center gap-1.5 rounded-xl bg-snap-yellow px-3 py-1.5 text-xs font-semibold text-snap-ink hover:brightness-105 transition-all">
            <Plus className="h-3.5 w-3.5" /> New template
          </button>
        </div>

        {templates.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-snap-border p-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-snap-soft mx-auto mb-3">
              <Zap className="h-6 w-6 text-snap-muted" />
            </div>
            <p className="text-sm font-medium text-snap-ink">No template yet</p>
            <p className="text-xs text-snap-muted mt-1 mb-4">Create your first template to define targeting & bidding</p>
            <button onClick={() => { setEditingTemplate(null); setShowTemplateModal(true); }}
              className="rounded-xl bg-snap-yellow px-5 py-2.5 text-sm font-semibold text-snap-ink hover:brightness-105 transition-all">
              Create template
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map(t => (
              <div key={t.id}
                onClick={() => setSelectedTemplate(t)}
                className={`group relative cursor-pointer rounded-2xl border-2 p-4 transition-all duration-150 hover:-translate-y-0.5 ${
                  selectedTemplate?.id === t.id
                    ? 'border-snap-yellow bg-snap-yellow/5 shadow-md'
                    : 'border-snap-border bg-snap-soft hover:border-snap-muted'
                }`}>
                {/* Selected check */}
                {selectedTemplate?.id === t.id && (
                  <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-snap-yellow">
                    <Check className="h-3 w-3 text-snap-ink" />
                  </div>
                )}

                <p className="text-sm font-semibold text-snap-ink pr-6">{t.name}</p>

                {/* Tags */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded-lg bg-snap-card border border-snap-border px-2 py-0.5 text-[10px] font-medium text-snap-ink">
                    🎯 {t.objectiveV2Type.replace('_AND_', ' & ').replace(/_/g, ' ')}
                  </span>
                  <span className="rounded-lg bg-snap-card border border-snap-border px-2 py-0.5 text-[10px] font-medium text-snap-ink">
                    🌍 {t.countries.slice(0, 2).join(', ')}{t.countries.length > 2 ? ` +${t.countries.length - 2}` : ''}
                  </span>
                  <span className="rounded-lg bg-snap-card border border-snap-border px-2 py-0.5 text-[10px] font-medium text-snap-ink">
                    💰 {t.bidStrategy === 'AUTO_BID' ? 'Auto Bid' : 'Max Bid'}
                  </span>
                  <span className="rounded-lg bg-snap-card border border-snap-border px-2 py-0.5 text-[10px] font-medium text-snap-ink">
                    👥 {t.gender} · {t.ageMin}–{t.ageMax === 50 ? '50+' : t.ageMax}
                  </span>
                </div>

                {/* Actions */}
                <div className="absolute bottom-3 right-3 hidden group-hover:flex items-center gap-1">
                  <button onClick={e => { e.stopPropagation(); setEditingTemplate(t); setShowTemplateModal(true); }}
                    className="flex h-6 w-6 items-center justify-center rounded-lg bg-snap-card border border-snap-border text-snap-muted hover:text-snap-ink transition-all">
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); deleteTemplate(t.id); refreshTemplates(); if (selectedTemplate?.id === t.id) setSelectedTemplate(null); }}
                    className="flex h-6 w-6 items-center justify-center rounded-lg bg-snap-card border border-snap-border text-snap-muted hover:text-red-500 transition-all">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── STEP 2 : Campaign cards ── */}
      <div className="rounded-2xl border border-snap-border bg-snap-card p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-snap-yellow text-[11px] font-bold text-snap-ink">2</span>
            <div>
              <h2 className="text-sm font-semibold text-snap-ink">Configure campaigns</h2>
              <p className="text-xs text-snap-muted">{rows.length} campaign{rows.length > 1 ? 's' : ''} · 1 card = Campaign + Ad Squad + Ad</p>
            </div>
          </div>
          <button onClick={addRow}
            className="flex items-center gap-1.5 rounded-xl border border-snap-border bg-snap-soft px-3 py-1.5 text-xs font-medium text-snap-muted hover:text-snap-ink transition-all">
            <Plus className="h-3.5 w-3.5" /> Add campaign
          </button>
        </div>

        <div className="space-y-4">
          {rows.map((row, i) => (
            <CampaignCard
              key={row.id}
              row={row}
              index={i}
              onChange={(key, value) => updateRow(row.id, key, value)}
              onDuplicate={() => duplicateRow(row.id)}
              onRemove={() => removeRow(row.id)}
              canRemove={rows.length > 1}
            />
          ))}

          {/* Add campaign button */}
          <button onClick={addRow}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-snap-border py-4 text-sm text-snap-muted hover:border-snap-muted hover:text-snap-ink transition-all">
            <Plus className="h-4 w-4" /> Add another campaign
          </button>
        </div>
      </div>

      {/* ── FIXED STATUS BAR ── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-snap-border bg-snap-card/95 backdrop-blur-sm px-6 py-4 shadow-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">

          {/* Stats */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-snap-yellow">
                <Zap className="h-4 w-4 text-snap-ink" />
              </div>
              <div>
                <p className="text-[10px] text-snap-muted uppercase tracking-widest">Template</p>
                <p className="text-xs font-semibold text-snap-ink">
                  {selectedTemplate?.name ?? <span className="text-amber-500">Not selected</span>}
                </p>
              </div>
            </div>

            <div className="h-8 w-px bg-snap-border" />

            <div className="flex items-center gap-4 text-xs">
              <div className="text-center">
                <p className="text-lg font-bold text-snap-ink">{rows.length}</p>
                <p className="text-[10px] text-snap-muted">Total</p>
              </div>
              {successCount > 0 && (
                <div className="text-center">
                  <p className="text-lg font-bold text-emerald-600">{successCount}</p>
                  <p className="text-[10px] text-snap-muted">Done</p>
                </div>
              )}
              {errorCount > 0 && (
                <div className="text-center">
                  <p className="text-lg font-bold text-red-500">{errorCount}</p>
                  <p className="text-[10px] text-snap-muted">Failed</p>
                </div>
              )}
              {launchingCount > 0 && (
                <div className="text-center">
                  <p className="text-lg font-bold text-yellow-600">{launchingCount}</p>
                  <p className="text-[10px] text-snap-muted">Launching</p>
                </div>
              )}
            </div>

            {/* Progress bar */}
            {launching && (
              <div className="w-40">
                <div className="h-1.5 rounded-full bg-snap-soft overflow-hidden">
                  <div
                    className="h-full bg-snap-yellow rounded-full transition-all duration-300"
                    style={{ width: `${((successCount + errorCount) / rows.length) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-snap-muted mt-0.5 text-right">
                  {successCount + errorCount}/{rows.length}
                </p>
              </div>
            )}
          </div>

          {/* Launch button */}
          <button
            onClick={handleLaunch}
            disabled={!canLaunch || launching}
            className="flex items-center gap-2 rounded-xl bg-snap-yellow px-8 py-3 text-sm font-bold text-snap-ink hover:brightness-105 disabled:opacity-40 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
          >
            {launching ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-snap-ink/30 border-t-snap-ink animate-spin" />
                Launching {successCount + errorCount}/{rows.length}...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Launch {idleCount} campaign{idleCount !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Template modal */}
      {showTemplateModal && (
        <TemplateModal
          initial={editingTemplate}
          onClose={() => { setShowTemplateModal(false); setEditingTemplate(null); }}
          onSaved={(t) => {
            refreshTemplates();
            setSelectedTemplate(t);
            setShowTemplateModal(false);
            setEditingTemplate(null);
          }}
        />
      )}
    </div>
  );
}