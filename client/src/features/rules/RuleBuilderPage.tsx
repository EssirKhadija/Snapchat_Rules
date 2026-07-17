import { useMemo, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RuleDTO, RuleCondition, RuleAction } from './rules.types';
import ConditionRow from './components/ConditionRow';
import ActionRow from './components/ActionRow';
import { createRule } from './rules.service';
import { useTranslation } from '../../shared/lib/i18n';

const schema = z.object({
  name: z.string().min(3),
  enabled: z.boolean(),
  conditions: z.array(z.object({ id: z.string(), field: z.string(), operator: z.string(), value: z.string() })),
  actions: z.array(z.object({ id: z.string(), type: z.string(), params: z.any().optional() }))
});

const fieldLabels: Record<string,string> = {
  spend: 'Dépense',
  ctr: 'CTR',
  cpc: 'CPC',
  cpa: 'CPA',
  cpm: 'CPM',
  roas: 'ROAS',
  conversions: 'Conversions',
  clicks: 'Clics',
  impressions: 'Impressions',
  status: 'Statut'
};

const operatorLabels: Record<string,string> = {
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
  eq: '=',
  neq: '≠'
};

const actionLabels: Record<string,string> = {
  pause_campaign: 'Mettre en pause la campagne',
  resume_campaign: 'Relancer la campagne',
  increase_budget: 'Augmenter le budget',
  decrease_budget: 'Réduire le budget',
  send_notification: 'Envoyer une notification',
  enable_rule: 'Activer la règle',
  disable_rule: 'Désactiver la règle'
};

export default function RuleBuilderPage(){
  const { t } = useTranslation();
  const { register, control, handleSubmit, watch } = useForm<RuleDTO>({ resolver: zodResolver(schema), defaultValues: { name: '', enabled: true, conditions: [], actions: [] } as any });
  const { fields: condFields, append: appendCond, remove: removeCond, update: updateCond } = useFieldArray({ control, name: 'conditions' });
  const { fields: actFields, append: appendAct, remove: removeAct, update: updateAct } = useFieldArray({ control, name: 'actions' });
  const [saving, setSaving] = useState(false);

  const watchedRule = watch();

  const previewText = useMemo(() => {
    if (!watchedRule) return 'Aucune règle définie pour le moment.';

    const lines: string[] = [];
    lines.push(watchedRule.name ? `Règle : ${watchedRule.name}` : 'Règle : (sans nom)');
    lines.push(`Statut : ${watchedRule.enabled ? 'Activée' : 'Désactivée'}`);
    lines.push('');

    if (watchedRule.conditions.length === 0) {
      lines.push('Aucune condition définie.');
    } else {
      lines.push('Conditions :');
      watchedRule.conditions.forEach((condition, index) => {
        lines.push(`  ${index + 1}. ${fieldLabels[condition.field] || condition.field} ${operatorLabels[condition.operator] || condition.operator} ${condition.value}`);
      });
    }

    lines.push('');
    if (watchedRule.actions.length === 0) {
      lines.push('Aucune action définie.');
    } else {
      lines.push('Actions :');
      watchedRule.actions.forEach((action, index) => {
        const label = actionLabels[action.type] || action.type;
        const params = action.params && Object.keys(action.params).length ? ` (${JSON.stringify(action.params)})` : '';
        lines.push(`  ${index + 1}. ${label}${params}`);
      });
    }

    return lines.join('\n');
  }, [watchedRule]);

  const onSubmit = async (data: RuleDTO) => {
    setSaving(true);
    try{
      await createRule(data);
      alert('Règle enregistrée (simulation)');
    }catch(e){ alert('Erreur'); }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
        <h1 className="text-2xl font-semibold">{t('ruleBuilder.title')}</h1>
        <p className="mt-2 text-slate-600">{t('ruleBuilder.description')}</p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('ruleBuilder.name')}</label>
              <input {...register('name')} className="mt-1 block w-full rounded-md border p-2" />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" {...register('enabled')} />
              <label className="text-sm text-slate-600">{t('ruleBuilder.enabled')}</label>
            </div>

            <div>
              <h3 className="font-semibold">{t('ruleBuilder.conditions')}</h3>
              <div className="mt-3 space-y-2">
                {condFields.map((c, idx)=> (
                  <ConditionRow key={c.id} condition={c as RuleCondition} onChange={(nc)=> updateCond(idx, nc)} onRemove={()=> removeCond(idx)} />
                ))}
                <button type="button" onClick={()=> appendCond({ id: 'c-'+Date.now(), field: 'spend', operator: 'gt', value: '0' })} className="rounded-md bg-slate-900 text-white px-4 py-2">{t('ruleBuilder.addCondition')}</button>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold">{t('ruleBuilder.actions')}</h3>
              <div className="mt-3 space-y-2">
                {actFields.map((a, idx)=> (
                  <ActionRow key={a.id} action={a as RuleAction} onChange={(na)=> updateAct(idx, na)} onRemove={()=> removeAct(idx)} />
                ))}
                <button type="button" onClick={()=> appendAct({ id: 'a-'+Date.now(), type: 'pause_campaign' })} className="rounded-md bg-slate-900 text-white px-4 py-2">{t('ruleBuilder.addAction')}</button>
              </div>
            </div>

          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
          <h3 className="font-semibold">{t('ruleBuilder.previewTitle')}</h3>
          <p className="mt-2 text-sm text-slate-600">{t('ruleBuilder.previewTitle')}</p>
          <div className="mt-4">
            <pre className="rounded-md bg-slate-50 p-4 text-sm whitespace-pre-wrap">{previewText}</pre>
          </div>

          <div className="mt-6 flex gap-2">
            <button type="submit" disabled={saving} className="rounded-xl bg-emerald-600 px-4 py-2 text-white">{t('ruleBuilder.save')}</button>
            <button type="button" onClick={()=> { /* reset form - omitted for brevity */ }} className="rounded-xl border px-4 py-2">{t('ruleBuilder.reset')}</button>
          </div>
        </div>
      </form>
    </div>
  );
}
