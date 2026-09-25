// src/lib/automationV2/audienceEngine.ts
import { filterSuppressedContacts } from './suppressionEngine';
import { evaluateSegmentAudience, DynamicSegment } from './segmentEngine';

export interface AudienceConfiguration {
  includeLists?: string[];
  excludeLists?: string[];
  includeLabels?: string[];
  excludeLabels?: string[];
  includeSegments?: DynamicSegment[];
}

/**
 * Resolves a raw list of workspace contacts down to the precise subset targeted by the journey audience configuration.
 */
export const resolveAudience = async (
  tenantId: string,
  workspaceId: string,
  rawContacts: any[],
  config: AudienceConfiguration
): Promise<any[]> => {
  // Step 1: Global Suppression Check
  const { allowed } = await filterSuppressedContacts(tenantId, workspaceId, rawContacts);
  let workingSet = allowed;

  // Step 2: Include/Exclude Lists
  if (config.includeLists && config.includeLists.length > 0) {
    workingSet = workingSet.filter(c => 
      c.listIds?.some((id: string) => config.includeLists!.includes(id))
    );
  }
  if (config.excludeLists && config.excludeLists.length > 0) {
    workingSet = workingSet.filter(c => 
      !c.listIds?.some((id: string) => config.excludeLists!.includes(id))
    );
  }

  // Step 3: Include/Exclude Labels
  if (config.includeLabels && config.includeLabels.length > 0) {
    workingSet = workingSet.filter(c => 
      c.tags?.some((label: string) => config.includeLabels!.includes(label))
    );
  }
  if (config.excludeLabels && config.excludeLabels.length > 0) {
    workingSet = workingSet.filter(c => 
      !c.tags?.some((label: string) => config.excludeLabels!.includes(label))
    );
  }

  // Step 4: Include Dynamic Segments (OR logic between segments)
  if (config.includeSegments && config.includeSegments.length > 0) {
    const segmentSets = config.includeSegments.map(seg => evaluateSegmentAudience(workingSet, seg));
    // Flatten and deduplicate
    const combinedIds = new Set<string>();
    const finalSegmentedContacts: any[] = [];
    
    segmentSets.flat().forEach(c => {
      if (!combinedIds.has(c.id)) {
        combinedIds.add(c.id);
        finalSegmentedContacts.push(c);
      }
    });
    
    workingSet = finalSegmentedContacts;
  }

  return workingSet;
};
