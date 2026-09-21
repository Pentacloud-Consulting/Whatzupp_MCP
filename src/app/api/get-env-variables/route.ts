//src\app\api\get-env-variables\route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    let accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    let phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    let verificationToken = process.env.WHATSAPP_VERIFY_TOKEN || 'Pentacloud@123';

    // In development mode, force reading from .env.local to bypass process.env cache 
    // so we don't have to restart npm run dev when tokens change.
    if (process.env.NODE_ENV !== 'production') {
      try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, 'utf8');
          const lines = envContent.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
            const [key, ...rest] = trimmed.split('=');
            let val = rest.join('=').trim();
            // Strip surrounding double quotes if present (e.g., WHATSAPP_ACCESS_TOKEN="EAG...")
            if (val.startsWith('"') && val.endsWith('"')) {
              val = val.slice(1, -1);
            }
            if (key === 'WHATSAPP_ACCESS_TOKEN') accessToken = val;
            if (key === 'WHATSAPP_PHONE_NUMBER_ID') phoneNumberId = val;
            if (key === 'WHATSAPP_VERIFY_TOKEN') verificationToken = val;
          }
        }
      } catch (e) {
        console.warn('Could not forcefully read .env.local', e);
      }
    }

    return NextResponse.json({
      accessToken,
      phoneNumberId,
      verificationToken,
    });
  } catch (error) {
    console.error('Error fetching environment variables:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}