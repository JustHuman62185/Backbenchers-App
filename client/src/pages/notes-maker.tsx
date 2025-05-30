import NotesMaker from "@/components/notes-maker";

export default function NotesMakerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900 pb-20 transition-colors duration-200">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-3 py-2">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-lg flex items-center justify-center">
                <i className="fas fa-book-open text-white text-xs"></i>
              </div>
              <h1 className="text-sm font-bold text-gray-900">Backbencher Notes</h1>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-3 py-3 pb-16">
        <NotesMaker />
      </main>
    </div>
  );
}