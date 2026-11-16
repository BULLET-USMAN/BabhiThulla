import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext.js';
import { ToastProvider } from './context/ToastContext.js';
import { GuestAuthProvider } from './context/GuestAuthContext.js';
import { MultiplayerProvider } from './context/MultiplayerContext.js';
import { Navbar } from './components/layout/Navbar.js';
import { ErrorBoundary } from './components/common/ErrorBoundary.js';
import { initPlatformServices, lifecycleManager, platformStorage } from './platform/index.js';
import { HomeView } from './views/HomeView.js';
import { CreateRoomView } from './views/CreateRoomView.js';
import { JoinRoomView } from './views/JoinRoomView.js';
import { LobbyView } from './views/LobbyView.js';
import { GameTablePreviewView } from './views/GameTablePreviewView.js';
import { PracticeGameView } from './views/PracticeGameView.js';
import { MultiplayerGameView } from './views/MultiplayerGameView.js';
import { StatisticsView } from './views/StatisticsView.js';
import { HowToPlayView } from './views/HowToPlayView.js';
import { SettingsView } from './views/SettingsView.js';
import { NotFoundView } from './views/NotFoundView.js';

function AppLayout() {
  const location = useLocation();
  const isTable =
    location.pathname === '/table' ||
    location.pathname === '/practice' ||
    location.pathname === '/multiplayer';

  return (
    <div className="min-h-screen flex flex-col bg-charcoal-900 text-cream-100 safe-top safe-bottom safe-left safe-right">
      {!isTable && <Navbar />}
      <main className="flex-1 flex flex-col">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/create" element={<CreateRoomView />} />
            <Route path="/join" element={<JoinRoomView />} />
            <Route path="/join/:roomCode" element={<JoinRoomView />} />
            <Route path="/lobby" element={<LobbyView />} />
            <Route path="/lobby/:roomCode" element={<LobbyView />} />
            <Route path="/table" element={<GameTablePreviewView />} />
            <Route path="/practice" element={<PracticeGameView />} />
            <Route path="/multiplayer" element={<MultiplayerGameView />} />
            <Route path="/stats" element={<StatisticsView />} />
            <Route path="/statistics" element={<StatisticsView />} />
            <Route path="/history" element={<StatisticsView />} />
            <Route path="/rules" element={<HowToPlayView />} />
            <Route path="/settings" element={<SettingsView />} />
            <Route path="*" element={<NotFoundView />} />
          </Routes>
        </ErrorBoundary>
      </main>
    </div>
  );
}

export function App() {
  useEffect(() => {
    platformStorage.init();
    initPlatformServices();
    lifecycleManager.init();
  }, []);

  return (
    <SettingsProvider>
      <GuestAuthProvider>
        <ToastProvider>
          <MultiplayerProvider>
            <BrowserRouter>
              <AppLayout />
            </BrowserRouter>
          </MultiplayerProvider>
        </ToastProvider>
      </GuestAuthProvider>
    </SettingsProvider>
  );
}

export default App;
