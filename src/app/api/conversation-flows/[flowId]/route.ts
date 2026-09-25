// src/app/api/conversation-flows/[flowId]/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Shared in-memory store reference (in production, this would be Salesforce/SFMC)
// For now, we import from the parent route's store via a shared module pattern
// In dev, we use a simple fetch-back pattern

export async function GET(
  req: NextRequest,
  { params }: { params: { flowId: string } }
) {
  try {
    // Fetch from parent route and filter
    const baseUrl = new URL(req.url).origin;
    const res = await fetch(`${baseUrl}/api/conversation-flows`, {
      headers: Object.fromEntries(req.headers),
    });
    const data = await res.json();
    const flow = data.flows?.find((f: any) => f.id === params.flowId);

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
  { params }: { params: { flowId: string } }
) {
  try {
    const body = await req.json();
    // In production, update in Salesforce/SFMC
    return NextResponse.json({ flow: { ...body, id: params.flowId, updatedAt: new Date().toISOString() } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { flowId: string } }
) {
  try {
    return NextResponse.json({ success: true, deletedId: params.flowId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
