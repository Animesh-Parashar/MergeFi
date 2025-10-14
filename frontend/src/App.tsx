import { useState } from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import RevenueSplitSetup from './components/RevenueSplitSetup';
import ContributorEarnings from './components/ContributorEarnings';
import WalletModal from './components/WalletModal';

type Screen = 'landing' | 'dashboard' | 'revenue-split' | 'earnings';

interface User {
  username: string;
  avatar: string;
}

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isGithubConnected, setIsGithubConnected] = useState(false);
  const [selectedRepoId, setSelectedRepoId] = useState<string>('');
  const [user, setUser] = useState<User>({
    username: 'alex_developer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex'
  });

  const handleConnectGithub = () => {
    setIsGithubConnected(true);
    setUser({
      username: 'alex_developer',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex'
    });
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    setIsGithubConnected(false);
    setCurrentScreen('landing');
  };

  const handleSetupRevenue = (repoId: string) => {
    setSelectedRepoId(repoId);
    setCurrentScreen('revenue-split');
  };

  const handleViewEarnings = (repoId: string) => {
    setSelectedRepoId(repoId);
    setCurrentScreen('earnings');
  };

  const handleBackToDashboard = () => {
    setCurrentScreen('dashboard');
  };

  const handleDeploy = () => {
    setIsWalletModalOpen(true);
  };

  const handleWalletConnect = (chain: string) => {
    console.log('Connected to:', chain);
  };

  const repoMockData: Record<string, { name: string; description: string; contractAddress: string }> = {
    '1': {
      name: 'awesome-web3-toolkit',
      description: 'A comprehensive toolkit for building decentralized applications',
      contractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
    },
    '2': {
      name: 'blockchain-payment-gateway',
      description: 'Open-source payment gateway with multi-chain support',
      contractAddress: '0x842d35Cc6634C0532925a3b844Bc9e7595f0bEc'
    },
    '3': {
      name: 'defi-analytics-platform',
      description: 'Real-time analytics dashboard for DeFi protocols',
      contractAddress: '0x942d35Cc6634C0532925a3b844Bc9e7595f0bEd'
    }
  };

  const currentRepo = repoMockData[selectedRepoId] || repoMockData['1'];

  return (
    <>
      {currentScreen === 'landing' && (
        <LandingPage onConnectGithub={handleConnectGithub} />
      )}

      {currentScreen === 'dashboard' && (
        <Dashboard
          user={user}
          onLogout={handleLogout}
          onSetupRevenue={handleSetupRevenue}
          onViewEarnings={handleViewEarnings}
        />
      )}

      {currentScreen === 'revenue-split' && (
        <RevenueSplitSetup
          repoName={currentRepo.name}
          repoDescription={currentRepo.description}
          onBack={handleBackToDashboard}
          onDeploy={handleDeploy}
        />
      )}

      {currentScreen === 'earnings' && (
        <ContributorEarnings
          repoName={currentRepo.name}
          contractAddress={currentRepo.contractAddress}
          onBack={handleBackToDashboard}
        />
      )}

      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onConnect={handleWalletConnect}
      />
    </>
  );
}

export default App;
