import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { NexusProvider } from '@avail-project/nexus-widgets';
import { AppWagmiProvider } from './providers/WagmiProvider';
import { Home } from './pages/Home';
import { Maintainer } from './pages/Maintainer';
import { Contributor } from './pages/Contributor';
import { Owner } from './pages/Owner';
import { testCrossChainPayment } from './testtransaction';
import { useEffect } from 'react';

function App() {

  useEffect(() => {
    // Uncomment the line below to run the test on component mount
     testCrossChainPayment();
  }, []);
  

  return (
    <AppWagmiProvider>
      <BrowserRouter>
        <NexusProvider
          // config={{
          //   debug: false, // true to view debug logs
          //   network: 'testnet', // "mainnet" (default) or "testnet"
          // }}
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