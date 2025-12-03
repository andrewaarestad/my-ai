import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createGmailClient } from '@/lib/gmail-client';
import { createGmailSyncService } from '@/lib/gmail-sync';
import { logError } from '@/lib/error-logger';

// This endpoint should be called by a cron job (e.g., Vercel Cron)
// It will sync emails for all users who have Gmail connected

export async function GET(request: NextRequest) {
  try {
    // Verify the request is authorized (check for cron secret)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // CRON_SECRET is required (enforced by env validation)
    if (!cronSecret) {
      throw new Error('CRON_SECRET environment variable is not set');
    }

    // Verify Authorization header is present and correct
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all users with Google accounts
    const accounts = await prisma.account.findMany({
      where: {
        provider: 'google',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    const results = [];

    for (const account of accounts) {
      try {
        const userId = account.userId;
        const accountEmail = account.user.email;

        if (!accountEmail) {
          continue;
        }

        // Create Gmail client and sync service
        const gmailClient = createGmailClient(userId);
        const syncService = createGmailSyncService(
          userId,
          accountEmail,
          gmailClient
        );

        // Use incremental sync for efficiency
        const result = await syncService.incrementalSync();

        results.push({
          userId,
          accountEmail,
          synced: result.synced,
          errors: result.errors,
        });
      } catch (error) {
        void logError('Failed to sync for user', {
          userId: account.userId,
          error,
        });
        results.push({
          userId: account.userId,
          accountEmail: account.user.email,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    void logError('Cron job failed', { error });
    return NextResponse.json(
      {
        error: 'Cron job failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
