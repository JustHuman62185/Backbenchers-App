import ExcuseGenerator from "@/components/excuse-generator";

export default function ExcuseGeneratorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-amber-900 pb-20 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-3 py-2">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-amber-400 to-red-400 rounded-lg flex items-center justify-center">
                <i className="fas fa-magic text-white text-xs"></i>
              </div>
              <h1 className="text-sm font-bold text-gray-900">Excuse Generator</h1>
            </div>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-3 py-3 pb-16">
        <ExcuseGenerator />
      </main>
    </div>
  );
}