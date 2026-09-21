import { useState, useEffect, useRef } from 'react';
import { Contact, Message } from '@/types';

export function useRealtimeMessages(selectedContact: Contact | null, workspaceId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  // Track which contact the current messages belong to
  const currentPhoneRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedContact) {
      setMessages([]);
      currentPhoneRef.current = null;
      return;
    }

    const normalizedPhone = selectedContact.phoneNumber.replace(/^\+/, '');

    // CRITICAL: Reset messages immediately when switching contacts
    // This prevents stale messages from being shown under the wrong contact
    if (currentPhoneRef.current !== normalizedPhone) {
      setMessages([]);
      currentPhoneRef.current = normalizedPhone;
    }

    // Initial fetch from conversation messages API (works for Sales Cloud & SFMC)
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/conversations/${normalizedPhone}/messages?workspaceId=${workspaceId}`);
        const data = await response.json();
        
        if (currentPhoneRef.current === normalizedPhone && data.messages && Array.isArray(data.messages)) {
          const contactMessages = data.messages
            .map((msg: any) => ({
              id: msg.id,
              content: msg.content || msg.body,
              timestamp: msg.timestamp,
              sender: msg.sender || (msg.direction === 'sent' || msg.direction === 'OUTBOUND' ? 'user' : 'contact'),
              status: msg.status || 'sent',
              recipientId: normalizedPhone,
              mediaType: msg.mediaType,
              mediaId: msg.mediaId,
              mediaUrl: msg.mediaUrl,
            }))
            .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

          setMessages(contactMessages);
        }
      } catch (error) {
        console.error('Error fetching conversation messages:', error);
      }
    };

    // Create an EventSource for real-time updates with LIMITED reconnection
    // SSE only works when webhook and browser are in the same process (local dev only).
    // On Vercel-deployed webhooks, SSE won't deliver messages — polling is the primary mechanism.
    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempts = 0;
    const MAX_SSE_RECONNECTS = 3; // Stop after 3 failures to avoid console spam
    let isCancelled = false;
    let sseGaveUp = false;

    const connectSSE = () => {
      if (isCancelled || sseGaveUp) return;

      eventSource = new EventSource(`/api/messages/stream?phoneNumber=${normalizedPhone}&workspaceId=${workspaceId}`);

      eventSource.onopen = () => {
        reconnectAttempts = 0; // Reset on successful connection
      };

      eventSource.onmessage = (event) => {
        try {
          const newMessage = JSON.parse(event.data);
          // Only process if still viewing the same contact
          if (currentPhoneRef.current !== normalizedPhone) return;

          setMessages(prevMessages => {
            const index = prevMessages.findIndex(msg => msg.id === newMessage.id || (newMessage.localId && msg.id === newMessage.localId));
            if (index !== -1) {
              // Update existing message (e.g., status change, and swap localId for true id)
              const updated = [...prevMessages];
              updated[index] = { ...updated[index], ...newMessage, id: newMessage.id };
              return updated;
            }
            // Add new message
            return [...prevMessages, newMessage];
          });
        } catch (err) {
          console.error('[useRealtimeMessages] SSE parse error:', err);
        }
      };

      eventSource.onerror = () => {
        if (isCancelled) return;
        eventSource?.close();

        reconnectAttempts++;
        if (reconnectAttempts > MAX_SSE_RECONNECTS) {
          // Stop trying SSE — polling will handle message delivery
          sseGaveUp = true;
          console.log(`[useRealtimeMessages] SSE unavailable for ${normalizedPhone} after ${MAX_SSE_RECONNECTS} attempts. Relying on polling.`);
          return;
        }

        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 4000);
        console.warn(`[useRealtimeMessages] SSE error for ${normalizedPhone}, reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${MAX_SSE_RECONNECTS})...`);
        reconnectTimer = setTimeout(connectSSE, delay);
      };
    };

    // Polling fallback: PRIMARY mechanism for receiving messages when webhook runs on Vercel.
    // Polls Salesforce/SFMC directly for new messages.
    const pollMessages = async () => {
      if (isCancelled) return;
      try {
        const response = await fetch(`/api/conversations/${normalizedPhone}/messages?workspaceId=${workspaceId}`);
        const data = await response.json();
        
        if (currentPhoneRef.current === normalizedPhone && data.messages && Array.isArray(data.messages)) {
          const fetchedContactMessages = data.messages
            .map((msg: any) => ({
              id: msg.id,
              content: msg.content || msg.body,
              timestamp: msg.timestamp,
              sender: msg.sender || (msg.direction === 'sent' || msg.direction === 'OUTBOUND' ? 'user' : 'contact'),
              status: msg.status || 'sent',
              recipientId: normalizedPhone,
              mediaType: msg.mediaType,
              mediaId: msg.mediaId,
              mediaUrl: msg.mediaUrl,
            }));

          setMessages(prev => {
            const newMessages = [...prev];
            let changed = false;
            
            fetchedContactMessages.forEach((fetchedMsg: Message) => {
              const exists = newMessages.findIndex(m => m.id === fetchedMsg.id || ((fetchedMsg as any).localId && m.id === (fetchedMsg as any).localId));
              if (exists === -1) {
                newMessages.push(fetchedMsg);
                changed = true;
              } else if (newMessages[exists].status !== fetchedMsg.status) {
                newMessages[exists] = { ...newMessages[exists], status: fetchedMsg.status };
                changed = true;
              }
            });
            
            if (changed) {
              return newMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            }
            return prev;
          });
        }
      } catch (error) {
        console.error('[useRealtimeMessages] Polling error:', error);
      }
    };

    // Poll every 3 seconds (primary mechanism for received messages)
    let pollInterval = setInterval(pollMessages, 3000);

    fetchMessages();
    connectSSE();

    return () => {
      isCancelled = true;
      eventSource?.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [selectedContact, workspaceId]);

  return { messages, phoneNumber: currentPhoneRef.current };
}