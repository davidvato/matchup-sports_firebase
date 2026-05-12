import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import TournamentCreation from './pages/TournamentCreation';
import TournamentDetails from './pages/TournamentDetails';
import LoginPage from './pages/LoginPage';
import SportPage from './pages/SportPage';
import ExploreSports from './pages/ExploreSports';

import GroupDetails from './pages/GroupDetails';
import BracketDetails from './pages/BracketDetails';
import Footer from './components/Footer';
const AppContent: React.FC = () => {
  const location = useLocation();
  const showNavbar = location.pathname !== '/login' &&
    location.pathname !== '/explore' &&
    !location.pathname.startsWith('/tournament/') &&
    !location.pathname.startsWith('/group/');

  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column' }}>
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/explore" element={<ExploreSports />} />
        <Route path="/create" element={<TournamentCreation />} />
        <Route path="/tournament/:id" element={<TournamentDetails />} />
        <Route path="/group/:id" element={<GroupDetails />} />
        <Route path="/bracket/:id" element={<BracketDetails />} />
        <Route path="/sport/:sportId" element={<SportPage />} />
      </Routes>
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;
