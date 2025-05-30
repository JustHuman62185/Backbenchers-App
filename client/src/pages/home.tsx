import { useState } from "react";
import ExcuseGenerator from "@/components/excuse-generator";
import NotesMaker from "@/components/notes-maker";

export default function Home() {
  const [activeFeature, setActiveFeature] = useState<"excuse" | "notes">("excuse");

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center">
                <i className="fas fa-graduation-cap text-white text-lg"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">StudyBuddy</h1>
                <p className="text-sm text-gray-600">Your academic lifesaver toolkit</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <i className="fas fa-robot text-cyan-500"></i>
                <span>Powered by LLAMA3 70B</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Feature Toggle Navigation */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl p-2 shadow-lg border border-gray-100">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveFeature("excuse")}
                className={`feature-tab flex items-center justify-center space-x-2 py-4 px-6 rounded-xl transition-all duration-300 font-medium ${
                  activeFeature === "excuse"
                    ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <i className="fas fa-comment-dots"></i>
                <span>Excuse Generator</span>
              </button>
              <button
                onClick={() => setActiveFeature("notes")}
                className={`feature-tab flex items-center justify-center space-x-2 py-4 px-6 rounded-xl transition-all duration-300 font-medium ${
                  activeFeature === "notes"
                    ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <i className="fas fa-sticky-note"></i>
                <span>Backbencher Notes</span>
              </button>
            </div>
          </div>
        </div>

        {/* Feature Sections */}
        {activeFeature === "excuse" && <ExcuseGenerator />}
        {activeFeature === "notes" && <NotesMaker />}
      </main>
    </div>
  );
}
