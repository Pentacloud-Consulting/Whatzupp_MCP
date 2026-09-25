// src/app/api/conversation-flows/[flowId]/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Shared in-memory store reference (in production, this would be Salesforce/SFMC)
// For now, we import from the parent route's store via a shared module pattern
// In dev, we use a simple fetch-back pattern

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ flowId: string }> }
) {
  try {
    const { flowId } = await params;
    // Fetch from parent route and filter
    const baseUrl = new URL(req.url).origin;
    const res = await fetch(`${baseUrl}/api/conversation-flows`, {
      headers: Object.fromEntries(req.headers),
    });
    const data = await res.json();
    const flow = data.flows?.find((f: any) => f.id === flowId);

    if (!flow) {
      return NextResponse.json({ error: 'Flow not found' }, { status: 404 });
    }

    return NextResponse.json({ flow });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ flowId: string }> }
) {
  try {
    const { flowId } = await params;
    const body = await req.json();
    // In production, update in Salesforce/SFMC
    return NextResponse.json({ flow: { ...body, id: flowId, updatedAt: new Date().toISOString() } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ flowId: string }> }
) {
  try {
    const { flowId } = await params;
    return NextResponse.json({ success: true, deletedId: flowId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
