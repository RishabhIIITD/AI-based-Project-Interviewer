
import { z } from 'zod';
import { insertInterviewSchema, insertMessageSchema, interviews, messages } from './schema';

export const api = {
  interviews: {
    create: {
      method: 'POST' as const,
      path: '/api/interviews',
      input: insertInterviewSchema,
      responses: {
        201: z.custom<typeof interviews.$inferSelect>(),
        400: z.object({ message: z.string() }),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/interviews/:id',
      responses: {
        200: z.custom<typeof interviews.$inferSelect>(),
        404: z.object({ message: z.string() }),
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
          message: z.custom<typeof messages.$inferSelect>(), // The user's message
          response: z.custom<typeof messages.$inferSelect>(), // The AI's response (next question)
          feedback: z.custom<any>(), // Feedback on the user's answer (attached to user message)
        }),
        404: z.object({ message: z.string() }),
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
