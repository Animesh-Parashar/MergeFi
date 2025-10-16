import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Maintainer } from './pages/Maintainer';
import { Contributor } from './pages/Contributor';
import { Owner } from './pages/Owner';

function App() {
  return (
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
  );
}

export default App;
