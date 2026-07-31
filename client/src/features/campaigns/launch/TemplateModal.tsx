import { useState } from 'react';
import { X } from 'lucide-react';
import { CampaignTemplate } from './launch.types';
import { saveTemplate } from './launch.service';

const COUNTRIES = [
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'UAE' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'QA', name: 'Qatar' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'OM', name: 'Oman' },
  { code: 'EG', name: 'Egypt' },
  { code: 'JO', name: 'Jordan' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'MA', name: 'Morocco' },
  { code: 'TR', name: 'Turkey' },
  { code: 'PK', name: 'Pakistan' },
];

const OBJECTIVES = [
  { value: 'SALES', label: 'Sales' },
  { value: 'AWARENESS_AND_ENGAGEMENT', label: 'Awareness & Engagement' },
  { value: 'TRAFFIC', label: 'Traffic' },
  { value: 'APP_PROMOTION', label: 'App Promotion' },
  { value: 'LEADS', label: 'Lead Generation' },
];

const OPTIMIZATION_GOALS = [
  { value: 'PIXEL_PURCHASE', label: 'Pixel Purchase' },
  { value: 'PIXEL_ADD_TO_CART', label: 'Add to Cart' },
  { value: 'PIXEL_PAGE_VIEW', label: 'Page View' },
  { value: 'SWIPES', label: 'Swipes' },
  { value: 'IMPRESSIONS', label: 'Impressions' },
  { value: 'APP_INSTALLS', label: 'App Installs' },
  { value: 'LANDING_PAGE_VIEW', label: 'Landing Page View' },
];

const CTAS = [
  'SHOP_NOW', 'LEARN_MORE', 'SIGN_UP', 'WATCH_MORE',
  'INSTALL_NOW', 'BOOK_NOW', 'ORDER_NOW', 'GET_OFFER',
  'CONTACT_US', 'APPLY_NOW',
];

const DEFAULT: Omit<CampaignTemplate, 'id' | 'createdAt'> = {
  name: '',
  objectiveV2Type: 'SALES',
  optimizationGoal: 'PIXEL_PURCHASE',
  bidStrategy: 'AUTO_BID',
  bidAmount: undefined,
  countries: ['SA'],
  ageMin: 18,
  ageMax: 45,
  gender: 'ALL',
  placement: 'AUTOMATIC',
  pixelId: '',
  callToAction: 'SHOP_NOW',
  brandName: '',
  destinationUrl: '',
};

interface Props {
  initial?: CampaignTemplate | null;
  onClose: () => void;
  onSaved: (t: CampaignTemplate) => void;
}

