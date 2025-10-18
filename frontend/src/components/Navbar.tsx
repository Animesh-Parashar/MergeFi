import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, User, Users, Shield, Wallet } from 'lucide-react';
import {
  useConnect,
  useDisconnect,
  useAccount,
} from 'wagmi'

export function Navbar() {
  const location = useLocation();
  
  // Wagmi hooks
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();

  const handleConnect = () => {
    const connector = connectors[0]; // Use first available connector (injected)
    if (connector) {
      connect({ connector });
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const links = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/maintainer', label: 'Maintainer', icon: User },
    { path: '/contributor', label: 'Contributor', icon: Users },
    { path: '/owner', label: 'Owner', icon: Shield },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-900 bg-black/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex gap-2">
              <div className="w-3 h-3 bg-red-500"></div>
              <div className="w-3 h-3 bg-yellow-500"></div>
              <div className="w-3 h-3 bg-green-500"></div>
            </div>
            <span className="text-white font-bold text-xl font-mono">
              MERGEFI
            </span>
          </Link>

          <div className="flex items-center gap-8">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className="relative group"
                >
                  <div
                    className={`flex items-center gap-2 transition-colors ${
                      isActive ? 'text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-mono text-sm">{link.label}</span>
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* MetaMask Connect Button */}
          {!isConnected ? (
            <motion.button
              onClick={handleConnect}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black font-mono text-sm rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Wallet className="w-4 h-4" />
              Connect MetaMask
            </motion.button>
          ) : (
            <motion.button
              onClick={handleDisconnect}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white font-mono text-sm rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}</span>
            </motion.button>
          )}
        </div>
      </div>
    </nav>
  );
}
