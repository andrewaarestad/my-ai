import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createGmailClient } from '@/lib/gmail-client';
import { createGmailSyncService } from '@/lib/gmail-sync';
import { logError } from '@/lib/error-logger';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      maxMessages = 100,
      query,
      isInitialSync = false,
      useIncremental = false,
    } = body;

    // Get user's email from session or account
    const accountEmail = session.user.email;
    if (!accountEmail) {
      return NextResponse.json({ error: 'No email found in session' }, { status: 400 });
    }

    // Create Gmail client and sync service
    const gmailClient = await createGmailClient(session.user.id);
    const syncService = await createGmailSyncService(
      session.user.id,
      accountEmail,
      gmailClient
    );

    // Perform sync
    let result;
    if (useIncremental) {
      result = await syncService.incrementalSync();
    } else {
      result = await syncService.syncMessages({
        maxMessages,
        query,
        isInitialSync,
      });
    }

    return NextResponse.json({
      success: true,
      synced: result.synced,
      errors: result.errors,
    });
  } catch (error) {
    logError('Gmail sync API error', { error });
    return NextResponse.json(
      {
        error: 'Failed to sync Gmail messages',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountEmail = session.user.email;
    if (!accountEmail) {
      return NextResponse.json({ error: 'No email found in session' }, { status: 400 });
    }

    // Create Gmail client and sync service to get sync state
    const gmailClient = await createGmailClient(session.user.id);
    const syncService = await createGmailSyncService(
      session.user.id,
      accountEmail,
      gmailClient
    );

    const syncState = await syncService.getSyncState();

    return NextResponse.json({
      syncState: syncState || null,
    });
  } catch (error) {
    logError('Failed to get sync state', { error });
    return NextResponse.json(
      {
        error: 'Failed to get sync state',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
