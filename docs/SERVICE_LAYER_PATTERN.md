# Service Layer Authorization Pattern

## Principle

**All database queries for user-scoped data MUST go through service factories.**

This pattern provides **defense in depth** against authorization bugs by enforcing user-scoping at the service layer rather than relying on individual API routes to correctly filter by `userId`.

## Rules

1. ✅ **DO**: Create services that extend `UserScopedService`
2. ✅ **DO**: Use factory functions to create service instances
3. ✅ **DO**: Always use `enforceUserScope()` in where clauses
4. ✅ **DO**: Use `getUserId()` when inserting data
5. ❌ **DON'T**: Query Prisma directly from API routes for user data
6. ❌ **DON'T**: Expose services without factory functions
7. ❌ **DON'T**: Bypass `enforceUserScope()` by manually adding `userId`

## Architecture

```
┌─────────────────┐
│   API Route     │  ← HTTP request handling only
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ Service Factory     │ ← Creates instance scoped to userId
│ createXxxService()  │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ UserScopedService   │ ← Enforces userId in ALL queries
│ + enforceUserScope()│
│ + getUserId()       │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Database (Prisma)   │
└─────────────────────┘
```

## Example: Creating a New Service

```typescript
// apps/web/src/lib/services/my-service.ts

import { UserScopedService } from './base-service';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export class MyService extends UserScopedService {
  /**
   * Get items for this user only
   */
  async getItems(options: { status?: string }) {
    // enforceUserScope() adds userId to where clause
    const where: Prisma.MyModelWhereInput = this.enforceUserScope({
      status: options.status,
    });
    // Results in: { userId: 'user123', status: 'active' }

    return prisma.myModel.findMany({ where });
  }

  /**
   * Create item for this user
   */
  async createItem(data: { name: string }) {
    return prisma.myModel.create({
      data: {
        name: data.name,
        userId: this.getUserId(), // Use getUserId() for inserts
      },
    });
  }

  /**
   * Update item (enforces user owns it)
   */
  async updateItem(itemId: string, data: { name: string }) {
    // updateMany with enforceUserScope() ensures user owns the item
    const updated = await prisma.myModel.updateMany({
      where: this.enforceUserScope({ id: itemId }),
      data,
    });

    if (updated.count === 0) {
      throw new Error('Item not found or unauthorized');
    }

    return this.getItem(itemId);
  }

  /**
   * Delete item (enforces user owns it)
   */
  async deleteItem(itemId: string) {
    const deleted = await prisma.myModel.deleteMany({
      where: this.enforceUserScope({ id: itemId }),
    });

    if (deleted.count === 0) {
      throw new Error('Item not found or unauthorized');
    }
  }

  private async getItem(itemId: string) {
    const item = await prisma.myModel.findFirst({
      where: this.enforceUserScope({ id: itemId }),
    });

    if (!item) {
      throw new Error('Item not found');
    }

    return item;
  }
}

/**
 * Factory function - ONLY way to create service instance
 */
export function createMyService(userId: string): MyService {
  return new MyService(userId);
}
```

## Example: Using Service in API Route

```typescript
// apps/web/src/app/api/my-endpoint/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createMyService } from '@/lib/services/my-service';

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ✅ CORRECT: Use service factory
  const myService = createMyService(session.user.id);
  const items = await myService.getItems({ status: 'active' });

  return NextResponse.json({ items });
}

// ❌ WRONG: Direct Prisma query
// const items = await prisma.myModel.findMany({
//   where: { userId: session.user.id, status: 'active' }
// });
```

## Security Benefits

### 1. **Centralized Authorization**
- Authorization logic in ONE place (service layer)
- Easier to audit and test
- Impossible to forget `userId` filter

### 2. **Future-Proof**
- New endpoints automatically inherit authorization
- Refactoring doesn't break security
- New developers can't introduce bugs

### 3. **Type Safety**
- TypeScript enforces use of `enforceUserScope()`
- Compiler catches missing filters
- ESLint rules prevent direct Prisma imports

### 4. **Defense in Depth**
- Database has FK constraints (first layer)
- Service enforces scoping (second layer)
- API routes verify session (third layer)

## Common Patterns

### Pattern: Verifying Account Ownership

