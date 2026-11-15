import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext.js';
import { ToastProvider } from './context/ToastContext.js';
import { Navbar } from './components/layout/Navbar.js';
import { HomeView } from './views/HomeView.js';
import { CreateRoomView } from './views/CreateRoomView.js';
import { JoinRoomView } from './views/JoinRoomView.js';
import { LobbyView } from './views/LobbyView.js';
import { GameTablePreviewView } from './views/GameTablePreviewView.js';
import { HowToPlayView } from './views/HowToPlayView.js';
import { SettingsView } from './views/SettingsView.js';
import { NotFoundView } from './views/NotFoundView.js';

function AppLayout() {
  const location = useLocation();
  const isTable = location.pathname === '/table';

  return (
    <div className="min-h-screen flex flex-col bg-charcoal-900 text-cream-100">
      {!isTable && <Navbar />}
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="/create" element={<CreateRoomView />} />
          <Route path="/join" element={<JoinRoomView />} />
          <Route path="/lobby" element={<LobbyView />} />
          <Route path="/lobby/:roomCode" element={<LobbyView />} />
          <Route path="/table" element={<GameTablePreviewView />} />
          <Route path="/rules" element={<HowToPlayView />} />
          <Route path="/settings" element={<SettingsView />} />
          <Route path="*" element={<NotFoundView />} />
        </Routes>
      </main>
    </div>
  );
}

export function App() {
  return (
    <SettingsProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </ToastProvider>
    </SettingsProvider>
  );
}

export default App;
