import React, { useState } from "react";

export default function MainPage({ onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavigation = (path) => {
    setMobileMenuOpen(false);
    if (onNavigate) onNavigate(path);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-x-hidden overflow-y-auto">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-yellow-400 tracking-wide">
                TI4 Franken Draft
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
                Draft Simulator
              </button>
              <button
                onClick={() => handleNavigation('/theorycrafting')}
                className="w-full px-4 py-3 rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors font-semibold text-center"
              >
                Faction Builder
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
              Franken Draft Simulator
            </h3>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-8 sm:mb-12 px-4">
              Create custom factions by drafting individual components from all TI4 factions. 
              Perfect for balanced, unique gameplay experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
              <button
                onClick={() => handleNavigation('/draft')}
                className="w-full sm:w-auto px-8 py-4 rounded-lg bg-blue-600 hover:bg-blue-500 transition-all hover:scale-105 font-bold text-lg shadow-lg shadow-blue-900/50"
              >
                Start Drafting
              </button>
              <button
                onClick={() => handleNavigation('/theorycrafting')}
                className="w-full sm:w-auto px-8 py-4 rounded-lg bg-purple-600 hover:bg-purple-500 transition-all hover:scale-105 font-bold text-lg shadow-lg shadow-purple-900/50"
              >
                Build Faction
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
              Conduct multiplayer drafts with customizable settings. Support for Franken, 
              Rotisserie, and Power modes.
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
              Theorcraft custom factions by selecting components from any faction. 
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
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl sm:text-4xl font-bold text-center mb-8 sm:mb-12 text-yellow-400">
            How It Works
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h4 className="text-lg sm:text-xl font-bold mb-2 text-blue-400">Configure</h4>
              <p className="text-sm text-gray-400">
                Set player count, draft variant, and enable desired expansions
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h4 className="text-lg sm:text-xl font-bold mb-2 text-purple-400">Draft</h4>
              <p className="text-sm text-gray-400">
                Players take turns selecting components from rotating bags
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h4 className="text-lg sm:text-xl font-bold mb-2 text-green-400">Reduce</h4>
              <p className="text-sm text-gray-400">
                Remove excess components to meet final faction limits
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                4
              </div>
              <h4 className="text-lg sm:text-xl font-bold mb-2 text-yellow-400">Play</h4>
              <p className="text-sm text-gray-400">
                Export your custom factions and start your epic game!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-2xl p-8 sm:p-12 lg:p-16 text-center border border-blue-700">
          <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
            Ready to Create Your Perfect Faction?
          </h3>
          <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Start drafting now and experience TI4 in a whole new way
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => handleNavigation('/draft')}
              className="w-full sm:w-auto px-10 py-4 rounded-lg bg-blue-600 hover:bg-blue-500 transition-all hover:scale-105 font-bold text-lg shadow-lg"
            >
              Launch Draft Simulator
            </button>
            <button
              onClick={() => handleNavigation('/theorycrafting')}
              className="w-full sm:w-auto px-10 py-4 rounded-lg bg-purple-600 hover:bg-purple-500 transition-all hover:scale-105 font-bold text-lg shadow-lg"
            >
              Open Faction Builder
            </button>
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
            Not affiliated with Fantasy Flight Games
          </p>
        </div>
      </footer>
    </div>
  );
}