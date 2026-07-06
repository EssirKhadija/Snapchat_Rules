import { RuleAction } from '../rules.types';

const actionLabels: Record<string,string> = {
  pause_campaign: 'Pause Campaign',
  resume_campaign: 'Resume Campaign',
  increase_budget: 'Increase Budget',
  decrease_budget: 'Decrease Budget',
  send_notification: 'Send Notification',
  enable_rule: 'Enable Rule',
  disable_rule: 'Disable Rule'
};

export default function ActionRow({ action, onChange, onRemove }: { action: RuleAction; onChange: (a: RuleAction)=>void; onRemove: ()=>void }){
  const paramsValue = action.params && Object.keys(action.params).length ? JSON.stringify(action.params) : '';

  return (
    <div className="flex gap-2 items-center">
      <select value={action.type} onChange={e=>onChange({...action, type: e.target.value as any})} className="rounded-md border p-2">
        {Object.keys(actionLabels).map(k=> <option key={k} value={k}>{actionLabels[k]}</option>)}
      </select>
      <input className="rounded-md border p-2 flex-1" placeholder="Paramètres (optionnel) JSON" value={paramsValue} onChange={e=>{
        let params = undefined;
        try{ params = e.target.value ? JSON.parse(e.target.value) : undefined }catch(e){ params = action.params }
        onChange({...action, params});
      }} />
      <button onClick={onRemove} className="rounded-md bg-rose-600 text-white px-3 py-1">Suppr</button>
    </div>
  );
}
