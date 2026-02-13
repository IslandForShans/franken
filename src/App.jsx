// src/App.jsx
import { useState } from 'react';
import MainPage from './components/MainPage';
import DraftSimulator from './components/DraftSimulator';
import TheorycraftingApp from './components/TheorycraftingApp';
import ComponentReference from './components/ComponentReference';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const handleNavigate = (path) => {
    console.log('Navigating to:', path);
    if (path === '/draft') {
      setCurrentPage('draft');
    } else if (path === '/theorycrafting') {
      setCurrentPage('theorycrafting');
    } else if (path === '/reference') {
  setCurrentPage('reference');
} else {
      setCurrentPage('home');
    }
  };

  return (
    // Allow the page to scroll; specific sub-containers manage their own overflow
    <div className="min-h-[100dvh] w-full overflow-x-hidden overflow-y-auto">
      {currentPage === 'home' && <MainPage onNavigate={handleNavigate} />}
      {currentPage === 'draft' && <DraftSimulator onNavigate={handleNavigate} />}
      {currentPage === 'theorycrafting' && <TheorycraftingApp onNavigate={handleNavigate} />}
      {currentPage === 'reference' && <ComponentReference onNavigate={handleNavigate} />}
    </div>
  );
}

export default App;