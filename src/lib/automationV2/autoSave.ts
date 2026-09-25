import { AutomationV2 } from './schema';

let saveTimeout: NodeJS.Timeout | null = null;
const AUTO_SAVE_INTERVAL_MS = 30000;

export const autoSaveJourney = async (
  journey: AutomationV2, 
  onSaveSuccess?: () => void,
  onSaveError?: (err: Error) => void
) => {
  try {
    const res = await fetch(`/api/automationV2/${journey.id}/autosave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(journey)
    });
    
    if (!res.ok) throw new Error('Failed to auto-save');
    if (onSaveSuccess) onSaveSuccess();
  } catch (error: any) {
    console.error('[AutoSave] Error saving journey:', error);
    if (onSaveError) onSaveError(error);
  }
};

export const queueAutoSave = (
  journey: AutomationV2,
  onSaveSuccess?: () => void,
  onSaveError?: (err: Error) => void
) => {
  if (saveTimeout) clearTimeout(saveTimeout);
  
  saveTimeout = setTimeout(() => {
    autoSaveJourney(journey, onSaveSuccess, onSaveError);
  }, AUTO_SAVE_INTERVAL_MS);
};

export const triggerImmediateSave = (
  journey: AutomationV2,
  onSaveSuccess?: () => void,
  onSaveError?: (err: Error) => void
) => {
  if (saveTimeout) clearTimeout(saveTimeout);
  autoSaveJourney(journey, onSaveSuccess, onSaveError);
};
