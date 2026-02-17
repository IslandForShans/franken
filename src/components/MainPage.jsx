import React, { useState } from "react";

export default function MainPage({ onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavigation = (path) => {
    setMobileMenuOpen(false);
    if (onNavigate) onNavigate(path);
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-x-hidden overflow-y-auto">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-yellow-400 tracking-wide">
                TI4 Tools
              </h1>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-700 bg-gray-900">
            <div className="px-4 py-3 space-y-2">
              <button
                onClick={() => handleNavigation('/draft')}
                className="w-full px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors font-semibold text-center"
              >
                Franken Draft
              </button>
              <button
                onClick={() => handleNavigation('/theorycrafting')}
                className="w-full px-4 py-3 rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors font-semibold text-center"
              >
                Faction Builder
              </button>
              <button
                onClick={() => handleNavigation('/reference')}
                className="w-full sm:w-auto px-8 py-4 rounded-lg bg-teal-600 hover:bg-teal-500 transition-all hover:scale-105 font-bold text-lg shadow-lg shadow-teal-900/50"
              >
                Component Reference
              </button>
              <button
  onClick={() => handleNavigation('/mapbuilder')}
  className="w-full px-4 py-3 rounded-lg bg-orange-600 hover:bg-orange-500 transition-colors font-semibold text-center"
>
  Map Builder
</button>
<button
  onClick={() => handleNavigation('/milty')}
  className="w-full px-4 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors font-semibold text-center"
>
  Milty Draft
</button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24 relative">
          <div className="text-center">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent">
              Twilight Imperium 4
            </h2>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-400 mb-4 sm:mb-6">
              Tools and Player Aides
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
              <button
                onClick={() => handleNavigation('/draft')}
                className="w-full sm:w-auto px-8 py-4 rounded-lg bg-blue-600 hover:bg-blue-500 transition-all hover:scale-105 font-bold text-lg shadow-lg shadow-blue-900/50"
              >
                Start Franken Draft
              </button>
              <button
                onClick={() => handleNavigation('/theorycrafting')}
                className="w-full sm:w-auto px-8 py-4 rounded-lg bg-purple-600 hover:bg-purple-500 transition-all hover:scale-105 font-bold text-lg shadow-lg shadow-purple-900/50"
              >
                Build Faction
              </button>
              <button
                onClick={() => handleNavigation('/reference')}
                className="w-full sm:w-auto px-8 py-4 rounded-lg bg-teal-600 hover:bg-teal-500 transition-all hover:scale-105 font-bold text-lg shadow-lg shadow-teal-900/50"
              >
                Component Reference
              </button>
              <button
  onClick={() => handleNavigation('/mapbuilder')}
  className="w-full sm:w-auto px-8 py-4 rounded-lg bg-orange-600 hover:bg-orange-500 transition-all hover:scale-105 font-bold text-lg shadow-lg shadow-orange-900/50"
>
  Map Builder
</button>
<button
  onClick={() => handleNavigation('/milty')}
  className="w-full sm:w-auto px-8 py-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-all hover:scale-105 font-bold text-lg shadow-lg shadow-indigo-900/50"
>
  Milty Draft
</button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <h3 className="text-3xl sm:text-4xl font-bold text-center mb-8 sm:mb-12 text-yellow-400">
          Features
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Draft Simulator Card */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 sm:p-8 border border-gray-700 hover:border-blue-500 transition-all hover:shadow-xl hover:shadow-blue-900/30">
            <div className="text-4xl mb-4">🎲</div>
            <h4 className="text-xl sm:text-2xl font-bold mb-3 text-blue-400">Draft Simulator</h4>
            <p className="text-gray-300 mb-4 text-sm sm:text-base">
              Conduct drafts with customizable settings. Support for Franken, 
              Rotisserie, Power, and FrankenDraz modes.
            </p>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span>Multiple draft variants</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span>Configurable pick counts</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span>Automatic bag rotation</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span>Draft history tracking</span>
              </li>
            </ul>
          </div>

          {/* Faction Builder Card */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 sm:p-8 border border-gray-700 hover:border-purple-500 transition-all hover:shadow-xl hover:shadow-purple-900/30">
            <div className="text-4xl mb-4">🔧</div>
            <h4 className="text-xl sm:text-2xl font-bold mb-3 text-purple-400">Faction Builder</h4>
            <p className="text-gray-300 mb-4 text-sm sm:text-base">
              Build custom factions by selecting components from any faction. 
              Test ideas before your draft.
            </p>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start">
                <span className="text-purple-400 mr-2">•</span>
                <span>Browse all components</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-400 mr-2">•</span>
                <span>Load base factions</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-400 mr-2">•</span>
                <span>Export custom builds</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-400 mr-2">•</span>
                <span>Power mode support</span>
              </li>
            </ul>
          </div>

          {/* Expansions Card */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 sm:p-8 border border-gray-700 hover:border-green-500 transition-all hover:shadow-xl hover:shadow-green-900/30">
            <div className="text-4xl mb-4">🌌</div>
            <h4 className="text-xl sm:text-2xl font-bold mb-3 text-green-400">Expansion Support</h4>
            <p className="text-gray-300 mb-4 text-sm sm:text-base">
              Toggle support for official and fan expansions. Mix and match content 
              to suit your playgroup.
            </p>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start">
                <span className="text-green-400 mr-2">•</span>
                <span>Prophecy of Kings</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">•</span>
                <span>Discordant Stars (30 factions)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">•</span>
                <span>Uncharted Space (tiles)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">•</span>
                <span>Blue Reverie (6 factions)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">•</span>
                <span>Independent toggles</span>
              </li>
            </ul>
          </div>

          {/* Ban System Card */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 sm:p-8 border border-gray-700 hover:border-red-500 transition-all hover:shadow-xl hover:shadow-red-900/30">
            <div className="text-4xl mb-4">🚫</div>
            <h4 className="text-xl sm:text-2xl font-bold mb-3 text-red-400">Ban Management</h4>
            <p className="text-gray-300 mb-4 text-sm sm:text-base">
              Remove problematic factions or components from your draft pool. 
              Customize to your meta.
            </p>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start">
                <span className="text-red-400 mr-2">•</span>
                <span>Ban entire factions</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-400 mr-2">•</span>
                <span>Ban specific components</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-400 mr-2">•</span>
                <span>Carter Cut option</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-400 mr-2">•</span>
                <span>Easy toggle interface</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-400 mr-2">•</span>
                <span>Persistent settings</span>
              </li>
            </ul>
          </div>

          {/* Resource Calculator Card */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 sm:p-8 border border-gray-700 hover:border-yellow-500 transition-all hover:shadow-xl hover:shadow-yellow-900/30">
            <div className="text-4xl mb-4">📊</div>
            <h4 className="text-xl sm:text-2xl font-bold mb-3 text-yellow-400">Resource Analysis</h4>
            <p className="text-gray-300 mb-4 text-sm sm:text-base">
              Automatic calculation of optimal resource and influence allocation 
              from your drafted tiles.
            </p>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start">
                <span className="text-yellow-400 mr-2">•</span>
                <span>Total R/I calculation</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-400 mr-2">•</span>
                <span>Optimal assignments</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-400 mr-2">•</span>
                <span>Flex planet tracking</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-400 mr-2">•</span>
                <span>Draft summary reports</span>
              </li>
            </ul>
          </div>

          {/* Swap System Card */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 sm:p-8 border border-gray-700 hover:border-cyan-500 transition-all hover:shadow-xl hover:shadow-cyan-900/30">
            <div className="text-4xl mb-4">🔄</div>
            <h4 className="text-xl sm:text-2xl font-bold mb-3 text-cyan-400">Smart Swaps</h4>
            <p className="text-gray-300 mb-4 text-sm sm:text-base">
              Automatic detection of component swaps and extras. Handles special 
              faction interactions.
            </p>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start">
                <span className="text-cyan-400 mr-2">•</span>
                <span>Conditional components</span>
              </li>
              <li className="flex items-start">
                <span className="text-cyan-400 mr-2">•</span>
                <span>Automatic extras</span>
              </li>
              <li className="flex items-start">
                <span className="text-cyan-400 mr-2">•</span>
                <span>Swap suggestions</span>
              </li>
              <li className="flex items-start">
                <span className="text-cyan-400 mr-2">•</span>
                <span>Reduction helper</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 sm:p-8 border border-gray-700 hover:border-teal-500 transition-all hover:shadow-xl hover:shadow-teal-900/30">
  <div className="text-4xl mb-4">📖</div>
  <h4 className="text-xl sm:text-2xl font-bold mb-3 text-teal-400">Component Reference</h4>
  <p className="text-gray-300 mb-4 text-sm sm:text-base">
    Browse every component from every faction. Search, filter by category, and view by faction or component type.
  </p>
  <ul className="space-y-2 text-sm text-gray-400">
    <li className="flex items-start">
      <span className="text-teal-400 mr-2">•</span>
      <span>All factions, no restrictions</span>
    </li>
    <li className="flex items-start">
      <span className="text-teal-400 mr-2">•</span>
      <span>By faction or by category</span>
    </li>
    <li className="flex items-start">
      <span className="text-teal-400 mr-2">•</span>
      <span>Full component details</span>
    </li>
    <li className="flex items-start">
      <span className="text-teal-400 mr-2">•</span>
      <span>Live search & filtering</span>
    </li>
  </ul>
</div>

{/* Map Builder Card */}
<div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 sm:p-8 border border-gray-700 hover:border-orange-500 transition-all hover:shadow-xl hover:shadow-orange-900/30">
  <div className="text-4xl mb-4">🗺️</div>
  <h4 className="text-xl sm:text-2xl font-bold mb-3 text-orange-400">Map Builder</h4>
  <p className="text-gray-300 mb-4 text-sm sm:text-base">
    Drag and drop tiles onto a standard 3-ring hex grid to design your game map.
  </p>
  <ul className="space-y-2 text-sm text-gray-400">
    <li className="flex items-start">
      <span className="text-orange-400 mr-2">•</span>
      <span>Drag tiles from sidebar</span>
    </li>
    <li className="flex items-start">
      <span className="text-orange-400 mr-2">•</span>
      <span>Swap tiles between slots</span>
    </li>
    <li className="flex items-start">
      <span className="text-orange-400 mr-2">•</span>
      <span>Generates map string</span>
    </li>
    <li className="flex items-start">
      <span className="text-orange-400 mr-2">•</span>
      <span>Standard 3-ring layout</span>
    </li>
  </ul>
</div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-700 bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400">
          <p className="text-sm sm:text-base">
            TI4 Franken Draft Simulator - Community tool for Twilight Imperium 4th Edition
          </p>
          <p className="text-xs sm:text-sm mt-2">
            Disclaimer:
This tool is an unofficial fan project and is not affiliated with, endorsed by, or approved by Fantasy Flight Games or Asmodee. All game content, including faction names, component names, artwork references, and other intellectual property, belongs to Fantasy Flight Games and Asmodee. This project exists purely as a fan resource for the Twilight Imperium community and is not intended for commercial use.
This site may be taken down at any time upon request from Fantasy Flight Games, Asmodee, or any of their representatives. If you are a rights holder and would like this content removed, please contact sendit2isaiah@gmail.com.
          </p>
        </div>
      </footer>
    </div>
  );
}