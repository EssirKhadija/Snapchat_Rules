import api from '../../../shared/lib/api';
import { CampaignTemplate, BulkRow } from './launch.types';

const TEMPLATES_KEY = 'snaprules_templates';

export function getTemplates(): CampaignTemplate[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveTemplate(template: CampaignTemplate): void {
  const templates = getTemplates();
  const existing = templates.findIndex(t => t.id === template.id);
  if (existing >= 0) templates[existing] = template;
  else templates.push(template);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

export function deleteTemplate(id: string): void {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(getTemplates().filter(t => t.id !== id)));
}

export async function launchSingleCampaign(
  template: CampaignTemplate,
  row: BulkRow
): Promise<{ campaignId: string }> {
  // Si le client a uploadé un fichier → multipart/form-data
  if (row.creativeFile) {
    const formData = new FormData();
    formData.append('file', row.creativeFile);
    formData.append('template', JSON.stringify(template));
    formData.append('row', JSON.stringify({ ...row, creativeFile: undefined, creativePreview: undefined }));
    const response = await api.post('/campaigns/bulk-launch', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  // Sinon → JSON avec URL
  const response = await api.post('/campaigns/bulk-launch', {
    template,
    row: { ...row, creativeFile: undefined, creativePreview: undefined },
  });
  return response.data;
}