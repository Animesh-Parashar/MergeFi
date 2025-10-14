import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import RevenueSplitSetup from './pages/RevenueSplitSetup';
import ContributorEarnings from './pages/ContributorEarnings';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/revenue-split/:repoId" 
            element={
              <ProtectedRoute>
                <RevenueSplitSetup />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/earnings/:repoId" 
            element={
              <ProtectedRoute>
                <ContributorEarnings />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
