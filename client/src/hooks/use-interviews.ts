import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type NoteInput } from "@shared/routes";
import { type InsertInterview, type CreateInterviewRequest } from "@shared/schema";

// GET /api/interviews/:id
export function useInterview(id: number) {
  return useQuery({
    queryKey: [api.interviews.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.interviews.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch interview");
      return api.interviews.get.responses[200].parse(await res.json());
    },
    enabled: !!id && !isNaN(id),
  });
}

// GET /api/interviews/:id/messages
export function useInterviewMessages(id: number) {
  return useQuery({
    queryKey: [api.interviews.getMessages.path, id],
    queryFn: async () => {
      const url = buildUrl(api.interviews.getMessages.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return api.interviews.getMessages.responses[200].parse(await res.json());
    },
    enabled: !!id && !isNaN(id),
  });
}

// POST /api/interviews
export function useCreateInterview() {
  return useMutation({
    mutationFn: async (data: CreateInterviewRequest) => {
      const res = await fetch(api.interviews.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.interviews.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create interview");
      }
      return api.interviews.create.responses[201].parse(await res.json());
    },
  });
}

// POST /api/interviews/:id/messages
export function useProcessMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, content, apiKey }: { id: number; content: string; apiKey?: string }) => {
      const url = buildUrl(api.interviews.processMessage.path, { id });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, apiKey }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to process message");
      
      return api.interviews.processMessage.responses[200].parse(await res.json());
    },
    onSuccess: (data, variables) => {
      // Invalidate messages query to refresh the list
      queryClient.invalidateQueries({ 
        queryKey: [api.interviews.getMessages.path, variables.id] 
      });
    },
  });
}

// POST /api/interviews/:id/complete
export function useCompleteInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, apiKey }: { id: number; apiKey?: string }) => {
      const url = buildUrl(api.interviews.complete.path, { id });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to complete interview");
      
      return api.interviews.complete.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: [api.interviews.get.path, data.id] 
      });
    },
  });
}
