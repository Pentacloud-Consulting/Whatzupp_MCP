import { NextResponse } from 'next/server';
import { fetchSegmentsForWorkspace, DynamicSegment } from '@/lib/automationV2/segmentEngine';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const workspaceId = searchParams.get('workspaceId');

    if (!tenantId || !workspaceId) {
      return NextResponse.json({ success: false, error: 'Missing isolation identifiers' }, { status: 400 });
    }

    const segments = await fetchSegmentsForWorkspace(tenantId, workspaceId);
    return NextResponse.json({ success: true, data: segments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tenantId, workspaceId, name, description, filters } = body;

    if (!tenantId || !workspaceId || !name || !filters) {
      return NextResponse.json({ success: false, error: 'Missing required segment fields' }, { status: 400 });
    }

    // Mock DB Creation for Sprint 3
    const newSegment: DynamicSegment = {
      id: `seg-${uuidv4()}`,
      tenantId,
      workspaceId,
      name,
      description: description || '',
      filters,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({ success: true, data: newSegment });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
