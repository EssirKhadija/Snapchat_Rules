import { useState } from 'react';
import { useTranslation } from '../../../shared/lib/i18n';
import { useForm, useFieldArray } from 'react-hook-form';
import { createRule } from '../../rules/rules.service';
import { RuleDTO } from '../../rules/rules.types';

interface RuleTarget {
  type: 'campaign' | 'adsquad' | 'ad';
  id: string;
  name: string;
}

const OPERATORS = [
  { value: 'gt',  symbol: '>' },
  { value: 'gte', symbol: '≥' },
  { value: 'lt',  symbol: '<' },
  { value: 'lte', symbol: '≤' },
  { value: 'eq',  symbol: '=' },
];

export default function RuleModal({ target, onClose }: { target: RuleTarget; onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { t } = useTranslation();

  const FIELDS = [
    { value: 'spend',       label: t('ruleModal.field.spend') },
    { value: 'ctr',         label: t('ruleModal.field.ctr') },
    { value: 'cpa',         label: t('ruleModal.field.cpa') },
    { value: 'cpm',         label: t('ruleModal.field.cpm') },
    { value: 'roas',        label: t('ruleModal.field.roas') },
    { value: 'impressions', label: t('ruleModal.field.impressions') },
    { value: 'clicks',      label: t('ruleModal.field.clicks') },
  ];

  const ACTIONS = [
    { value: 'pause_campaign',    label: t('ruleModal.action.pause') },
    { value: 'resume_campaign',   label: t('ruleModal.action.resume') },
    { value: 'increase_budget',   label: t('ruleModal.action.increase') },
    { value: 'decrease_budget',   label: t('ruleModal.action.decrease') },
    { value: 'send_notification', label: t('ruleModal.action.notify') },
  ];

  const typeLabel = target.type === 'campaign'
    ? t('ruleModal.campaign')
    : target.type === 'adsquad'
    ? t('ruleModal.adsquad')
    : t('ruleModal.ad');

  const { register, control, handleSubmit, watch } = useForm<RuleDTO>({
    defaultValues: {
      name: `Rule — ${target.name}`,
      enabled: true,
      conditions: [{ id: 'c-1', field: 'cpa', operator: 'gt', value: '50' }],
      actions: [{ id: 'a-1', type: 'pause_campaign' }],
    },
  });

  const { fields: conds, append: addCond, remove: removeCond } = useFieldArray({ control, name: 'conditions' });
  const { fields: acts,  append: addAct,  remove: removeAct  } = useFieldArray({ control, name: 'actions' });
  const watched = watch();

  const onSubmit = async (data: RuleDTO) => {
    setSaving(true);
    try {
      await createRule({ ...data, targetId: target.id, targetType: target.type } as any);
      setSaved(true);
      setTimeout(onClose, 1200);
    } catch {
      alert('Error saving rule.');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-snap-ink/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-snap-border bg-snap-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-snap-border px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-snap-yellow px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-snap-ink">
                {typeLabel}
              </span>
              <span className="truncate max-w-[200px] text-xs text-snap-muted">{target.name}</span>
            </div>
            <h2 className="mt-1 text-base font-semibold text-snap-ink">{t('ruleModal.title')}</h2>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl border border-snap-border text-snap-muted hover:text-snap-ink transition-all">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6">

            {/* Rule name */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-snap-muted mb-2">
                {t('ruleModal.ruleName')}
              </label>
              <input
                {...register('name')}
                className="w-full rounded-xl border border-snap-border bg-snap-soft px-4 py-2.5 text-sm text-snap-ink focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-200 transition-all"
              />
            </div>

            {/* Conditions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-snap-muted">
                  {t('ruleModal.if')}
                </label>
                <button type="button" onClick={() => addCond({ id: 'c-' + Date.now(), field: 'spend', operator: 'gt', value: '0' })}
                  className="text-xs font-semibold text-snap-yellow hover:brightness-90 transition-all">
                  {t('ruleModal.add')}
                </button>
              </div>
              <div className="space-y-2">
                {conds.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-2 rounded-xl border border-snap-border bg-snap-soft p-3">
                    <select {...register(`conditions.${i}.field`)}
                      className="flex-1 rounded-lg border border-snap-border bg-snap-card px-3 py-2 text-xs text-snap-ink focus:outline-none">
                      {FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                    <select {...register(`conditions.${i}.operator`)}
                      className="w-16 rounded-lg border border-snap-border bg-snap-card px-2 py-2 text-xs text-snap-ink focus:outline-none">
                      {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.symbol}</option>)}
                    </select>
                    <input {...register(`conditions.${i}.value`)} type="number"
                      className="w-24 rounded-lg border border-snap-border bg-snap-card px-3 py-2 text-xs text-snap-ink focus:outline-none" />
                    <button type="button" onClick={() => removeCond(i)} className="text-snap-muted hover:text-red-500 transition-colors">✕</button>
                  </div>
                ))}
                {conds.length === 0 && <p className="text-xs italic text-snap-muted">No condition — rule always applies.</p>}
              </div>
            </div>

            {/* Actions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-snap-muted">
                  {t('ruleModal.then')}
                </label>
                <button type="button" onClick={() => addAct({ id: 'a-' + Date.now(), type: 'pause_campaign' })}
                  className="text-xs font-semibold text-snap-yellow hover:brightness-90 transition-all">
                  {t('ruleModal.add')}
                </button>
              </div>
              <div className="space-y-2">
                {acts.map((a, i) => (
                  <div key={a.id} className="flex items-center gap-2 rounded-xl border border-snap-border bg-snap-soft p-3">
                    <select {...register(`actions.${i}.type`)}
                      className="flex-1 rounded-lg border border-snap-border bg-snap-card px-3 py-2 text-xs text-snap-ink focus:outline-none">
                      {ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                    </select>
                    <button type="button" onClick={() => removeAct(i)} className="text-snap-muted hover:text-red-500 transition-colors">✕</button>
                  </div>
                ))}
                {acts.length === 0 && <p className="text-xs italic text-snap-muted">{t('ruleModal.previewNone')}</p>}
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-xl border border-snap-border bg-snap-soft p-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-snap-muted">{t('ruleModal.preview')}</p>
              <p className="text-xs leading-relaxed text-snap-ink">
                <span className="font-semibold">"{watched.name}"</span> — {t('ruleModal.previewIf')}{' '}
                {watched.conditions?.length > 0
                  ? watched.conditions.map((c, i) => (
                    <span key={i}>
                      {i > 0 ? ' AND ' : ''}
                      <span className="font-medium">{FIELDS.find(f => f.value === c.field)?.label ?? c.field}</span>
                      {' '}{OPERATORS.find(o => o.value === c.operator)?.symbol}{' '}{c.value}
                    </span>
                  ))
                  : ` ${t('ruleModal.previewAlways')}`
                }
                {`, ${t('ruleModal.previewThen')} `}
                {watched.actions?.length > 0
                  ? watched.actions.map((a, i) => <span key={i}>{i > 0 ? ', ' : ''}{ACTIONS.find(x => x.value === a.type)?.label ?? a.type}</span>)
                  : t('ruleModal.previewNone')
                }.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-snap-border px-6 py-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-snap-muted">
              <input type="checkbox" {...register('enabled')} className="accent-yellow-400" />
              {t('ruleModal.enableNow')}
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={onClose}
                className="rounded-xl border border-snap-border px-4 py-2 text-sm text-snap-muted hover:text-snap-ink transition-all">
                {t('ruleModal.cancel')}
              </button>
              <button type="submit" disabled={saving || saved}
                className="rounded-xl bg-snap-yellow px-5 py-2 text-sm font-semibold text-snap-ink hover:brightness-105 disabled:opacity-60 transition-all">
                {saved ? t('ruleModal.saved') : saving ? t('ruleModal.saving') : t('ruleModal.save')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}