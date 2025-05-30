
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const chatSchema = z.object({
  message: z.string().min(1, "Please enter a message").max(500, "Message must be less than 500 characters"),
});

const roomSchema = z.object({
  roomName: z.string().min(1, "Room name required").max(50, "Room name too long"),
});

const searchSchema = z.object({
  searchTerm: z.string(),
});

type ChatForm = z.infer<typeof chatSchema>;
type RoomForm = z.infer<typeof roomSchema>;
type SearchForm = z.infer<typeof searchSchema>;

interface ChatMessage {
  id: number;
  username: string;
  message: string;
  roomId: number;
  timestamp: Date;
}

interface Room {
  id: number;
  name: string;
  userCount: number;
  createdAt: Date;
}

export default function CommunityChat() {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [profilePic, setProfilePic] = useState(() => 
    localStorage.getItem("profilePic") || ""
  );
  const [username, setUsername] = useState(() => 
    localStorage.getItem("username") || ""
  );
  const [isUsernameSet, setIsUsernameSet] = useState(() => 
    Boolean(localStorage.getItem("username"))
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const { toast } = useToast();

  const chatForm = useForm<ChatForm>({
    resolver: zodResolver(chatSchema),
    defaultValues: { message: "" },
  });

  const roomForm = useForm<RoomForm>({
    resolver: zodResolver(roomSchema),
    defaultValues: { roomName: "" },
  });

  const searchForm = useForm<SearchForm>({
    resolver: zodResolver(searchSchema),
    defaultValues: { searchTerm: "" },
  });

  // Fetch rooms
  const { data: rooms = [], refetch: refetchRooms } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/rooms");
      return response.json();
    },
    refetchInterval: 3000,
  });

  // Watch search term and filter rooms
  const searchTerm = searchForm.watch("searchTerm");
  
  useEffect(() => {
    if (searchTerm) {
      setFilteredRooms(rooms.filter((room: Room) => 
        room.name.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    } else {
      setFilteredRooms(rooms);
    }
  }, [searchTerm, rooms]);

  // Fetch messages for selected room
  const { data: roomMessages = [], refetch: refetchMessages } = useQuery({
    queryKey: ["messages", selectedRoom?.id],
    queryFn: async () => {
      if (!selectedRoom) return [];
      const response = await apiRequest("GET", `/api/rooms/${selectedRoom.id}/messages`);
      return response.json();
    },
    enabled: !!selectedRoom,
    refetchInterval: 1000,
  });

  useEffect(() => {
    setMessages(roomMessages);
    // Auto-scroll to bottom when new messages arrive
    setTimeout(() => {
      const chatContainer = document.getElementById('chat-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }, [roomMessages]);

  const createRoomMutation = useMutation({
    mutationFn: async (data: RoomForm) => {
      const response = await apiRequest("POST", "/api/rooms", data);
      return response.json();
    },
    onSuccess: () => {
      roomForm.reset();
      refetchRooms();
      toast({ title: "Room created successfully!" });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: ChatForm) => {
      if (!selectedRoom || !username) return;
      const response = await apiRequest("POST", `/api/rooms/${selectedRoom.id}/messages`, {
        message: data.message,
        username,
      });
      return response.json();
    },
    onSuccess: () => {
      chatForm.reset();
      refetchMessages();
    },
  });

  const saveUsername = () => {
    if (username.trim()) {
      localStorage.setItem("username", username.trim());
      setIsUsernameSet(true);
      toast({ title: "Username saved!" });
    }
  };

  const handleProfilePicUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Please select an image under 5MB" });
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast({ title: "Invalid file type", description: "Please select an image file" });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setProfilePic(result);
          localStorage.setItem("profilePic", result);
          toast({ title: "Profile picture updated!" });
          setIsProfileDialogOpen(false);
        }
      };
      reader.onerror = () => {
        toast({ title: "Upload failed", description: "Failed to read the image file" });
      };
      reader.readAsDataURL(file);
    }
    // Clear the input to allow uploading the same file again
    event.target.value = '';
  };

  const removeProfilePic = () => {
    setProfilePic("");
    localStorage.removeItem("profilePic");
    toast({ title: "Profile picture removed!" });
    setIsProfileDialogOpen(false);
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const joinRoom = (room: Room) => {
    setSelectedRoom(room);
    setIsMenuOpen(false);
    toast({ title: `Joined #${room.name}` });
  };

  return (
    <div className="flex flex-col h-screen">
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 transition-colors duration-200 ${selectedRoom ? 'pb-32' : 'pb-20'}`}>

      {/* Header */}
      <header className="glass-effect sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-2 py-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Hamburger Menu */}
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-1">
                    <div className="space-y-0.5">
                      <div className="w-3 h-0.5 bg-gray-600 dark:bg-gray-300"></div>
                      <div className="w-3 h-0.5 bg-gray-600 dark:bg-gray-300"></div>
                      <div className="w-3 h-0.5 bg-gray-600 dark:bg-gray-300"></div>
                    </div>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <div className="flex flex-col h-full">
                    <SheetHeader className="p-3 border-b">
                      <SheetTitle className="flex items-center space-x-2 text-sm">
                        <i className="fas fa-comments text-blue-500 text-xs"></i>
                        <span>Chat Rooms</span>
                      </SheetTitle>
                    </SheetHeader>
                    
                    <div className="flex-1 overflow-y-auto p-3 compact-spacing">
                      {/* Search Bar */}
                      <Form {...searchForm}>
                        <FormField
                          control={searchForm.control}
                          name="searchTerm"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  placeholder="Search rooms..."
                                  {...field}
                                  className="w-full text-xs h-8"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </Form>

                      {/* Create Room */}
                      <Form {...roomForm}>
                        <form onSubmit={roomForm.handleSubmit((data) => createRoomMutation.mutate(data))} className="compact-spacing">
                          <FormField
                            control={roomForm.control}
                            name="roomName"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input placeholder="Create new room..." {...field} className="text-xs h-8" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <Button type="submit" disabled={createRoomMutation.isPending} className="w-full h-8 text-xs">
                            <i className="fas fa-plus mr-1 text-xs"></i>Create Room
                          </Button>
                        </form>
                      </Form>

                      {/* Room List */}
                      <div className="compact-spacing">
                        <h3 className="font-medium text-gray-700 text-xs">Available Rooms</h3>
                        {filteredRooms.map((room: Room) => (
                          <div
                            key={room.id}
                            onClick={() => joinRoom(room)}
                            className={`p-2 rounded-lg border cursor-pointer transition-all ${
                              selectedRoom?.id === room.id
                                ? "bg-blue-50 border-blue-200"
                                : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <i className="fas fa-hashtag text-blue-500 text-xs"></i>
                                <span className="font-medium text-xs">{room.name}</span>
                              </div>
                              <Badge variant="secondary" className="text-xs h-4">
                                {room.userCount}
                              </Badge>
                            </div>
                          </div>
                        ))}
                        {filteredRooms.length === 0 && (
                          <p className="text-center text-gray-500 text-xs py-2">
                            {searchTerm ? "No rooms found" : "No rooms available"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <div className="flex items-center space-x-1">
                <div className="w-5 h-5 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                  <i className="fas fa-comments text-white text-xs"></i>
                </div>
                <h1 className="text-xs font-bold text-gray-900">Chat</h1>
              </div>
            </div>

            {/* User Profile */}
            {isUsernameSet && (
              <div className="flex items-center space-x-1">
                <Badge className="bg-blue-100 text-blue-700 text-xs h-5">
                  {username}
                </Badge>
                <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
                  <DialogTrigger asChild>
                    <Avatar className="w-6 h-6 cursor-pointer">
                      <AvatarImage src={profilePic} alt={username} className="object-cover" />
                      <AvatarFallback className="text-xs bg-gradient-to-r from-blue-400 to-purple-400 text-white">
                        {getUserInitials(username)}
                      </AvatarFallback>
                    </Avatar>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Profile Settings</DialogTitle>
                      <p className="text-sm text-gray-500">Update your profile picture and settings</p>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={profilePic} alt={username} className="object-cover" />
                          <AvatarFallback className="bg-gradient-to-r from-blue-400 to-purple-400 text-white text-lg">
                            {getUserInitials(username)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{username}</p>
                          <p className="text-sm text-gray-500">Change your profile picture</p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <label htmlFor="profile-pic-dialog" className="flex-1 cursor-pointer">
                          <Button variant="outline" className="w-full text-xs h-8 hover:bg-blue-50" asChild>
                            <span>
                              <i className="fas fa-camera mr-1 text-xs"></i>
                              Choose Photo
                            </span>
                          </Button>
                          <input
                            id="profile-pic-dialog"
                            type="file"
                            accept="image/*"
                            onChange={handleProfilePicUpload}
                            className="hidden"
                          />
                        </label>
                        {profilePic && (
                          <Button variant="destructive" onClick={removeProfilePic} className="text-xs h-8">
                            <i className="fas fa-trash text-xs"></i>
                          </Button>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-2 no-bottom-padding">
        {/* Username Setup */}
        {!isUsernameSet && (
          <div className="glass-effect rounded-lg mt-2 compact-padding">
            <h2 className="text-sm font-semibold mb-2">Set Your Profile</h2>
            <div className="compact-spacing">
              <Input
                placeholder="Enter username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                className="text-xs h-8"
              />
              
              {/* Profile Picture Upload */}
              <div className="flex items-center space-x-2">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={profilePic} alt="Profile" className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-r from-blue-400 to-purple-400 text-white text-xs">
                    {username ? getUserInitials(username) : "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <label htmlFor="profile-pic-setup" className="block text-xs text-gray-600 mb-1">
                    Profile Picture (optional)
                  </label>
                  <input
                    id="profile-pic-setup"
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePicUpload}
                    className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>
              </div>
              
              <Button onClick={saveUsername} disabled={!username.trim()} className="w-full text-xs h-8">
                Save Profile
              </Button>
            </div>
          </div>
        )}

        {isUsernameSet && (
          <>
            {/* Current Room Header */}
            {selectedRoom && (
              <div className="glass-effect rounded-lg mt-2 compact-padding">
                <h3 className="font-semibold flex items-center text-sm">
                  <i className="fas fa-hashtag text-blue-500 mr-1 text-xs"></i>
                  {selectedRoom.name}
                  <Badge variant="secondary" className="ml-auto text-xs h-4">
                    {selectedRoom.userCount} online
                  </Badge>
                </h3>
              </div>
            )}

            {/* Chat Interface */}
            {selectedRoom ? (
              <div className="glass-effect rounded-lg mt-2 overflow-hidden">
                <div className="p-2 h-64 overflow-y-auto" id="chat-container">
                  <div className="compact-spacing">
                    {messages
                      .sort((a, b) => new Date(a.createdAt || a.timestamp).getTime() - new Date(b.createdAt || b.timestamp).getTime())
                      .map((message) => (
                      <div key={message.id} className="flex items-start space-x-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={message.username === username ? profilePic : ""} alt={message.username} className="object-cover" />
                          <AvatarFallback className="bg-gradient-to-r from-blue-400 to-purple-400 text-white text-xs">
                            {getUserInitials(message.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-1">
                            <span className="font-medium text-xs">{message.username}</span>
                            <span className="text-xs text-gray-500">
                              {getTimeAgo(message.createdAt || message.timestamp)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-800 mt-0.5">{message.message}</p>
                        </div>
                      </div>
                    ))}

                    {sendMessageMutation.isPending && (
                      <div className="flex items-start space-x-2">
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                          <div className="animate-spin w-2 h-2 border border-gray-600 border-t-transparent rounded-full"></div>
                        </div>
                        <div className="text-xs text-gray-500">Sending...</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-effect rounded-lg mt-2 p-6 text-center">
                <i className="fas fa-comments text-3xl text-gray-300 dark:text-gray-600 mb-2"></i>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">No Room Selected</h3>
                <p className="text-gray-500 mb-3 text-xs">Select a room from the menu to start chatting</p>
                <Button onClick={() => setIsMenuOpen(true)} variant="outline" className="text-xs h-8">
                  <i className="fas fa-bars mr-1 text-xs"></i>Browse Rooms
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Fixed Message Input */}
      {isUsernameSet && selectedRoom && (
        <div className="fixed bottom-20 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-4xl mx-auto px-2 py-2">
            <Form {...chatForm}>
              <form onSubmit={chatForm.handleSubmit((data) => sendMessageMutation.mutate(data))} className="flex space-x-2">
                <FormField
                  control={chatForm.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          placeholder={`Message #${selectedRoom.name}...`}
                          {...field}
                          maxLength={500}
                          className="text-xs h-8"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={sendMessageMutation.isPending || !chatForm.watch("message").trim()}
                  className="h-8 w-8 p-0"
                >
                  <i className="fas fa-paper-plane text-xs"></i>
                </Button>
              </form>
            </Form>
          </div>
        </div>
      )}
    </div>
  </div>
);
}
