import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Note } from "@shared/schema";

const notesSchema = z.object({
  topic: z.string().min(1, "Please enter a topic").max(150, "Topic must be less than 150 characters"),
  subject: z.string().optional(),
  complexity: z.enum(["basic", "intermediate", "advanced"]),
});

type NotesForm = z.infer<typeof notesSchema>;

export default function NotesMaker() {
  const [generatedNote, setGeneratedNote] = useState<Note | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<NotesForm>({
    resolver: zodResolver(notesSchema),
    defaultValues: {
      topic: "",
      subject: "",
      complexity: "basic",
    },
  });

  // Fetch recent notes
  const { data: recentNotes = [] } = useQuery<Note[]>({
    queryKey: ["/api/notes/recent"],
  });

  // Generate notes mutation
  const generateNotesMutation = useMutation({
    mutationFn: async (data: NotesForm) => {
      const response = await apiRequest("POST", "/api/notes/generate", data);
      return response.json();
    },
    onSuccess: (note: Note) => {
      setGeneratedNote(note);
      queryClient.invalidateQueries({ queryKey: ["/api/notes/recent"] });
    },
    onError: (error: Error) => {
      console.error("Notes generation error:", error);
    },
  });

  const onSubmit = (data: NotesForm) => {
    generateNotesMutation.mutate(data);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;

    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const getComplexityLabel = (complexity: string) => {
    const labels = {
      basic: "Baby Mode",
      intermediate: "Normal Human",
      advanced: "Show Off"
    };
    return labels[complexity as keyof typeof labels] || "Baby Mode";
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Input Panel */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-lg flex items-center justify-center">
              <i className="fas fa-book-open text-white text-sm"></i>
            </div>
            <h2 className="text-lg font-bold text-gray-900">Backbencher Notes</h2>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Topic Input */}
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <i className="fas fa-tags mr-2"></i>
                      Topic
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Photosynthesis, World War 2, Calculus, Shakespeare..."
                        {...field}
                        maxLength={150}
                        className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </FormControl>
                    <div className="text-xs text-gray-500">
                      {field.value.length}/150 characters
                    </div>
                  </FormItem>
                )}
              />

              {/* Subject Category */}
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <i className="fas fa-graduation-cap mr-2"></i>
                      Subject
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent">
                          <SelectValue placeholder="Select a subject..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="general">Select a subject...</SelectItem>
                        <SelectItem value="science">Science & Biology</SelectItem>
                        <SelectItem value="mathematics">Mathematics</SelectItem>
                        <SelectItem value="history">History</SelectItem>
                        <SelectItem value="literature">Literature & English</SelectItem>
                        <SelectItem value="physics">Physics</SelectItem>
                        <SelectItem value="chemistry">Chemistry</SelectItem>
                        <SelectItem value="geography">Geography</SelectItem>
                        <SelectItem value="economics">Economics</SelectItem>
                        <SelectItem value="psychology">Psychology</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {/* Complexity Level */}
              <FormField
                control={form.control}
                name="complexity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <i className="fas fa-signal mr-2"></i>
                      Complexity Level
                    </FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: "basic", icon: "fas fa-baby", bg: "from-green-400 to-emerald-400", label: "Baby Mode" },
                          { value: "intermediate", icon: "fas fa-user", bg: "from-yellow-400 to-orange-400", label: "Normal Human" },
                          { value: "advanced", icon: "fas fa-rocket", bg: "from-red-400 to-pink-400", label: "Show Off" },
                        ].map((complexity) => (
                          <label key={complexity.value} className="cursor-pointer">
                            <input
                              type="radio"
                              value={complexity.value}
                              checked={field.value === complexity.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              className="sr-only"
                            />
                            <div
                              className={`p-4 rounded-xl text-white text-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 bg-gradient-to-r ${complexity.bg} ${
                                field.value === complexity.value ? "ring-4 ring-white ring-opacity-50 scale-105" : ""
                              }`}
                            >
                              <i className={`${complexity.icon} mb-2 block`}></i>
                              <span className="text-sm font-medium">{complexity.label}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Generate Button */}
              <Button
                type="submit"
                disabled={generateNotesMutation.isPending}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:transform-none"
              >
                <i className="fas fa-magic mr-2"></i>
                {generateNotesMutation.isPending ? "Generating..." : "Generate Notes"}
              </Button>
            </form>
          </Form>
        </div>

        {/* Study Tips Card */}
        <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-2xl p-6 border border-emerald-200">
          <h3 className="font-semibold text-emerald-900 mb-3 flex items-center">
            <i className="fas fa-brain text-emerald-600 mr-2"></i>
            Backbencher Wisdom
          </h3>
          <ul className="text-sm text-emerald-800 space-y-2">
            <li className="flex items-start space-x-2">
              <i className="fas fa-check text-emerald-600 mt-0.5 text-xs"></i>
              <span>Perfect for last-minute cramming sessions</span>
            </li>
            <li className="flex items-start space-x-2">
              <i className="fas fa-check text-emerald-600 mt-0.5 text-xs"></i>
              <span>Sarcasm makes everything more memorable</span>
            </li>
            <li className="flex items-start space-x-2">
              <i className="fas fa-check text-emerald-600 mt-0.5 text-xs"></i>
              <span>Works best with coffee and panic</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Output Panel */}
      <div className="space-y-6">
        {/* Generated Notes Display */}
        <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <i className="fas fa-sticky-note text-emerald-500 mr-2"></i>
              Your Simplified Notes
            </h3>
            {generatedNote && (
              <Button
                onClick={() => copyToClipboard(generatedNote.generatedText)}
                variant="outline"
                size="sm"
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
              >
                <i className="fas fa-copy mr-2"></i>
                Copy
              </Button>
            )}
          </div>

          {/* Loading State */}
          {generateNotesMutation.isPending && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Dumbing down the content for you...</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!generatedNote && !generateNotesMutation.isPending && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-sticky-note text-gray-400 text-xl"></i>
              </div>
              <p className="text-gray-600 mb-2">No notes generated yet</p>
              <p className="text-sm text-gray-500">Enter a topic and get simplified notes!</p>
            </div>
          )}

          {/* Generated Content */}
          {generatedNote && !generateNotesMutation.isPending && (
            <div>
              <div className="bg-gray-50 rounded-xl p-4 min-h-32">
                <div 
                  className="text-gray-800 leading-relaxed whitespace-pre-line"
                  dangerouslySetInnerHTML={{
                    __html: generatedNote.generatedText
                      .replace(/\n/g, '<br>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  }}
                />
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <span>Subject: {generatedNote.subject || "General"}</span>
                  <span>Level: {getComplexityLabel(generatedNote.complexity)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <i className="fas fa-robot text-cyan-500"></i>
                  <span>Generated by AI</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notes History */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-history text-emerald-500 mr-2"></i>
            Recent Notes
          </h3>
          <div className="space-y-3">
            {recentNotes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <i className="fas fa-clock text-2xl mb-2 block"></i>
                <p>Your recent notes will appear here</p>
              </div>
            ) : (
              recentNotes.map((note) => (
                <div key={note.id} className="p-3 bg-gray-50 rounded-lg border-l-4 border-emerald-500">
                  <p className="text-sm font-medium text-gray-800 mb-1">{note.topic}</p>
                  <p className="text-xs text-gray-600 mb-2">
                    {note.generatedText.length > 60 ? note.generatedText.substring(0, 60) + "..." : note.generatedText}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{note.subject || "General"} • {getComplexityLabel(note.complexity)} • {getTimeAgo(note.createdAt)}</span>
                    <button
                      onClick={() => copyToClipboard(note.generatedText)}
                      className="hover:text-emerald-500 transition-colors"
                    >
                      <i className="fas fa-copy"></i>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}