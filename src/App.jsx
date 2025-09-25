import React, { useState } from "react";
import DraftSimulator from "./components/DraftSimulator.jsx";
import TheorycraftingApp from "./components/TheorycraftingApp.jsx";

export default function App() {
  const [currentPage, setCurrentPage] = useState("draft");

  return (
    <div className="h-screen w-screen bg-gray-200">
      {/* Navigation Bar */}
      <div className="bg-gray-800 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Twilight Imperium 4 - Franken Faction Tools</h1>
          <nav className="flex space-x-4">
            <button
              className={`px-4 py-2 rounded transition-colors ${
                currentPage === "draft" 
                  ? "bg-blue-600 text-white" 
                  : "bg-gray-600 hover:bg-gray-500 text-gray-200"
              }`}
              onClick={() => setCurrentPage("draft")}
            >
              Draft Simulator
            </button>
            <button
              className={`px-4 py-2 rounded transition-colors ${
                currentPage === "theory" 
                  ? "bg-blue-600 text-white" 
                  : "bg-gray-600 hover:bg-gray-500 text-gray-200"
              }`}
              onClick={() => setCurrentPage("theory")}
            >
              Faction Builder
            </button>
          </nav>
        </div>
      </div>

      {/* Page Content */}
      <div className="h-[calc(100vh-80px)]">
        {currentPage === "draft" && <DraftSimulator />}
        {currentPage === "theory" && <TheorycraftingApp />}
      </div>
    </div>
  );
}