export default function TemplateModal({ initial, onClose, onSaved }: Props) {
  const [form, setForm] = useState<Omit<CampaignTemplate, 'id' | 'createdAt'>>(
    initial ?? DEFAULT
  );

  const set = (key: keyof typeof form, value: any) =>
    setForm(p => ({ ...p, [key]: value }));

  const toggleCountry = (code: string) => {
    const exists = form.countries.includes(code);
    set('countries', exists ? form.countries.filter(c => c !== code) : [...form.countries, code]);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    const template: CampaignTemplate = {
      ...form,
      id: initial?.id ?? `tpl-${Date.now()}`,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    };
    saveTemplate(template);
    onSaved(template);
  };

  const isValid = form.name.trim().length > 0 && form.brandName.trim().length > 0 && form.destinationUrl.trim().length > 0 && form.countries.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-snap-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-snap-border bg-snap-card shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-snap-border px-6 py-4 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-snap-ink">
              {initial ? 'Edit template' : 'New template'}
            </h2>
            <p className="mt-0.5 text-xs text-snap-muted">
              Save your campaign structure to reuse it instantly
            </p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl border border-snap-border text-snap-muted hover:text-snap-ink transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-5 flex-1">

          {/* Template name */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-snap-muted mb-1.5">Template name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. KSA — Web Conversion — Auto Bid"
              className="w-full rounded-xl border border-snap-border bg-snap-soft px-4 py-2.5 text-sm text-snap-ink placeholder:text-snap-muted focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-200 transition-all" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Objective */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-snap-muted mb-1.5">Objective *</label>
              <select value={form.objectiveV2Type} onChange={e => set('objectiveV2Type', e.target.value)}
                className="w-full rounded-xl border border-snap-border bg-snap-soft px-4 py-2.5 text-sm text-snap-ink focus:border-yellow-400 focus:outline-none transition-all">
                {OBJECTIVES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Optimization goal */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-snap-muted mb-1.5">Optimization goal *</label>
              <select value={form.optimizationGoal} onChange={e => set('optimizationGoal', e.target.value)}
                className="w-full rounded-xl border border-snap-border bg-snap-soft px-4 py-2.5 text-sm text-snap-ink focus:border-yellow-400 focus:outline-none transition-all">
                {OPTIMIZATION_GOALS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
          </div>

          {/* Pixel ID */}
          {form.optimizationGoal.startsWith('PIXEL') && (
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-snap-muted mb-1.5">Pixel ID</label>
              <input value={form.pixelId ?? ''} onChange={e => set('pixelId', e.target.value)}
                placeholder="6a2e98d2-a454-4ac9-b4cd-9d8be9087690"
                className="w-full rounded-xl border border-snap-border bg-snap-soft px-4 py-2.5 text-sm text-snap-ink placeholder:text-snap-muted focus:border-yellow-400 focus:outline-none transition-all" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Bid strategy */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-snap-muted mb-1.5">Bid strategy *</label>
              <select value={form.bidStrategy} onChange={e => set('bidStrategy', e.target.value as any)}
                className="w-full rounded-xl border border-snap-border bg-snap-soft px-4 py-2.5 text-sm text-snap-ink focus:border-yellow-400 focus:outline-none transition-all">
                <option value="AUTO_BID">Auto Bid</option>
                <option value="LOWEST_COST_WITH_MAX_BID">Max Bid</option>
              </select>
            </div>

            {/* Max bid */}
            {form.bidStrategy === 'LOWEST_COST_WITH_MAX_BID' && (
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-snap-muted mb-1.5">Max bid ($)</label>
                <input type="number" value={form.bidAmount ?? ''} onChange={e => set('bidAmount', Number(e.target.value))}
                  placeholder="2.00"
                  className="w-full rounded-xl border border-snap-border bg-snap-soft px-4 py-2.5 text-sm text-snap-ink focus:border-yellow-400 focus:outline-none transition-all" />
              </div>
            )}
          </div>

          {/* Placement */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-snap-muted mb-1.5">Placement</label>
            <div className="flex gap-2">
              {(['AUTOMATIC', 'SNAP_ADS', 'STORIES'] as const).map(p => (
                <button key={p} type="button" onClick={() => set('placement', p)}
                  className={`flex-1 rounded-xl border py-2 text-xs font-medium transition-all ${form.placement === p ? 'border-snap-yellow/40 bg-snap-yellow/10 text-yellow-700' : 'border-snap-border bg-snap-soft text-snap-muted hover:text-snap-ink'
                    }`}>
                  {p === 'AUTOMATIC' ? '⚡ Auto' : p === 'SNAP_ADS' ? '📸 Snap Ads' : '📖 Stories'}
                </button>
              ))}
            </div>
          </div>

          {/* Countries */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-snap-muted mb-1.5">
              Target countries * ({form.countries.length} selected)
            </label>
            <div className="relative">
              <select
                multiple
                value={form.countries}
                onChange={e => {
                  const selected = Array.from(e.target.selectedOptions).map(o => o.value);
                  set('countries', selected);
                }}
                className="w-full rounded-xl border border-snap-border bg-snap-soft px-3 py-2 text-sm text-snap-ink focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-200 transition-all"
                style={{ height: '140px' }}
              >
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}
                    className={form.countries.includes(c.code) ? 'bg-snap-yellow/20 font-semibold' : ''}>
                    {c.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-snap-muted">
                Hold <kbd className="rounded bg-snap-soft border border-snap-border px-1">Ctrl</kbd> (or <kbd className="rounded bg-snap-soft border border-snap-border px-1">Cmd</kbd>) to select multiple countries
              </p>
            </div>
            {/* Selected tags */}
            {form.countries.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {form.countries.map(code => {
                  const country = COUNTRIES.find(c => c.code === code);
                  return (
                    <span key={code}
                      className="inline-flex items-center gap-1 rounded-lg border border-snap-yellow/40 bg-snap-yellow/10 px-2 py-0.5 text-[11px] font-medium text-yellow-700">
                      {country?.name ?? code}
                      <button type="button" onClick={() => set('countries', form.countries.filter(c => c !== code))}
                        className="hover:text-red-500 transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Age & Gender */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-snap-muted mb-1.5">
                Age: {form.ageMin}–{form.ageMax === 50 ? '50+' : form.ageMax}
              </label>
              <div className="flex gap-3">
                <input type="range" min={13} max={49} value={form.ageMin} onChange={e => set('ageMin', Number(e.target.value))} className="flex-1 accent-yellow-400" />
                <input type="range" min={14} max={50} value={form.ageMax} onChange={e => set('ageMax', Number(e.target.value))} className="flex-1 accent-yellow-400" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-snap-muted mb-1.5">Gender</label>
              <div className="flex gap-1.5">
                {(['ALL', 'MALE', 'FEMALE'] as const).map(g => (
                  <button key={g} type="button" onClick={() => set('gender', g)}
                    className={`flex-1 rounded-xl border py-2 text-xs font-medium transition-all ${form.gender === g ? 'border-snap-yellow/40 bg-snap-yellow/10 text-yellow-700' : 'border-snap-border bg-snap-soft text-snap-muted hover:text-snap-ink'
                      }`}>
                    {g === 'ALL' ? '👥 All' : g === 'MALE' ? '👨 M' : '👩 F'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Brand name & CTA */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-snap-muted mb-1.5">Brand name * (max 32)</label>
              <input value={form.brandName} maxLength={32} onChange={e => set('brandName', e.target.value)}
                placeholder="My Brand"
                className="w-full rounded-xl border border-snap-border bg-snap-soft px-4 py-2.5 text-sm text-snap-ink placeholder:text-snap-muted focus:border-yellow-400 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-snap-muted mb-1.5">Call to action *</label>
              <select value={form.callToAction} onChange={e => set('callToAction', e.target.value)}
                className="w-full rounded-xl border border-snap-border bg-snap-soft px-4 py-2.5 text-sm text-snap-ink focus:border-yellow-400 focus:outline-none transition-all">
                {CTAS.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>

          {/* Destination URL */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-snap-muted mb-1.5">Default destination URL *</label>
            <input type="url" value={form.destinationUrl} onChange={e => set('destinationUrl', e.target.value)}
              placeholder="https://yoursite.com"
              className="w-full rounded-xl border border-snap-border bg-snap-soft px-4 py-2.5 text-sm text-snap-ink placeholder:text-snap-muted focus:border-yellow-400 focus:outline-none transition-all" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-snap-border px-6 py-4 shrink-0">
          <button onClick={onClose} className="rounded-xl border border-snap-border px-4 py-2 text-sm text-snap-muted hover:text-snap-ink transition-all">
            Cancel
          </button>
          <button onClick={handleSave} disabled={!isValid}
            className="rounded-xl bg-snap-yellow px-5 py-2 text-sm font-semibold text-snap-ink hover:brightness-105 disabled:opacity-40 transition-all">
            Save template
          </button>
        </div>
      </div>
    </div>
  );
}