// src/lib/automationV2/audiencePreview.ts
import { AudienceConfiguration, resolveAudience } from './audienceEngine';
import { filterSuppressedContacts } from './suppressionEngine';

export interface AudiencePreviewResult {
  totalRawContacts: number;
  totalSuppressed: number;
  totalExcludedByRules: number;
  finalAudienceSize: number;
}

/**
 * Calculates audience metrics for the pre-publish Validation & Prediction UI.
 */
export const calculateAudiencePreview = async (
  tenantId: string,
  workspaceId: string,
  rawContacts: any[],
  config: AudienceConfiguration
): Promise<AudiencePreviewResult> => {
  
  const totalRawContacts = rawContacts.length;

  // Track suppressions
  const { suppressed } = await filterSuppressedContacts(tenantId, workspaceId, rawContacts);
  const totalSuppressed = suppressed.length;

  // Track final allowed
  const finalContacts = await resolveAudience(tenantId, workspaceId, rawContacts, config);
  const finalAudienceSize = finalContacts.length;

  const totalExcludedByRules = totalRawContacts - totalSuppressed - finalAudienceSize;

  return {
    totalRawContacts,
    totalSuppressed,
    totalExcludedByRules,
    finalAudienceSize
  };
};
