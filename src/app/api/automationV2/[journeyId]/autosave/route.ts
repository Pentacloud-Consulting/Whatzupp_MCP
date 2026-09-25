import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { journeyId: string } }
) {
  try {
    const journeyId = params.journeyId;
    const body = await req.json();

    // In a real application, save `body` to the database for this journey ID.
    // For now, we just mock the success to clear the console error.
    console.log(`[API] Auto-saved journey: ${journeyId}`);

    return NextResponse.json({ success: true, journeyId });
  } catch (error: any) {
    console.error('[API] Auto-save error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
