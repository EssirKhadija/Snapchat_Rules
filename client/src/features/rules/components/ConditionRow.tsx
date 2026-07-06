import { RuleCondition, ConditionField, ConditionOperator } from '../rules.types';

const fields: ConditionField[] = ['spend','ctr','cpa','cpm','roas','conversions','clicks','impressions','status'];
const operators: ConditionOperator[] = ['gt','gte','lt','lte','eq','neq'];

const fieldLabels: Record<ConditionField, string> = {
  spend: 'Dépense',
  ctr: 'CTR',
  cpa: 'CPA',
  cpm: 'CPM',
  roas: 'ROAS',
  conversions: 'Conversions',
  clicks: 'Clics',
  impressions: 'Impressions',
  status: 'Statut'
};

const operatorLabels: Record<ConditionOperator, string> = {
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
  eq: '=',
  neq: '≠'
};

export default function ConditionRow({ condition, onChange, onRemove }: { condition: RuleCondition; onChange: (c: RuleCondition)=>void; onRemove: ()=>void }){
  return (
    <div className="flex gap-2 items-center">
      <select value={condition.field} onChange={e=>onChange({...condition, field: e.target.value as ConditionField})} className="rounded-md border p-2">
        {fields.map(f=> <option key={f} value={f}>{fieldLabels[f]}</option>)}
      </select>
      <select value={condition.operator} onChange={e=>onChange({...condition, operator: e.target.value as ConditionOperator})} className="rounded-md border p-2">
        {operators.map(o=> <option key={o} value={o}>{operatorLabels[o]}</option>)}
      </select>
      <input className="rounded-md border p-2 flex-1" value={condition.value} onChange={e=>onChange({...condition, value: e.target.value})} />
      <button onClick={onRemove} className="rounded-md bg-rose-600 text-white px-3 py-1">Suppr</button>
    </div>
  );
}
