import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createGmailService } from '@/lib/services/gmail-service';
import { logError } from '@/lib/error-logger';

/**
 * GET /api/gmail/threads
 * Fetch Gmail threads for authenticated user
 *
 * Security: Service layer enforces user can only access their own threads
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create user-scoped service
    const gmailService = createGmailService(session.user.id);

    const searchParams = request.nextUrl.searchParams;

    // Service handles authorization and validates account ownership
    const result = await gmailService.getThreads({
      accountEmail: searchParams.get('accountEmail') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
      hasUnread:
        searchParams.get('hasUnread') === 'true'
          ? true
          : searchParams.get('hasUnread') === 'false'
            ? false
            : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    void logError('Failed to fetch threads', { error });

    // Don't expose "unauthorized account" errors to prevent account enumeration
    const status =
      error instanceof Error && error.message.includes('Unauthorized') ? 403 : 500;

    return NextResponse.json(
      {
        error: 'Failed to fetch threads',
      },
      { status }
    );
  }
}
