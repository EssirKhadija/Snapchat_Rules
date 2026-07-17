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

const CONDITIONS = [
  { value: 'spend' },
  { value: 'ctr' },
  { value: 'cpc' },
  { value: 'cpa' },
  { value: 'cpm' },
  { value: 'roas' },
  { value: 'conversions' },
  { value: 'impressions' },
  { value: 'clicks' },
];

const OPERATORS = [
  { value: 'gt' },
  { value: 'gte' },
  { value: 'lt' },
  { value: 'lte' },
  { value: 'eq' },
];

const ACTIONS = [
  { value: 'pause_campaign' },
  { value: 'resume_campaign' },
  { value: 'increase_budget' },
  { value: 'decrease_budget' },
  { value: 'send_notification' },
];

export default function RuleModal({ target, onClose }: { target: RuleTarget; onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { t } = useTranslation();

  const { register, control, handleSubmit, watch } = useForm<RuleDTO>({
    defaultValues: {
      name: `${t('ruleBuilder.ruleName', { name: target.name })}`,
      enabled: true,
      conditions: [{ id: 'c-1', field: 'cpa', operator: 'gt', value: '50' }],
      actions: [{ id: 'a-1', type: 'pause_campaign' }],
    },
  });

  const { fields: conds, append: addCond, remove: removeCond } = useFieldArray({ control, name: 'conditions' });
  const { fields: acts, append: addAct, remove: removeAct } = useFieldArray({ control, name: 'actions' });
  const watched = watch();

  const onSubmit = async (data: RuleDTO) => {
    setSaving(true);
    try {
      await createRule({ ...data, targetId: target.id, targetType: target.type } as any);
      setSaved(true);
      setTimeout(onClose, 1200);
    } catch {
      alert('Erreur lors de l\'enregistrement.');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-snap-ink/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-snap-border bg-snap-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-snap-border px-6 py-4">
          <div>
              <div className="flex items-center gap-2">
              <span className="rounded-lg bg-snap-yellow px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-snap-ink">
                {target.type === 'campaign' ? t('ruleModal.ruleType.campaign') : t('ruleModal.ruleType.adsquad')}
              </span>
              <span className="text-xs text-snap-muted truncate max-w-[200px]">{target.name}</span>
            </div>
            <h2 className="mt-1 text-base font-semibold text-snap-ink">{t('ruleModal.title')}</h2>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl border border-snap-border text-snap-muted hover:text-snap-ink transition-all">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6">
            {/* Nom */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-snap-muted mb-2">Nom de la règle</label>
              <input
                {...register('name')}
                className="w-full rounded-xl border border-snap-border bg-snap-soft px-4 py-2.5 text-sm text-snap-ink focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-200 transition-all"
              />
            </div>

            {/* Conditions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-snap-muted">
                    {t('ruleModal.conditionsLabel')}
                  </label>
                <button
                  type="button"
                  onClick={() => addCond({ id: 'c-' + Date.now(), field: 'spend', operator: 'gt', value: '0' })}
                  className="text-xs text-snap-yellow font-semibold hover:brightness-90 transition-all"
                >
                  {t('ruleModal.addCondition')}
                </button>
              </div>
              <div className="space-y-2">
                {conds.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-2 rounded-xl border border-snap-border bg-snap-soft p-3">
                    <select
                      {...register(`conditions.${i}.field`)}
                      className="flex-1 rounded-lg border border-snap-border bg-snap-card px-3 py-2 text-xs text-snap-ink focus:outline-none"
                    >
                      {CONDITIONS.map(f => <option key={f.value} value={f.value}>{t(`ruleBuilder.conditionField.${f.value}`)}</option>)}
                    </select>
                    <select
                      {...register(`conditions.${i}.operator`)}
                      className="w-16 rounded-lg border border-snap-border bg-snap-card px-2 py-2 text-xs text-snap-ink focus:outline-none"
                    >
                      {OPERATORS.map(o => <option key={o.value} value={o.value}>{t(`ruleBuilder.operator.${o.value}`)}</option>)}
                    </select>
                    <input
                      {...register(`conditions.${i}.value`)}
                      type="number"
                      className="w-24 rounded-lg border border-snap-border bg-snap-card px-3 py-2 text-xs text-snap-ink focus:outline-none"
                    />
                    <button type="button" onClick={() => removeCond(i)} className="text-snap-muted hover:text-red-500 transition-colors text-sm">✕</button>
                  </div>
                ))}
                {conds.length === 0 && (
                  <p className="text-xs text-snap-muted italic">{t('ruleBuilder.conditionRow.noCondition')}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-snap-muted">
                  {t('ruleModal.actionsLabel')}
                </label>
                <button
                  type="button"
                  onClick={() => addAct({ id: 'a-' + Date.now(), type: 'pause_campaign' })}
                  className="text-xs text-snap-yellow font-semibold hover:brightness-90 transition-all"
                >
                  {t('ruleModal.addAction')}
                </button>
              </div>
              <div className="space-y-2">
                {acts.map((a, i) => (
                  <div key={a.id} className="flex items-center gap-2 rounded-xl border border-snap-border bg-snap-soft p-3">
                    <select
                      {...register(`actions.${i}.type`)}
                      className="flex-1 rounded-lg border border-snap-border bg-snap-card px-3 py-2 text-xs text-snap-ink focus:outline-none"
                    >
                      {ACTIONS.map(a => <option key={a.value} value={a.value}>{t(`ruleBuilder.action.${a.value}`)}</option>)}
                    </select>
                    <button type="button" onClick={() => removeAct(i)} className="text-snap-muted hover:text-red-500 transition-colors text-sm">✕</button>
                  </div>
                ))}
                {acts.length === 0 && (
                  <p className="text-xs text-snap-muted italic">{t('ruleModal.action.none')}</p>
                )}
              </div>
            </div>

            {/* Aperçu */}
            <div className="rounded-xl border border-snap-border bg-snap-soft p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-snap-muted mb-2">{t('ruleModal.preview.label')}</p>
              <p className="text-xs text-snap-ink leading-relaxed">
                <span className="font-semibold">"{watched.name}"</span> — Si{' '}
                {watched.conditions?.length > 0
                  ? watched.conditions.map((c, i) => (
                    <span key={i}>{i > 0 ? ` ${t('ruleModal.previewThen')} ` : ' '}<span className="font-medium">{t(`ruleBuilder.conditionField.${c.field}`) ?? c.field}</span> {t(`ruleBuilder.operator.${c.operator}`)} {c.value}</span>
                  ))
                  : ' toujours'
                }{', alors '}
                {watched.actions?.length > 0
                  ? watched.actions.map((a, i) => <span key={i}>{i > 0 ? ', ' : ''}{t(`ruleBuilder.action.${a.type}`) ?? a.type}</span>)
                  : t('ruleModal.action.none')
                }.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-snap-border px-6 py-4">
            <label className="flex items-center gap-2 text-sm text-snap-muted cursor-pointer">
              <input type="checkbox" {...register('enabled')} className="accent-yellow-400" />
              {t('ruleModal.enabledLabel')}
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="rounded-xl border border-snap-border px-4 py-2 text-sm text-snap-muted hover:text-snap-ink transition-all">
                {t('ruleModal.cancel')}
              </button>
              <button
                type="submit"
                disabled={saving || saved}
                className="rounded-xl bg-snap-yellow px-5 py-2 text-sm font-semibold text-snap-ink hover:brightness-105 disabled:opacity-60 transition-all"
              >
                {saved ? t('ruleModal.saveSuccess') : saving ? t('ruleModal.saving') : t('ruleModal.save')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}