import { RuleCondition, ConditionField, ConditionOperator } from '../rules.types';
import { useTranslation } from '../../../shared/lib/i18n';

const fields: ConditionField[] = ['spend','ctr','cpc','cpa','cpm','roas','conversions','clicks','impressions','status'];
const operators: ConditionOperator[] = ['gt','gte','lt','lte','eq','neq'];

export default function ConditionRow({ condition, onChange, onRemove }: { condition: RuleCondition; onChange: (c: RuleCondition)=>void; onRemove: ()=>void }){
  const { t } = useTranslation();

  const fieldLabels: Record<ConditionField, string> = {
    spend: t('ruleBuilder.conditionField.spend'),
    ctr: t('ruleBuilder.conditionField.ctr'),
    cpc: t('ruleBuilder.conditionField.cpc'),
    cpa: t('ruleBuilder.conditionField.cpa'),
    cpm: t('ruleBuilder.conditionField.cpm'),
    roas: t('ruleBuilder.conditionField.roas'),
    conversions: t('ruleBuilder.conditionField.conversions'),
    clicks: t('ruleBuilder.conditionField.clicks'),
    impressions: t('ruleBuilder.conditionField.impressions'),
    status: t('ruleBuilder.conditionField.status')
  };

  const operatorLabels: Record<ConditionOperator, string> = {
    gt: t('ruleBuilder.operator.gt'),
    gte: t('ruleBuilder.operator.gte'),
    lt: t('ruleBuilder.operator.lt'),
    lte: t('ruleBuilder.operator.lte'),
    eq: t('ruleBuilder.operator.eq'),
    neq: t('ruleBuilder.operator.neq')
  };

  return (
    <div className="flex gap-2 items-center">
      <select value={condition.field} onChange={e=>onChange({...condition, field: e.target.value as ConditionField})} className="rounded-md border p-2">
        {fields.map(f=> <option key={f} value={f}>{fieldLabels[f]}</option>)}
      </select>
      <select value={condition.operator} onChange={e=>onChange({...condition, operator: e.target.value as ConditionOperator})} className="rounded-md border p-2">
        {operators.map(o=> <option key={o} value={o}>{operatorLabels[o]}</option>)}
      </select>
      <input className="rounded-md border p-2 flex-1" value={condition.value} onChange={e=>onChange({...condition, value: e.target.value})} />
      <button onClick={onRemove} className="rounded-md bg-rose-600 text-white px-3 py-1">{t('ruleBuilder.conditionRow.remove')}</button>
    </div>
  );
}
