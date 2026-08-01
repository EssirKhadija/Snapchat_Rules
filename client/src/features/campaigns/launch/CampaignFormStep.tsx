import { useState, useRef } from 'react';
import { X, ArrowLeft, Zap, Upload, ChevronDown } from 'lucide-react';
import type { ObjectiveValue } from './ObjectivePickerStep';
import { CampaignTemplate, BulkRow } from './launch.types';
import { launchSingleCampaign, getTemplates, saveTemplate } from './launch.service';

// ── constants ──────────────────────────────────────────────────
const OBJECTIVE_LABELS: Record<ObjectiveValue, string> = {
  SALES: 'Sales',
  TRAFFIC: 'Traffic',
  APP_PROMOTION: 'App Promotion',
  LEADS: 'Lead Generation',
  AWARENESS_AND_ENGAGEMENT: 'Awareness & Engagement',
};

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

const LANGUAGES = [
  { code: 'all', name: 'All' },
  { code: 'ar', name: 'Arabic' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'tr', name: 'Turkish' },
  { code: 'ur', name: 'Urdu' },
];

const CTAS = [
  'SHOP_NOW', 'LEARN_MORE', 'SIGN_UP', 'WATCH_MORE',
  'INSTALL_NOW', 'BOOK_NOW', 'ORDER_NOW', 'GET_OFFER',
  'CONTACT_US', 'APPLY_NOW',
];

const CONVERSION_WINDOWS = [
  '28-day Click / 1-day View',
  '7-day Click / 1-day View',
  '1-day Click',
  '1-day View',
];

const AGE_OPTIONS = ['13+', '18+', '25+', '35+', '45+'];

// ── unified form state ─────────────────────────────────────────
interface FormState {
  // Campaign fields
  campaignName: string;
  adSetName: string;
  adNamePrefix: string;
  budget: string;
  bidType: 'AUTO_BID' | 'LOWEST_COST_WITH_MAX_BID';
  bid: string;
  conversionWindow: string;
  // Targeting
  age: string;
  gender: 'All' | 'Male' | 'Female';
  pixelId: string;
  country: string;
  language: string;
  // Creative / ad
  profile: string;
  headline: string;
  ctaButton: string;
  brandName: string;
  profileId: string;
  startDateTime: string;
  landingPageUrl: string;
  // Creative file
  creativeFile: File | null;
  creativeUrl: string;
  creativePreview: string;
}

const defaultForm = (objective: ObjectiveValue): FormState => ({
  campaignName: '',
  adSetName: '',
  adNamePrefix: '',
  budget: '',
  bidType: 'AUTO_BID',
  bid: '',
  conversionWindow: '28-day Click / 1-day View',
  age: '18+',
  gender: 'All',
  pixelId: '',
  country: '',
  language: 'all',
  profile: '',
  headline: '',
  ctaButton: 'SHOP_NOW',
  brandName: '',
  profileId: '',
  startDateTime: '',
  landingPageUrl: '',
  creativeFile: null,
  creativeUrl: '',
  creativePreview: '',
});

// ── reusable form primitives ───────────────────────────────────
const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs font-medium text-snap-ink mb-1.5">{children}</label>
);

const inputCls =
  'w-full rounded-xl border border-snap-border bg-snap-soft px-3.5 py-2.5 text-sm text-snap-ink placeholder:text-snap-muted focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-200 transition-all';

const selectCls =
  'w-full rounded-xl border border-snap-border bg-snap-soft px-3.5 py-2.5 text-sm text-snap-ink focus:border-yellow-400 focus:outline-none transition-all appearance-none cursor-pointer';

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-snap-muted" />
    </div>
  );
}

// ── main component ─────────────────────────────────────────────
interface Props {
  objective: ObjectiveValue;
  onBack: () => void;
  onClose: () => void;
  onLaunched: () => void;
}

