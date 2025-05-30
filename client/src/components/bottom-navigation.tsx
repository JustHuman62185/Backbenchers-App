import { useLocation } from "wouter";
import { Link } from "wouter";

interface NavItem {
  path: string;
  icon: string;
  emoji: string;
  label: string;
  activeColor: string;
}

const navItems: NavItem[] = [
  {
    path: "/notes-maker",
    icon: "fas fa-book-open",
    emoji: "📚",
    label: "Notes",
    activeColor: "text-emerald-500"
  },
  {
    path: "/excuse-generator",
    icon: "fas fa-magic",
    emoji: "🎭",
    label: "Excuses",
    activeColor: "text-amber-500"
  },
  {
    path: "/community-chat",
    icon: "fas fa-comments",
    emoji: "💬",
    label: "Chat",
    activeColor: "text-blue-500"
  },
  {
    path: "/leaderboard",
    icon: "fas fa-trophy",
    emoji: "🏆",
    label: "Leaderboard",
    activeColor: "text-yellow-500"
  }
];

export default function BottomNavigation() {
  const [location] = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50 transition-colors duration-200">
      <div className="flex items-center justify-around py-1 px-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location === item.path;
          
          return (
            <Link key={item.path} href={item.path}>
              <div
                className={`flex flex-col items-center py-1.5 px-2 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? `${item.activeColor} bg-gray-50 dark:bg-gray-800 scale-105` 
                    : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                }`}
              >
                <div className="text-lg mb-0.5">{item.emoji}</div>
                <span className="text-xs font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}