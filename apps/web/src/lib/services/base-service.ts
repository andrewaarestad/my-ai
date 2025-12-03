/**
 * Base Service Class for User-Scoped Data Access
 *
 * All services that access user-scoped data MUST extend this class.
 * This enforces authorization at the service layer, preventing
 * accidental cross-user data access.
 *
 * Security principle: Defense in depth
 * - All queries automatically include userId filter
 * - Services are created through factory functions (enforced via eslint)
 * - Type system prevents bypassing scoping
 *
 * @example
 * ```typescript
 * class MyService extends UserScopedService {
 *   async getData() {
 *     return prisma.myModel.findMany({
 *       where: this.enforceUserScope({ status: 'active' })
 *     });
 *   }
 * }
 *
 * export function createMyService(userId: string) {
 *   return new MyService(userId);
 * }
 * ```
 */

/**
 * Base service class that enforces user-scoped queries
 * All services must extend this to ensure authorization
 */
export abstract class UserScopedService {
  /**
   * Create a user-scoped service
   * @param userId - The user ID to scope all queries to
   * @throws Error if userId is empty or undefined
   */
  constructor(protected readonly userId: string) {
    if (!userId || userId.trim() === '') {
      throw new Error(
        'UserScopedService requires a non-empty userId. ' +
        'This error indicates a critical authorization bug.'
      );
    }
  }

  /**
   * Get the userId this service is scoped to
   * Protected - only accessible within service classes
   */
  protected getUserId(): string {
    return this.userId;
  }

  /**
   * Enforce userId in where clause
   * Prevents accidental queries without user filtering
   *
   * @param where - The where clause to add userId to
   * @returns Where clause with userId enforced
   *
   * @example
   * ```typescript
   * // Instead of:
   * prisma.message.findMany({ where: { isRead: false } })
   *
   * // Always use:
   * prisma.message.findMany({
   *   where: this.enforceUserScope({ isRead: false })
   * })
   * // Results in: { userId: '123', isRead: false }
   * ```
   */
  protected enforceUserScope<T extends Record<string, unknown>>(
    where: T
  ): T & { userId: string } {
    // If userId already in where clause, verify it matches
    if ('userId' in where && where.userId !== this.userId) {
      throw new Error(
        `Authorization error: Attempted to query with different userId. ` +
        `Service scoped to ${this.userId}, query attempted for ${where.userId}`
      );
    }

    return {
      ...where,
      userId: this.userId,
    };
  }

  /**
   * Verify the service is scoped to the expected user
   * Useful for debugging and assertions
   */
  protected assertUserId(expectedUserId: string): void {
    if (this.userId !== expectedUserId) {
      throw new Error(
        `Authorization mismatch: Service scoped to ${this.userId}, ` +
        `but operation expected ${expectedUserId}`
      );
    }
  }
}
