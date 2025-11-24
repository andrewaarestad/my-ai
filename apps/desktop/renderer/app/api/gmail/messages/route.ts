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
    const isRead = searchParams.get('isRead');
    const isStarred = searchParams.get('isStarred');
    const threadId = searchParams.get('threadId');

    if (!accountEmail) {
      return NextResponse.json({ error: 'No email specified' }, { status: 400 });
    }

    // Build where clause
    const where: Prisma.GmailMessageWhereInput = {
      userId: session.user.id,
      accountEmail,
    };

    if (isRead !== null && isRead !== undefined) {
      where.isRead = isRead === 'true';
    }

    if (isStarred !== null && isStarred !== undefined) {
      where.isStarred = isStarred === 'true';
    }

    if (threadId) {
      where.threadId = threadId;
    }

    // Fetch messages
    const messages = await prisma.gmailMessage.findMany({
      where,
      include: {
        attachments: true,
        thread: {
          select: {
            subject: true,
            messageCount: true,
          },
        },
      },
      orderBy: {
        internalDate: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Get total count
    const total = await prisma.gmailMessage.count({ where });

    return NextResponse.json({
      messages,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    void logError('Failed to fetch messages', { error });
    return NextResponse.json(
      {
        error: 'Failed to fetch messages',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
