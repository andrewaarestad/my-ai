import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { logError } from '@/lib/error-logger';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const accountEmail = searchParams.get('accountEmail') || session.user.email;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const hasUnread = searchParams.get('hasUnread');

    if (!accountEmail) {
      return NextResponse.json({ error: 'No email specified' }, { status: 400 });
    }

    // Build where clause
    const where: Prisma.GmailThreadWhereInput = {
      userId: session.user.id,
      accountEmail,
    };

    if (hasUnread !== null && hasUnread !== undefined) {
      where.hasUnread = hasUnread === 'true';
    }

    // Fetch threads
    const threads = await prisma.gmailThread.findMany({
      where,
      include: {
        messages: {
          orderBy: {
            internalDate: 'desc',
          },
          take: 1, // Just get the latest message for preview
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        lastMessageDate: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Get total count
    const total = await prisma.gmailThread.count({ where });

    return NextResponse.json({
      threads,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    void logError('Failed to fetch threads', { error });
    return NextResponse.json(
      {
        error: 'Failed to fetch threads',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
