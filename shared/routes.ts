
import { z } from 'zod';
import { insertInterviewSchema, insertMessageSchema, interviews, messages } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  interviews: {
    create: {
      method: 'POST' as const,
      path: '/api/interviews',
      input: insertInterviewSchema,
      responses: {
        201: z.custom<typeof interviews.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/interviews/:id',
      responses: {
        200: z.custom<typeof interviews.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    processMessage: {
      method: 'POST' as const,
      path: '/api/interviews/:id/messages',
      input: z.object({
        content: z.string(),
      }),
      responses: {
        200: z.object({
          message: z.custom<typeof messages.$inferSelect>(),
          response: z.custom<typeof messages.$inferSelect>(),
          feedback: z.custom<any>(),
        }),
        404: errorSchemas.notFound,
      },
    },
    getMessages: {
      method: 'GET' as const,
      path: '/api/interviews/:id/messages',
      responses: {
        200: z.array(z.custom<typeof messages.$inferSelect>()),
      },
    },
    complete: {
      method: 'POST' as const,
      path: '/api/interviews/:id/complete',
      responses: {
        200: z.custom<typeof interviews.$inferSelect>(),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type NoteInput = z.infer<typeof api.interviews.create.input>;
export type NoteResponse = z.infer<typeof api.interviews.create.responses[201]>;
export type ValidationError = z.infer<typeof errorSchemas.validation>;
export type NotFoundError = z.infer<typeof errorSchemas.notFound>;
export type InternalError = z.infer<typeof errorSchemas.internal>;