export default function CampaignFormStep({ objective, onBack, onClose, onLaunched }: Props) {
  const [form, setForm] = useState<FormState>(() => defaultForm(objective));
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [templates, setTemplates] = useState<CampaignTemplate[]>(getTemplates);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    set('creativeFile', file);
    set('creativePreview', URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    set('creativeFile', file);
    set('creativePreview', URL.createObjectURL(file));
  };

  const isValid =
    form.campaignName.trim() &&
    form.budget &&
    form.headline.trim() &&
    (form.creativeFile || form.creativeUrl.trim());

  const handleSaveTemplate = () => {
    const templateName = prompt('Enter a name for this template:', form.campaignName || 'My Template');
    if (!templateName) return;

    const template: CampaignTemplate = {
      id: `tpl-${Date.now()}`,
      name: templateName,
      objectiveV2Type: objective,
      optimizationGoal: objective === 'SALES' ? 'PIXEL_PURCHASE' : 'SWIPES',
      bidStrategy: form.bidType,
      bidAmount: form.bidType === 'LOWEST_COST_WITH_MAX_BID' ? Number(form.bid) : undefined,
      countries: form.country ? [form.country] : ['SA'],
      ageMin: parseInt(form.age) || 18,
      ageMax: 50,
      gender: form.gender === 'All' ? 'ALL' : form.gender === 'Male' ? 'MALE' : 'FEMALE',
      placement: 'AUTOMATIC',
      pixelId: form.pixelId,
      callToAction: form.ctaButton,
      brandName: form.brandName,
      destinationUrl: form.landingPageUrl,
      createdAt: new Date().toISOString(),
    };
    saveTemplate(template);
    setTemplates(getTemplates());
  };

  const loadTemplate = (id: string) => {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setForm((p) => ({
      ...p,
      campaignName: t.name,
      bidType: t.bidStrategy,
      bid: t.bidAmount?.toString() || '',
      country: t.countries[0] || '',
      age: t.ageMin === 13 ? '13+' : t.ageMin === 25 ? '25+' : t.ageMin === 35 ? '35+' : t.ageMin === 45 ? '45+' : '18+',
      gender: t.gender === 'ALL' ? 'All' : t.gender === 'MALE' ? 'Male' : 'Female',
      pixelId: t.pixelId || '',
      ctaButton: t.callToAction || 'SHOP_NOW',
      brandName: t.brandName || '',
      landingPageUrl: t.destinationUrl || '',
    }));
  };

  const handleLaunch = async () => {
    if (!isValid || launching) return;
    setLaunching(true);
    setError(null);

    // Build a template-compatible object from unified form
    const template: CampaignTemplate = {
      id: `tpl-inline-${Date.now()}`,
      name: form.campaignName,
      objectiveV2Type: objective,
      optimizationGoal: objective === 'SALES' ? 'PIXEL_PURCHASE' : 'SWIPES',
      bidStrategy: form.bidType,
      bidAmount: form.bidType === 'LOWEST_COST_WITH_MAX_BID' ? Number(form.bid) : undefined,
      countries: form.country ? [form.country] : ['SA'],
      ageMin: parseInt(form.age) || 18,
      ageMax: 50,
      gender: form.gender === 'All' ? 'ALL' : form.gender === 'Male' ? 'MALE' : 'FEMALE',
      placement: 'AUTOMATIC',
      pixelId: form.pixelId,
      callToAction: form.ctaButton,
      brandName: form.brandName,
      destinationUrl: form.landingPageUrl,
      createdAt: new Date().toISOString(),
    };

    const row: BulkRow = {
      id: `row-${Date.now()}`,
      campaignName: form.campaignName,
      adSquadName: form.adSetName || form.campaignName,
      adName: form.adNamePrefix || form.campaignName,
      budget: form.budget,
      startDate: form.startDateTime
        ? form.startDateTime.split('T')[0]
        : new Date().toISOString().split('T')[0],
      endDate: '',
      headline: form.headline,
      creativeUrl: form.creativeUrl,
      creativeFile: form.creativeFile,
      creativePreview: form.creativePreview,
      status: 'idle',
    };

    try {
      await launchSingleCampaign(template, row);
      setSuccess(true);
      setLaunching(false);
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message ?? 'Launch failed');
      setLaunching(false);
    }
  };

  const objectiveLabel = OBJECTIVE_LABELS[objective];

  if (success) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center gap-4 py-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-3xl">
          ✅
        </div>
        <div>
          <p className="text-lg font-bold text-snap-ink">Campaign launched!</p>
          <p className="text-sm text-snap-muted mt-1">{form.campaignName} is now live.</p>
        </div>
        <button
          onClick={onLaunched}
          className="rounded-xl bg-snap-yellow px-6 py-2.5 text-sm font-bold text-snap-ink hover:brightness-105 transition-all"
        >
          Done →
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-snap-ink">
            Launch {objectiveLabel} Campaign
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center rounded-full bg-snap-yellow/20 px-2.5 py-0.5 text-[11px] font-semibold text-yellow-700">
              Step 2 of 2
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {templates.length > 0 && (
            <div className="w-48">
              <SelectWrapper>
                <select
                  value=""
                  onChange={(e) => loadTemplate(e.target.value)}
                  className="w-full rounded-xl border border-snap-border bg-snap-soft px-3.5 py-1.5 text-xs text-snap-ink focus:border-yellow-400 focus:outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="" disabled>Load Template...</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </SelectWrapper>
            </div>
          )}
          <button
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-snap-border text-snap-muted hover:text-snap-ink hover:border-snap-muted transition-all ml-4"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Scrollable form body ── */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4">

        {/* Row 1: Campaign Name + Ad Set Name */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Campaign Name</Label>
            <input
              value={form.campaignName}
              onChange={(e) => set('campaignName', e.target.value)}
              placeholder="USA Campaign"
              className={inputCls}
            />
          </div>
          <div>
            <Label>Ad Set Name</Label>
            <input
              value={form.adSetName}
              onChange={(e) => set('adSetName', e.target.value)}
              placeholder="USA Sales 18+"
              className={inputCls}
            />
          </div>
        </div>

        {/* Row 2: Ad Name Prefix */}
        <div>
          <Label>Ad Name Prefix</Label>
          <input
            value={form.adNamePrefix}
            onChange={(e) => set('adNamePrefix', e.target.value)}
            placeholder="Ad_Name"
            className={inputCls}
          />
        </div>

        {/* Row 3: Budget + Bid Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Budget</Label>
            <input
              type="number"
              min={20}
              value={form.budget}
              onChange={(e) => set('budget', e.target.value)}
              placeholder="5"
              className={inputCls}
            />
          </div>
          <div>
            <Label>Bid Type</Label>
            <SelectWrapper>
              <select
                value={form.bidType}
                onChange={(e) => set('bidType', e.target.value as FormState['bidType'])}
                className={selectCls}
              >
                <option value="AUTO_BID">Auto Bid</option>
                <option value="LOWEST_COST_WITH_MAX_BID">Max Bid</option>
              </select>
            </SelectWrapper>
          </div>
        </div>

        {/* Row 4: Conversion Window + Bid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Conversion Window</Label>
            <SelectWrapper>
              <select
                value={form.conversionWindow}
                onChange={(e) => set('conversionWindow', e.target.value)}
                className={selectCls}
              >
                {CONVERSION_WINDOWS.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </SelectWrapper>
          </div>
          <div>
            <Label>Bid</Label>
            <input
              type="number"
              value={form.bid}
              onChange={(e) => set('bid', e.target.value)}
              placeholder={form.bidType === 'AUTO_BID' ? 'Auto' : '4'}
              disabled={form.bidType === 'AUTO_BID'}
              className={inputCls + (form.bidType === 'AUTO_BID' ? ' opacity-40 cursor-not-allowed' : '')}
            />
          </div>
        </div>

        {/* Row 5: Age + Gender + Pixel */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Age</Label>
            <SelectWrapper>
              <select
                value={form.age}
                onChange={(e) => set('age', e.target.value)}
                className={selectCls}
              >
                {AGE_OPTIONS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </SelectWrapper>
          </div>
          <div>
            <Label>Gender</Label>
            <SelectWrapper>
              <select
                value={form.gender}
                onChange={(e) => set('gender', e.target.value as FormState['gender'])}
                className={selectCls}
              >
                <option value="All">All</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </SelectWrapper>
          </div>
          <div>
            <Label>Pixel</Label>
            <SelectWrapper>
              <select
                value={form.pixelId}
                onChange={(e) => set('pixelId', e.target.value)}
                className={selectCls}
              >
                <option value="">Select Pixel</option>
              </select>
            </SelectWrapper>
          </div>
        </div>

        {/* Row 6: Countries */}
        <div>
          <Label>Countries</Label>
          <SelectWrapper>
            <select
              value={form.country}
              onChange={(e) => set('country', e.target.value)}
              className={selectCls}
            >
              <option value="">Select countries</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </SelectWrapper>
        </div>

        {/* Row 7: Languages */}
        <div>
          <Label>Languages</Label>
          <SelectWrapper>
            <select
              value={form.language}
              onChange={(e) => set('language', e.target.value)}
              className={selectCls}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>
          </SelectWrapper>
        </div>

        {/* Row 8: Profile + Headline + CTA Button */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Profile</Label>
            <SelectWrapper>
              <select
                value={form.profile}
                onChange={(e) => set('profile', e.target.value)}
                className={selectCls}
              >
                <option value="">Select Profile</option>
              </select>
            </SelectWrapper>
          </div>
          <div>
            <Label>Headline</Label>
            <input
              value={form.headline}
              onChange={(e) => set('headline', e.target.value)}
              placeholder="Get yours today!"
              maxLength={34}
              className={inputCls}
            />
          </div>
          <div>
            <Label>CTA Button</Label>
            <SelectWrapper>
              <select
                value={form.ctaButton}
                onChange={(e) => set('ctaButton', e.target.value)}
                className={selectCls}
              >
                {CTAS.map((c) => (
                  <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </SelectWrapper>
          </div>
        </div>

        {/* Row 9: Brand Name + Profile ID + Start Date & Time */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Brand Name <span className="font-normal text-snap-muted">(Optional)</span></Label>
            <input
              value={form.brandName}
              onChange={(e) => set('brandName', e.target.value)}
              placeholder="Your Brand"
              className={inputCls}
            />
          </div>
          <div>
            <Label>Profile ID <span className="font-normal text-snap-muted">(Optional)</span></Label>
            <input
              value={form.profileId}
              onChange={(e) => set('profileId', e.target.value)}
              placeholder="b7d3a2e1-4f8b-47c6-9c15..."
              className={inputCls}
            />
          </div>
          <div>
            <Label>Start Date &amp; Time</Label>
            <input
              type="datetime-local"
              value={form.startDateTime}
              onChange={(e) => set('startDateTime', e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        {/* Row 10: Landing Page URL */}
        <div>
          <Label>Landing Page URL</Label>
          <input
            type="url"
            value={form.landingPageUrl}
            onChange={(e) => set('landingPageUrl', e.target.value)}
            placeholder="https://yoursite.com"
            className={inputCls}
          />
        </div>

        {/* Row 11: Creative Source */}
        <div>
          <Label>Creative Source</Label>
          <input
            ref={fileRef}
            type="file"
            accept="video/*,image/*"
            className="hidden"
            onChange={handleFile}
          />
          {form.creativeFile || form.creativePreview ? (
            <div className="relative rounded-2xl overflow-hidden border-2 border-snap-border bg-snap-soft">
              {form.creativePreview && (
                form.creativeFile?.type?.startsWith('video') ? (
                  <video src={form.creativePreview} className="h-40 w-full object-cover" />
                ) : (
                  <img src={form.creativePreview} alt="creative preview" className="h-40 w-full object-cover" />
                )
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-snap-ink/30 opacity-0 hover:opacity-100 transition-all">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="rounded-xl bg-snap-card px-4 py-2 text-sm font-semibold text-snap-ink"
                >
                  Change file
                </button>
              </div>
              <div className="px-4 py-2 flex items-center justify-between">
                <span className="text-xs text-snap-muted truncate">{form.creativeFile?.name ?? 'File selected'}</span>
                <button
                  type="button"
                  onClick={() => { set('creativeFile', null); set('creativePreview', ''); }}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors ml-2 shrink-0"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="group flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-snap-border bg-snap-soft py-10 cursor-pointer hover:border-yellow-400 hover:bg-snap-yellow/5 transition-all"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-snap-yellow/15 text-yellow-500 group-hover:bg-snap-yellow/25 transition-colors">
                <Upload className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-snap-yellow group-hover:text-yellow-600 transition-colors">
                Drop or click to upload
              </p>
              <p className="text-xs text-snap-muted">MP4, MOV · 25 left</p>
            </div>
          )}

          {/* URL fallback */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-px bg-snap-border" />
            <span className="text-[11px] text-snap-muted">or paste URL</span>
            <div className="flex-1 h-px bg-snap-border" />
          </div>
          <input
            type="url"
            value={form.creativeUrl}
            onChange={(e) => set('creativeUrl', e.target.value)}
            placeholder="https://cdn.example.com/video.mp4"
            className={inputCls + ' mt-2'}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            ❌ {error}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="shrink-0 mt-5 pt-4 border-t border-snap-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            id="wizard-back-btn"
            type="button"
            onClick={onBack}
            disabled={launching}
            className="flex items-center gap-1.5 rounded-xl border border-snap-border px-4 py-2.5 text-sm text-snap-muted hover:text-snap-ink disabled:opacity-40 transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button
            type="button"
            onClick={handleSaveTemplate}
            className="text-xs text-snap-muted hover:text-snap-ink transition-colors"
          >
            💾 Save as Template
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={launching}
            className="rounded-xl border border-snap-border px-4 py-2.5 text-sm text-snap-muted hover:text-snap-ink disabled:opacity-40 transition-all"
          >
            Cancel
          </button>
          <button
            id="wizard-launch-btn"
            type="button"
            onClick={handleLaunch}
            disabled={!isValid || launching}
            className="flex items-center gap-2 rounded-xl bg-snap-yellow px-6 py-2.5 text-sm font-bold text-snap-ink hover:brightness-105 disabled:opacity-40 hover:-translate-y-0.5 hover:shadow-md transition-all"
          >
            {launching ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-snap-ink/30 border-t-snap-ink animate-spin" />
                Launching…
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Launch Campaign
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
