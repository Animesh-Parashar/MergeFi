import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, User, Users, Shield } from 'lucide-react';

export function Navbar() {
  const location = useLocation();

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
              CollabPay
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

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-500 text-xs font-mono">LIVE</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
