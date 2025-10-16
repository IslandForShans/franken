// src/App.jsx
import { useState } from 'react';
import MainPage from './components/MainPage';
import DraftSimulator from './components/DraftSimulator';
import TheorycraftingApp from './components/TheorycraftingApp';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const handleNavigate = (path) => {
    console.log('Navigating to:', path);
    if (path === '/draft') {
      setCurrentPage('draft');
    } else if (path === '/theorycrafting') {
      setCurrentPage('theorycrafting');
    } else {
      setCurrentPage('home');
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden">
      {currentPage === 'home' && <MainPage onNavigate={handleNavigate} />}
      {currentPage === 'draft' && <DraftSimulator onNavigate={handleNavigate} />}
      {currentPage === 'theorycrafting' && <TheorycraftingApp onNavigate={handleNavigate} />}
    </div>
  );
}

export default App;