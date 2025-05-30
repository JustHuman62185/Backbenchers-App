import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Excuse } from "@shared/schema";

const excuseSchema = z.object({
  situation: z.string().min(1, "Please enter a situation").max(200, "Situation must be less than 200 characters"),
  mood: z.enum(["creative", "funny", "savage", "sincere"]),
});

type ExcuseForm = z.infer<typeof excuseSchema>;

export default function ExcuseGenerator() {
  const [generatedExcuse, setGeneratedExcuse] = useState<Excuse | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ExcuseForm>({
    resolver: zodResolver(excuseSchema),
    defaultValues: {
      situation: "",
      mood: "creative",
    },
  });

  // Fetch recent excuses
  const { data: recentExcuses = [] } = useQuery<Excuse[]>({
    queryKey: ["/api/excuses/recent"],
  });

  // Generate excuse mutation
  const generateExcuseMutation = useMutation({
    mutationFn: async (data: ExcuseForm) => {
      const response = await apiRequest("POST", "/api/excuses/generate", data);
      return response.json();
    },
    onSuccess: (excuse: Excuse) => {
      setGeneratedExcuse(excuse);
      queryClient.invalidateQueries({ queryKey: ["/api/excuses/recent"] });
    },
    onError: (error: Error) => {
      console.error("Excuse generation error:", error);
    },
  });

  const onSubmit = (data: ExcuseForm) => {
    generateExcuseMutation.mutate(data);
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

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Input Panel */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-amber-400 to-red-400 rounded-xl flex items-center justify-center">
              <i className="fas fa-magic text-white text-lg"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Excuse Generator</h2>
              <p className="text-gray-600">Generate creative excuses for any situation</p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Situation Input */}
              <FormField
                control={form.control}
                name="situation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <i className="fas fa-exclamation-circle mr-2"></i>
                      Situation
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Late to class, Didn't do homework, Missed exam..."
                        {...field}
                        maxLength={200}
                        className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </FormControl>
                    <div className="text-xs text-gray-500">
                      {field.value.length}/200 characters
                    </div>
                  </FormItem>
                )}
              />

              {/* Mood Selection */}
              <FormField
                control={form.control}
                name="mood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <i className="fas fa-palette mr-2"></i>
                      Mood/Style
                    </FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: "creative", icon: "fas fa-lightbulb", bg: "from-purple-400 to-pink-400", label: "Creative" },
                          { value: "funny", icon: "fas fa-laugh", bg: "from-yellow-400 to-orange-400", label: "Funny" },
                          { value: "savage", icon: "fas fa-fire", bg: "from-red-400 to-pink-400", label: "Savage" },
                          { value: "sincere", icon: "fas fa-heart", bg: "from-blue-400 to-cyan-400", label: "Sincere" },
                        ].map((mood) => (
                          <label key={mood.value} className="cursor-pointer">
                            <input
                              type="radio"
                              value={mood.value}
                              checked={field.value === mood.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              className="sr-only"
                            />
                            <div
                              className={`p-4 rounded-xl text-white text-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 bg-gradient-to-r ${mood.bg} ${
                                field.value === mood.value ? "ring-4 ring-white ring-opacity-50 scale-105" : ""
                              }`}
                            >
                              <i className={`${mood.icon} mb-2 block`}></i>
                              <span className="text-sm font-medium">{mood.label}</span>
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
                disabled={generateExcuseMutation.isPending}
                className="w-full bg-gradient-to-r from-primary to-secondary text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:transform-none"
              >
                <i className="fas fa-wand-magic-sparkles mr-2"></i>
                {generateExcuseMutation.isPending ? "Generating..." : "Generate Excuse"}
              </Button>
            </form>
          </Form>
        </div>

        {/* Tips Card */}
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-4 border border-cyan-200">
          <h3 className="font-semibold text-cyan-900 mb-3 flex items-center">
            <i className="fas fa-lightbulb text-cyan-600 mr-2"></i>
            Pro Tips
          </h3>
          <ul className="text-sm text-cyan-800 space-y-2">
            <li className="flex items-start space-x-2">
              <i className="fas fa-check text-cyan-600 mt-0.5 text-xs"></i>
              <span>Be specific about your situation for better results</span>
            </li>
            <li className="flex items-start space-x-2">
              <i className="fas fa-check text-cyan-600 mt-0.5 text-xs"></i>
              <span>Try different moods to match your audience</span>
            </li>
            <li className="flex items-start space-x-2">
              <i className="fas fa-check text-cyan-600 mt-0.5 text-xs"></i>
              <span>Remember: Use responsibly! 😉</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Output Panel */}
      <div className="space-y-6">
        {/* Generated Excuse Display */}
        <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <i className="fas fa-scroll text-primary mr-2"></i>
              Your Excuse
            </h3>
            {generatedExcuse && (
              <Button
                onClick={() => copyToClipboard(generatedExcuse.generatedText)}
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
          {generateExcuseMutation.isPending && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-3 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Crafting your perfect excuse...</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!generatedExcuse && !generateExcuseMutation.isPending && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-comment-dots text-gray-400 text-xl"></i>
              </div>
              <p className="text-gray-600 mb-2">No excuse generated yet</p>
              <p className="text-sm text-gray-500">Fill in the details above and hit generate!</p>
            </div>
          )}

          {/* Generated Content */}
          {generatedExcuse && !generateExcuseMutation.isPending && (
            <div>
              <div className="bg-gray-50 rounded-xl p-4 min-h-32">
                <p className="text-gray-800 leading-relaxed">{generatedExcuse.generatedText}</p>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <span>Mood: {generatedExcuse.mood.charAt(0).toUpperCase() + generatedExcuse.mood.slice(1)}</span>
                  <span>Length: {generatedExcuse.generatedText.length} chars</span>
                </div>
                <div className="flex items-center space-x-2">
                  <i className="fas fa-robot text-cyan-500"></i>
                  <span>Generated by AI</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Excuses */}
        <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-history text-primary mr-2"></i>
            Recent Excuses
          </h3>
          <div className="space-y-3">
            {recentExcuses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <i className="fas fa-clock text-2xl mb-2 block"></i>
                <p>Your recent excuses will appear here</p>
              </div>
            ) : (
              recentExcuses.map((excuse) => (
                <div key={excuse.id} className="p-3 bg-gray-50 rounded-lg border-l-4 border-primary">
                  <p className="text-sm text-gray-700 mb-1">
                    "{excuse.generatedText.length > 80 ? excuse.generatedText.substring(0, 80) + "..." : excuse.generatedText}"
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{excuse.mood.charAt(0).toUpperCase() + excuse.mood.slice(1)} • {getTimeAgo(excuse.createdAt)}</span>
                    <button
                      onClick={() => copyToClipboard(excuse.generatedText)}
                      className="hover:text-primary transition-colors"
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