
import { z } from 'zod';
import { insertInterviewSchema, insertMessageSchema, interviewSchema, messageSchema, createInterviewRequestSchema, processMessageRequestSchema, completeInterviewRequestSchema, type Interview, type Message } from './schema';

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
        201: interviewSchema,
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/interviews/:id',
      responses: {
        200: interviewSchema,
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
          message: messageSchema,
          response: messageSchema,
          feedback: z.custom<any>(),
        }),
        404: errorSchemas.notFound,
      },
    },
    getMessages: {
      method: 'GET' as const,
      path: '/api/interviews/:id/messages',
      responses: {
        200: z.array(messageSchema),
      },
    },
    complete: {
      method: 'POST' as const,
      path: '/api/interviews/:id/complete',
      input: completeInterviewRequestSchema,
      responses: {
        200: interviewSchema,
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
