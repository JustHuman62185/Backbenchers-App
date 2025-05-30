
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  ipAddress: string;
  excusesGenerated: number;
  notesCreated: number;
  createdAt: string;
  lastActive: string;
}

export default function Leaderboard() {
  const [username, setUsername] = useState("");
  const [isProfileSaved, setIsProfileSaved] = useState(false);
  const { toast } = useToast();

  // Check if user has saved their profile
  useEffect(() => {
    const savedProfile = localStorage.getItem("userProfile");
    if (savedProfile) {
      setIsProfileSaved(true);
      setUsername(JSON.parse(savedProfile).username);
    }
  }, []);

  // Fetch leaderboards
  const { data: excusesLeaderboard = [] } = useQuery<User[]>({
    queryKey: ["/api/leaderboard/excuses"],
  });

  const { data: notesLeaderboard = [] } = useQuery<User[]>({
    queryKey: ["/api/leaderboard/notes"],
  });

  const saveProfile = async () => {
    if (!username.trim()) {
      toast({
        title: "Error",
        description: "Please enter a username",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/users/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: username.trim() }),
      });

      if (response.ok) {
        localStorage.setItem("userProfile", JSON.stringify({ username: username.trim() }));
        setIsProfileSaved(true);
        toast({
          title: "Success",
          description: "Profile saved successfully!",
        });
      } else {
        throw new Error("Failed to save profile");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return "fas fa-trophy text-yellow-500";
      case 2: return "fas fa-medal text-gray-400";
      case 3: return "fas fa-award text-amber-600";
      default: return "fas fa-user-circle text-gray-400";
    }
  };

  const getRankDisplay = (rank: number) => {
    switch (rank) {
      case 1: return "🥇";
      case 2: return "🥈"; 
      case 3: return "🥉";
      default: return `#${rank}`;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-yellow-900 pb-20 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center">
              <i className="fas fa-trophy text-white text-lg"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Leaderboard</h1>
              <p className="text-gray-600">Compete with fellow students and track your progress</p>
            </div>
          </div>
        </div>

        {/* Profile Setup */}
        {!isProfileSaved && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl flex items-center justify-center">
                <i className="fas fa-user text-white"></i>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Set Up Your Profile</h2>
                <p className="text-gray-600">Enter your username to appear on the leaderboard</p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Input
                type="text"
                placeholder="Enter your username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="flex-1"
                maxLength={50}
              />
              <Button onClick={saveProfile} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                <i className="fas fa-save mr-2"></i>
                Save Profile
              </Button>
            </div>
          </div>
        )}

        {isProfileSaved && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-4 shadow-lg border border-green-200 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <i className="fas fa-check text-white text-sm"></i>
              </div>
              <div>
                <p className="text-green-800 font-medium">Welcome back, {username}!</p>
                <p className="text-green-600 text-sm">Your activities are being tracked for the leaderboard</p>
              </div>
            </div>
          </div>
        )}

        <Tabs defaultValue="excuses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white rounded-xl p-2 shadow-lg border border-gray-100">
            <TabsTrigger value="excuses" className="rounded-lg">
              <i className="fas fa-theater-masks mr-2"></i>
              🧵 Threads of Shame
            </TabsTrigger>
            <TabsTrigger value="notes" className="rounded-lg">
              <i className="fas fa-trophy mr-2"></i>
              🏆 Aura Leaderboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="excuses">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <i className="fas fa-theater-masks text-red-500 mr-2"></i>
                  🧵 Threads of Shame - Most Excuses Generated
                </h2>
                <p className="text-gray-600 text-sm mt-1">Who's been making the most creative excuses?</p>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {excusesLeaderboard.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <i className="fas fa-ghost text-4xl mb-4 block"></i>
                      <p className="text-lg">No excuse makers yet!</p>
                      <p className="text-sm">Be the first to generate some creative excuses</p>
                    </div>
                  ) : (
                    excusesLeaderboard.map((user, index) => (
                      <div
                        key={user.id}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                          index < 3 
                            ? 'border-red-200 bg-gradient-to-r from-red-50 to-pink-50' 
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl">{getRankDisplay(index + 1)}</span>
                              <i className={getRankIcon(index + 1)}></i>
                            </div>
                            
                            <div>
                              <h3 className="font-semibold text-gray-900">{user.username}</h3>
                              <div className="flex items-center space-x-3 text-sm text-gray-600">
                                <span>🎭 {user.excusesGenerated}</span>
                                <span>📝 {user.notesCreated}</span>
                                <span>⏰ {getTimeAgo(user.lastActive)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-2xl font-bold text-red-600">{user.excusesGenerated}</div>
                            <div className="text-sm text-gray-500">🎭</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notes">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <i className="fas fa-trophy text-yellow-500 mr-2"></i>
                  🏆 Aura Leaderboard - Notes Generator Champions
                </h2>
                <p className="text-gray-600 text-sm mt-1">Who's been studying the hardest with our notes generator?</p>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {notesLeaderboard.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <i className="fas fa-book-open text-4xl mb-4 block"></i>
                      <p className="text-lg">No study champions yet!</p>
                      <p className="text-sm">Be the first to generate some study notes</p>
                    </div>
                  ) : (
                    notesLeaderboard.map((user, index) => (
                      <div
                        key={user.id}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                          index < 3 
                            ? 'border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50' 
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl">{getRankDisplay(index + 1)}</span>
                              <i className={getRankIcon(index + 1)}></i>
                            </div>
                            
                            <div>
                              <h3 className="font-semibold text-gray-900">{user.username}</h3>
                              <div className="flex items-center space-x-3 text-sm text-gray-600">
                                <span>📚 {user.notesCreated}</span>
                                <span>🎭 {user.excusesGenerated}</span>
                                <span>⏰ {getTimeAgo(user.lastActive)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-2xl font-bold text-yellow-600">{user.notesCreated}</div>
                            <div className="text-sm text-gray-500">📚</div>
                          </div>
                        </div>
                        
                        {index < 3 && (
                          <div className="mt-3 flex items-center space-x-2">
                            <Badge className="bg-yellow-100 text-yellow-700">
                              <i className="fas fa-star mr-1"></i>
                              {index === 0 ? "Study Legend" : index === 1 ? "Notes Master" : "Knowledge Seeker"}
                            </Badge>
                            {user.notesCreated >= 10 && (
                              <Badge className="bg-purple-100 text-purple-700">
                                <i className="fas fa-fire mr-1"></i>
                                Study Streak
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
