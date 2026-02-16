import { useState } from 'react';
import MainPage from './components/MainPage';
import DraftSimulator from './components/DraftSimulator';
import TheorycraftingApp from './components/TheorycraftingApp';
import ComponentReference from './components/ComponentReference';
import TI4MapBuilder from './components/TI4MapBuilder';
import DraftMapBuilder from './components/DraftMapBuilder';
import MiltyDraftPage from './components/MiltyDraftPage';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [mapBuilderDraftData, setMapBuilderDraftData] = useState(null);

  const handleNavigate = (path, data) => {
    if (path === '/mapbuilder-draft') {
      setMapBuilderDraftData(data ?? null);
      setCurrentPage('mapbuilder-draft');
    } else if (path === '/draft') {
      setCurrentPage('draft');
    } else if (path === '/milty') {
      setCurrentPage('milty');
    } else if (path === '/theorycrafting') {
      setCurrentPage('theorycrafting');
    } else if (path === '/reference') {
      setCurrentPage('reference');
    } else if (path === '/mapbuilder') {
      setCurrentPage('mapbuilder');
    } else {
      setCurrentPage('home');
    }
  };

  return (
    // Allow the page to scroll; specific sub-containers manage their own overflow
    <div className="min-h-[100dvh] w-full overflow-x-hidden overflow-y-auto">
      {currentPage === 'home' && <MainPage onNavigate={handleNavigate} />}
      {currentPage === 'draft' && <DraftSimulator onNavigate={handleNavigate} />}
      {currentPage === 'milty' && <MiltyDraftPage onNavigate={handleNavigate} />}
      {currentPage === 'theorycrafting' && <TheorycraftingApp onNavigate={handleNavigate} />}
      {currentPage === 'reference' && <ComponentReference onNavigate={handleNavigate} />}
      {currentPage === 'mapbuilder' && <TI4MapBuilder onNavigate={handleNavigate} />}
      {currentPage === 'mapbuilder-draft' && mapBuilderDraftData && (
        <DraftMapBuilder onNavigate={handleNavigate} draftData={mapBuilderDraftData} />
      )}
    </div>
  );
}

export default App;