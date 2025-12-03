import { NextRequest, NextResponse } from 'next/server';
import { z, ZodSchema } from 'zod';
import { auth } from '@/lib/auth';
import { logError } from '@/lib/error-logger';
import { ApiError, UnauthorizedError } from './errors';

/**
 * Route handler context
 */
export interface RouteContext {
  userId: string;
  params?: Record<string, string>;
}

/**
 * Route handler options
 */
export interface RouteHandlerOptions<TBody = unknown, TQuery = unknown> {
  requireAuth?: boolean;
  bodySchema?: ZodSchema<TBody>;
  querySchema?: ZodSchema<TQuery>;
}

/**
 * Validated request data
 */
export interface ValidatedRequest<TBody = unknown, TQuery = unknown> {
  body?: TBody;
  query?: TQuery;
  context: RouteContext;
}

/**
 * Route handler function type
 */
export type RouteHandler<TBody = unknown, TQuery = unknown, TResponse = unknown> = (
  req: ValidatedRequest<TBody, TQuery>
) => Promise<TResponse>;

/**
 * Creates a type-safe, validated API route handler with minimal boilerplate
 *
 * @example
 * ```ts
 * export const POST = createRouteHandler({
 *   bodySchema: CreateTaskDto,
 *   requireAuth: true,
 * }, async ({ body, context }) => {
 *   const service = createTaskListService(context.userId);
 *   const task = await service.createTask(body.text);
 *   return { success: true, task };
 * });
 * ```
 */
export function createRouteHandler<TBody = unknown, TQuery = unknown, TResponse = unknown>(
  options: RouteHandlerOptions<TBody, TQuery>,
  handler: RouteHandler<TBody, TQuery, TResponse>
) {
  return async (
    request: NextRequest,
    routeParams?: { params: Record<string, string> }
  ): Promise<NextResponse> => {
    try {
      // 1. Authentication
      const session = options.requireAuth !== false ? await auth() : null;

      if (options.requireAuth !== false && !session?.user?.id) {
        throw new UnauthorizedError();
      }

      // 2. Parse and validate query parameters
      let query: TQuery | undefined;
      if (options.querySchema) {
        const searchParams = request.nextUrl.searchParams;
        const queryObject = Object.fromEntries(searchParams.entries());
        query = options.querySchema.parse(queryObject);
      }

      // 3. Parse and validate request body
      let body: TBody | undefined;
      if (options.bodySchema) {
        const rawBody = await request.json();
        body = options.bodySchema.parse(rawBody);
      }

      // 4. Build context
      const context: RouteContext = {
        userId: session?.user?.id || '',
        params: routeParams?.params,
      };

      // 5. Execute handler
      const result = await handler({ body, query, context });

      // 6. Return success response
      return NextResponse.json(result);
    } catch (error) {
      return handleRouteError(error);
    }
  };
}

/**
 * Handles route errors with proper status codes and logging
 */
function handleRouteError(error: unknown): NextResponse {
  // Zod validation errors
  if (error instanceof z.ZodError) {
    void logError('Validation error', { error });
    return NextResponse.json(
      {
        error: 'Validation failed',
        issues: error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      },
      { status: 400 }
    );
  }

  // Custom API errors
  if (error instanceof ApiError) {
    void logError('API error', { error, code: error.code });
    return NextResponse.json(
      {
        error: error.message,
        ...(error.code && { code: error.code }),
      },
      { status: error.statusCode }
    );
  }

  // Generic errors
  void logError('Unexpected error in route handler', { error });
  return NextResponse.json(
    {
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    },
    { status: 500 }
  );
}

/**
 * Helper to create authenticated route handlers (sugar for requireAuth: true)
 */
export function createAuthenticatedHandler<TBody = unknown, TQuery = unknown, TResponse = unknown>(
  options: Omit<RouteHandlerOptions<TBody, TQuery>, 'requireAuth'>,
  handler: RouteHandler<TBody, TQuery, TResponse>
) {
  return createRouteHandler({ ...options, requireAuth: true }, handler);
}
