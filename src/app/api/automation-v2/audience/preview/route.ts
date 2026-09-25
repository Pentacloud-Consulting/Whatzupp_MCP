import { NextResponse } from 'next/server';
import { calculateAudiencePreview } from '@/lib/automationV2/audiencePreview';

// Mock DB Fetch for Sprint 3
const mockFetchContacts = async (workspaceId: string) => {
  return Array.from({ length: 5000 }, (_, i) => ({
    id: `contact-${i}`,
    tags: i % 2 === 0 ? ['VIP'] : ['Lead'],
    listIds: i % 5 === 0 ? ['list-1'] : [],
    dealValue: Math.random() * 20000
  }));
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tenantId, workspaceId, audienceConfig } = body;

    if (!tenantId || !workspaceId) {
      return NextResponse.json({ success: false, error: 'Missing isolation identifiers' }, { status: 400 });
    }

    const rawContacts = await mockFetchContacts(workspaceId);
    
    const preview = await calculateAudiencePreview(tenantId, workspaceId, rawContacts, audienceConfig || {});

    return NextResponse.json({ success: true, data: preview });
  } catch (error: any) {
    console.error('Audience Preview Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
