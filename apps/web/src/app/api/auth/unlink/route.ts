import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * DELETE /api/auth/unlink
 *
 * Disconnects a linked OAuth account from the current user.
 * Prevents unlinking the last account (user must keep at least one to sign in).
 */
export async function DELETE(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { provider, providerAccountId } = (await request.json()) as {
    provider?: string;
    providerAccountId?: string;
  };

  if (!provider || !providerAccountId) {
    return NextResponse.json(
      { error: "provider and providerAccountId are required" },
      { status: 400 }
    );
  }

  // Verify the account belongs to this user
  const account = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: { provider, providerAccountId },
    },
  });

  if (!account || account.userId !== session.user.id) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  // Prevent unlinking the last account
  const accountCount = await prisma.account.count({
    where: { userId: session.user.id },
  });

  if (accountCount <= 1) {
    return NextResponse.json(
      { error: "Cannot disconnect your only linked account. You need at least one account to sign in." },
      { status: 400 }
    );
  }

  await prisma.account.delete({
    where: {
      provider_providerAccountId: { provider, providerAccountId },
    },
  });

  return NextResponse.json({ success: true });
}
