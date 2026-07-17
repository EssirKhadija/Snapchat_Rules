import { RuleAction } from '../rules.types';
import { useTranslation } from '../../../shared/lib/i18n';

export default function ActionRow({ action, onChange, onRemove }: { action: RuleAction; onChange: (a: RuleAction)=>void; onRemove: ()=>void }){
  const { t } = useTranslation();
  const paramsValue = action.params && Object.keys(action.params).length ? JSON.stringify(action.params) : '';

  const actionLabels: Record<string,string> = {
    pause_campaign: t('ruleBuilder.action.pause_campaign'),
    resume_campaign: t('ruleBuilder.action.resume_campaign'),
    increase_budget: t('ruleBuilder.action.increase_budget'),
    decrease_budget: t('ruleBuilder.action.decrease_budget'),
    send_notification: t('ruleBuilder.action.send_notification'),
    enable_rule: t('ruleBuilder.action.enable_rule'),
    disable_rule: t('ruleBuilder.action.disable_rule')
  };

  return (
    <div className="flex gap-2 items-center">
      <select value={action.type} onChange={e=>onChange({...action, type: e.target.value as any})} className="rounded-md border p-2">
        {Object.keys(actionLabels).map(k=> <option key={k} value={k}>{actionLabels[k]}</option>)}
      </select>
      <input className="rounded-md border p-2 flex-1" placeholder={t('ruleModal.placeholder.params')} value={paramsValue} onChange={e=>{
        let params = undefined;
        try{ params = e.target.value ? JSON.parse(e.target.value) : undefined }catch(e){ params = action.params }
        onChange({...action, params});
      }} />
      <button onClick={onRemove} className="rounded-md bg-rose-600 text-white px-3 py-1">{t('ruleBuilder.conditionRow.remove')}</button>
    </div>
  );
}
