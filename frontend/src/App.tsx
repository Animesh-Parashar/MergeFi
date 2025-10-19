import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './wagmiconfig';
import { Navbar } from './components/Navbar';
import { NexusProvider } from '@avail-project/nexus-widgets';
import { AppWagmiProvider } from './providers/WagmiProvider';
import { Home } from './pages/Home';
import { Maintainer } from './pages/Maintainer';
import { Contributor } from './pages/Contributor';
import { Owner } from './pages/Owner';

const queryClient = new QueryClient();

function App() {
  return (
    <AppWagmiProvider>
      <BrowserRouter>
        <NexusProvider
          config={{
            debug: false, // true to view debug logs
            network: 'testnet', // "mainnet" (default) or "testnet"
          }}
        >
          <div className="min-h-screen bg-black">
            <Navbar />
            <div className="pt-16">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/maintainer" element={<Maintainer />} />
                <Route path="/contributor" element={<Contributor />} />
                <Route path="/owner" element={<Owner />} />
              </Routes>
            </div>
          </div>
        </NexusProvider>
      </BrowserRouter>
    </AppWagmiProvider>
  );
}

export default App;