```typescript
export class GmailService extends UserScopedService {
  async getMessages(options: { accountEmail?: string }) {
    const where = this.enforceUserScope({});

    // Verify user owns the account before filtering
    if (options.accountEmail) {
      const isOwned = await this.verifyUserOwnsAccount(options.accountEmail);
      if (!isOwned) {
        throw new Error('Unauthorized: Account does not belong to this user');
      }
      where.accountEmail = options.accountEmail;
    }

    return prisma.gmailMessage.findMany({ where });
  }

  private async verifyUserOwnsAccount(email: string): Promise<boolean> {
    const account = await prisma.account.findFirst({
      where: this.enforceUserScope({ /* ... */ }),
      include: { user: { select: { email: true } } },
    });

    return account?.user.email === email;
  }
}
```

### Pattern: Aggregations

```typescript
async getStats() {
  return prisma.myModel.aggregate({
    where: this.enforceUserScope({}),
    _count: { id: true },
    _sum: { amount: true },
  });
}
```

### Pattern: Transactions

```typescript
async transferItem(itemId: string, toUserId: string) {
  // All queries in transaction use enforceUserScope()
  return prisma.$transaction(async (tx) => {
    const item = await tx.myModel.findFirst({
      where: this.enforceUserScope({ id: itemId }),
    });

    if (!item) {
      throw new Error('Item not found or unauthorized');
    }

    await tx.myModel.update({
      where: { id: itemId },
      data: { userId: toUserId },
    });
  });
}
```

## Testing

### Unit Test: Service Authorization

```typescript
describe('MyService', () => {
  it('should only return user-scoped data', async () => {
    // Create test data for two users
    await prisma.myModel.create({ data: { userId: 'user1', name: 'Item 1' } });
    await prisma.myModel.create({ data: { userId: 'user2', name: 'Item 2' } });

    // Create service for user1
    const service = createMyService('user1');
    const items = await service.getItems({});

    // Should only return user1's items
    expect(items).toHaveLength(1);
    expect(items[0].userId).toBe('user1');
  });

  it('should reject empty userId', () => {
    expect(() => createMyService('')).toThrow('requires a non-empty userId');
  });

  it('should prevent cross-user access', async () => {
    await prisma.myModel.create({ data: { userId: 'user1', id: 'item1', name: 'Item' } });

    const user2Service = createMyService('user2');

    // user2 tries to access user1's item
    await expect(user2Service.updateItem('item1', { name: 'Hacked' }))
      .rejects.toThrow('not found or unauthorized');
  });
});
```

## Migration Guide

### Migrating Existing Routes

**Before (Vulnerable):**
```typescript
export async function GET(request: NextRequest) {
  const session = await auth();
  const accountEmail = searchParams.get('accountEmail'); // ⚠️ No validation!

  const messages = await prisma.gmailMessage.findMany({
    where: {
      userId: session.user.id,
      accountEmail, // ⚠️ User can access any account!
    },
  });

  return NextResponse.json({ messages });
}
```

**After (Secure):**
```typescript
export async function GET(request: NextRequest) {
  const session = await auth();
  const gmailService = createGmailService(session.user.id);

  const result = await gmailService.getMessages({
    accountEmail: searchParams.get('accountEmail') || undefined,
  });
  // Service validates ownership ✅

  return NextResponse.json(result);
}
```

## ESLint Configuration

Prevent direct Prisma imports in routes:

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@/lib/prisma'],
            message: 'Use service layer instead of direct Prisma access',
          },
        ],
      },
    ],
  },
  overrides: [
    {
      // Allow Prisma in service files only
      files: ['**/services/**/*.ts', '**/lib/prisma.ts'],
      rules: {
        'no-restricted-imports': 'off',
      },
    },
  ],
};
```

## FAQ

**Q: What if I need to query across multiple users (admin feature)?**
A: Create a separate admin service that doesn't extend `UserScopedService`. Document it clearly and add additional authorization checks.

**Q: Can I use raw SQL queries?**
A: Avoid if possible. If necessary, manually add `WHERE user_id = $1` and pass `this.getUserId()`. Better to use Prisma's type-safe queries.

**Q: How do I handle public data (not user-scoped)?**
A: Don't use `UserScopedService` for public data. Create regular services without user scoping.

**Q: What about background jobs/cron?**
A: Cron jobs should iterate over users and create a service instance for each user, ensuring proper scoping.

## Related Documentation

- [Security Audit Report](../SECURITY_AUDIT.md)
- [API Route Guidelines](../API_GUIDELINES.md)
- [Testing Strategy](../TESTING.md)

---

**Last Updated:** 2025-01-XX
**Author:** Security Team
**Status:** Active Pattern
