import api from '../../shared/lib/api';
import { RuleDTO } from './rules.types';

export async function createRule(payload: RuleDTO) {
  // placeholder - backend endpoint not implemented yet
  try {
    const res = await api.post('/rules', payload).catch(() => null);
    return res?.data ?? { ...payload, id: 'local-' + Date.now() };
  } catch (e) {
    throw e;
  }
}

export async function fetchRules() {
  const res = await api.get('/rules').catch(() => null);
  return res?.data ?? [];
}
