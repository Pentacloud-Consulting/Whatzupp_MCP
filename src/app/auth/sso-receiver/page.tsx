'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function SSOReceiverPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Initializing Secure Connection...');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // In production, we should validate event.origin against allowed Salesforce domains
      if (!event.data || event.data.type !== 'SSO_LOGIN' || !event.data.jwt) {
        return;
      }

      setStatus('Authenticating with WhatZupp...');
      try {
        const res = await fetch('/api/auth/sso', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            jwt: event.data.jwt,
            context: event.data.context 
          })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setStatus('Authentication successful. Loading Workspace...');
          
          // Redirect to the root app. Pass context via URL hash or search params.
          // Example: /?phone=919952374972
          let redirectUrl = '/';
          if (data.context) {
            try {
              const parsedContext = JSON.parse(data.context);
              const params = new URLSearchParams();
              if (parsedContext.phone) params.append('phone', parsedContext.phone);
              if (parsedContext.recordId) params.append('recordId', parsedContext.recordId);
              if (parsedContext.objectType) params.append('objectType', parsedContext.objectType);
              
              if (params.toString()) {
                redirectUrl += `?${params.toString()}`;
              }
            } catch (e) {
              console.error('Failed to parse SSO context', e);
            }
          }
          
          router.replace(redirectUrl);
        } else {
          setError(data.error || 'Authentication failed. Please contact your administrator.');
          setStatus('');
        }
      } catch (err: any) {
        setError('Network error during authentication.');
        setStatus('');
      }
    };

    window.addEventListener('message', handleMessage);

    // Tell parent (Salesforce) we are ready to receive the JWT
    window.parent.postMessage({ type: 'SSO_RECEIVER_READY' }, '*');

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#F8FAFC]">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#00C853] via-[#00E676] to-[#052E2B] flex items-center justify-center shadow-lg shadow-emerald-950/20">
          <span className="text-white font-black text-3xl italic tracking-tighter drop-shadow-sm select-none">w</span>
        </div>
        
        {status && (
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="w-6 h-6 text-[#25D366] animate-spin" />
            <p className="text-sm font-semibold text-slate-700 animate-pulse">{status}</p>
          </div>
        )}

        {error && (
          <div className="max-w-md p-4 bg-rose-50 border border-rose-200 rounded-xl text-center">
            <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-rose-800 mb-1">Access Denied</h3>
            <p className="text-xs text-rose-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
