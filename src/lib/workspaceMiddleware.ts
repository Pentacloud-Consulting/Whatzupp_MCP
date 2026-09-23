import { NextRequest } from 'next/server';
import { workspaceRegistry } from './connectors/workspaceRegistry';
import { Connector } from './connectors/connectorInterface';
import { verifySessionToken, SessionPayload } from './auth';

export interface WorkspaceAuthResult {
  success: boolean;
  status?: number;
  error?: string;
  workspaceId?: string;
  connector?: Connector;
  authenticatedVia?: 'service_key' | 'user_session';
  user?: SessionPayload;
}

/**
 * Validates access to a workspace for incoming requests.
 * Supports service-to-service calls (via X-Workspace-Key header)
 * and user browser calls (via session cookie or authorization header).
 *
 * Returns 401 if unauthenticated, 403 if unauthorized for the requested workspace.
 */
export async function validateWorkspaceAccess(
  request: Request | NextRequest,
  targetWorkspaceId?: string
): Promise<WorkspaceAuthResult> {
  const headers = request.headers;
  const workspaceKey = headers.get('x-workspace-key') || headers.get('X-Workspace-Key');

  // Parse User Session (Always parse this so we have role/tenant context for filtering)
  let token: string | undefined;
  const cookieHeader = headers.get('cookie') || '';
  const sessionMatch = cookieHeader.match(/wz_session=([^;]+)/);
  if (sessionMatch) {
    token = sessionMatch[1];
  }

  if (!token) {
    const authHeader = headers.get('authorization') || headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  let user: SessionPayload | null = null;
  if (token) {
    user = await verifySessionToken(token);
  }

  const isDev = process.env.NODE_ENV !== 'production';
  const devUserHeader = headers.get('x-dev-user-id');
  if (!user && (devUserHeader || isDev)) {
    user = {
      userId: devUserHeader || 'dev-user-1',
      email: 'dev@whatzupp.com',
      fullName: 'Dev User',
      tenantId: null,
      role: 'SUPER_ADMIN',
      workspacePermissions: ['SFMC', 'SALES_CLOUD'],
    };
  }

  // 1. Service-to-service authentication via X-Workspace-Key
  if (workspaceKey) {
    const keyMatch = workspaceRegistry.validateWorkspaceKey(workspaceKey);
    if (!keyMatch) {
      return {
        success: false,
        status: 403,
        error: 'Forbidden: Invalid X-Workspace-Key',
      };
    }

    if (targetWorkspaceId && targetWorkspaceId !== keyMatch.workspaceId) {
      return {
        success: false,
        status: 403,
        error: `Forbidden: Key for workspace ${keyMatch.workspaceId} cannot access ${targetWorkspaceId}`,
      };
    }

    return {
      success: true,
      workspaceId: keyMatch.workspaceId,
      connector: keyMatch.connector,
      authenticatedVia: 'service_key',
      user: user || undefined, // Attach user context even for service keys if they exist in session
    };
  }

  // 2. User session authentication (browser calls)
  if (!user) {
    return {
      success: false,
      status: 401,
      error: 'Unauthorized: Missing authentication header or X-Workspace-Key',
    };
  }

  // Derived workspace from targetWorkspaceId or default to 'sfmc-ws-1'
  const workspaceId = targetWorkspaceId || headers.get('x-workspace-id') || 'sfmc-ws-1';
  const connector = workspaceRegistry.getConnector(workspaceId);

  if (!connector) {
    return {
      success: false,
      status: 403,
      error: `Forbidden: Unknown workspace ${workspaceId}`,
    };
  }

  return {
    success: true,
    workspaceId,
    connector,
    authenticatedVia: 'user_session',
    user,
  };
}
