import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface GenerateExcuseParams {
  situation: string;
  mood: "creative" | "funny" | "savage" | "sincere";
}

interface GenerateNotesParams {
  topic: string;
  subject?: string;
  complexity: "basic" | "intermediate" | "advanced";
}

export function useGenerateExcuse() {
  return useMutation({
    mutationFn: async (params: GenerateExcuseParams) => {
      const response = await apiRequest("POST", "/api/excuses/generate", params);
      return response.json();
    },
  });
}

export function useGenerateNotes() {
  return useMutation({
    mutationFn: async (params: GenerateNotesParams) => {
      const response = await apiRequest("POST", "/api/notes/generate", params);
      return response.json();
    },
  });
}
