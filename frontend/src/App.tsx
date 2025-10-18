import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './wagmiconfig';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Maintainer } from './pages/Maintainer';
import { Contributor } from './pages/Contributor';
import { Owner } from './pages/Owner';

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
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
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
