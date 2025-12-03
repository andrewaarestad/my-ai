import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import type { ZodSchema } from 'zod';
import { z } from 'zod';
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
export interface RouteHandlerOptions<TBody = never, TQuery = never> {
  requireAuth?: boolean;
  bodySchema?: ZodSchema<TBody>;
  querySchema?: ZodSchema<TQuery>;
}

/**
 * Validated request data with conditional types
 * - If bodySchema provided → body is TBody (required)
 * - If no bodySchema → body is never (type error if accessed)
 * - Same logic for query
 */
export type ValidatedRequest<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TOptions extends RouteHandlerOptions<any, any>
> = {
  context: RouteContext;
} & (TOptions['bodySchema'] extends ZodSchema<infer TBody>
  ? { body: TBody }
  : Record<string, never>) &
  (TOptions['querySchema'] extends ZodSchema<infer TQuery>
    ? { query: TQuery }
    : Record<string, never>);

/**
 * Route handler function type with conditional request shape
 */
export type RouteHandler<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TOptions extends RouteHandlerOptions<any, any>,
  TResponse = unknown
> = (req: ValidatedRequest<TOptions>) => Promise<TResponse>;

/**
 * Creates a type-safe, validated API route handler with minimal boilerplate
 *
 * @example
 * ```ts
 * export const POST = createRouteHandler({
 *   bodySchema: CreateTaskDto,
 *   requireAuth: true,
 * }, async ({ body, context }) => {
 *   // ✅ body is CreateTaskDto (not optional!)
 *   const service = createTaskListService(context.userId);
 *   const task = await service.createTask(body.text);
 *   return { success: true, task };
 * });
 * ```
 */
export function createRouteHandler<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TOptions extends RouteHandlerOptions<any, any>,
  TResponse = unknown
>(
  options: TOptions,
  handler: RouteHandler<TOptions, TResponse>
) {
  return async (
    request: NextRequest,
    routeParams?: { params: Promise<Record<string, string>> | Record<string, string> }
  ): Promise<NextResponse> => {
    try {
      // 1. Authentication
      const session = options.requireAuth !== false ? await auth() : null;

      if (options.requireAuth !== false && !session?.user?.id) {
        throw new UnauthorizedError();
      }

      // 2. Parse and validate query parameters
      let query: unknown;
      if (options.querySchema) {
        const searchParams = request.nextUrl.searchParams;
        const queryObject = Object.fromEntries(searchParams.entries());
        query = options.querySchema.parse(queryObject);
      }

      // 3. Parse and validate request body
      let body: unknown;
      if (options.bodySchema) {
        const rawBody: unknown = await request.json();
        body = options.bodySchema.parse(rawBody);
      }

      // 4. Build context (await params if they're a Promise - Next.js 16+)
      const resolvedParams = routeParams?.params
        ? routeParams.params instanceof Promise
          ? await routeParams.params
          : routeParams.params
        : undefined;

      const context: RouteContext = {
        userId: session?.user?.id || '',
        params: resolvedParams,
      };

      // 5. Build request object with only the fields that have schemas
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      const validatedRequest: any = { context };
      if (options.bodySchema) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        validatedRequest.body = body;
      }
      if (options.querySchema) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        validatedRequest.query = query;
      }

      // 6. Execute handler
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const result = await handler(validatedRequest);

      // 7. Return success response
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
    const zodError: z.ZodError = error;
    void logError('Validation error', { error });
    return NextResponse.json(
      {
        error: 'Validation failed',
        issues: zodError.issues.map((err: z.ZodIssue) => ({
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
export function createAuthenticatedHandler<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TOptions extends RouteHandlerOptions<any, any>,
  TResponse = unknown
>(
  options: TOptions,
  handler: RouteHandler<TOptions, TResponse>
) {
  return createRouteHandler({ ...options, requireAuth: true }, handler);
}
