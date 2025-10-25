import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, User, Users, Shield, ChevronDown, Wallet, Copy, Check, Activity, List } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { sepolia, arbitrumSepolia } from 'wagmi/chains';
import { useWalletStore } from '../store/walletStore';

const USDC_SEPOLIA = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';
const USDC_ARBITRUM = '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d';


export function Navbar() {
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // Sync with global store
  const setWalletState = useWalletStore((state) => state.setWalletState);

  useEffect(() => {
    setWalletState({
      isConnected,
      address: address || null,
      chainId: chainId || null,
    });
  }, [isConnected, address, chainId, setWalletState]);



  // API call function to send user data
  const sendUserData = async (walletAddress: string, chainId: number, githubUsername: string = 'demo_user') => {
    setIsSyncing(true);
    try {
      // console.log('Sending user data:', {
      //   github_username: githubUsername,
      //   walletaddress: walletAddress,
      //   chain: chainId
      // });

      const response = await fetch('https://mergefi.onrender.com/api/set-user-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          github_username: githubUsername,
          walletaddress: walletAddress,
          chain: chainId
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // console.log('✅ User data saved successfully:', result);s
      } else {
        const error = await response.json();
        console.error('❌ Failed to save user data:', error);
      }
    } catch (error) {
      console.error('❌ Error sending user data:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Fetch GitHub username from API using cookie token
  const fetchGithubUsername = async (): Promise<string> => {
    try {
      const response = await fetch('https://mergefi.onrender.com/api/auth/user', {
        credentials: 'include' // Include cookies
      });

      if (response.ok) {
        const userData = await response.json();
        // console.log('✅ Fetched GitHub user:', userData.login);
        return userData.login; // GitHub username is in 'login' field
      } else {
        console.log('❌ Not authenticated or no GitHub token');
        return 'demo_user';
      }
    } catch (error) {
      console.error('❌ Error fetching GitHub user:', error);
      return 'demo_user';
    }
  };

  // Send user data when wallet connects or address/chain changes
  useEffect(() => {
    if (isConnected && address && chainId) {
      const sendData = async () => {
        const githubUsername = await fetchGithubUsername();
        // console.log('🔄 Wallet state changed - sending user data:', {
        //   address: formatAddress(address),
        //   chainId,
        //   githubUsername
        // });
        sendUserData(address, chainId, githubUsername);
      };

      sendData();
    }
  }, [isConnected, address, chainId]);

  // Token balances
  const { data: usdcSepoliaBalance } = useBalance({
    address,
    token: USDC_SEPOLIA,
    chainId: sepolia.id,
  });

  const { data: usdcArbitrumBalance } = useBalance({
    address,
    token: USDC_ARBITRUM,
    chainId: arbitrumSepolia.id,
  });

  const links = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/maintainer', label: 'Maintainer', icon: User },
    { path: '/contributor', label: 'Contributor', icon: Users },
    { path: '/listed-repos', label: 'Listed Repos', icon: List },
    { path: '/transactions', label: 'Transactions', icon: Activity },
  ];

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatAddressDropdown = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const formatBalance = (balance: any, symbol: string) => {
    if (!balance) return `0 ${symbol}`;
    const formatted = parseFloat(balance.formatted).toFixed(2);
    return `${formatted} ${symbol}`;
  };

  const copyAddressToClipboard = async () => {
    if (!address) return;

    try {
      await navigator.clipboard.writeText(address);
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleWalletConnect = () => {
    if (isConnected) {
      setShowDropdown(!showDropdown);
    } else {
      // Connect with MetaMask (first connector)
      const metamaskConnector = connectors.find(connector => connector.name === 'MetaMask');
      if (metamaskConnector) {
        connect({ connector: metamaskConnector });
      }
    }
  };

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
              MergeFi
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
                    className={`flex items-center gap-2 transition-colors ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'
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

          {/* Wallet Connection */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={handleWalletConnect}
              className="group relative"
            >
              <div className="absolute inset-0 border-2 border-dashed border-gray-600 bg-gray-900/20 transition-all duration-300 group-hover:border-gray-400 group-hover:shadow-lg group-hover:shadow-white/10"></div>
              <div className="relative border-2 border-dashed border-gray-400 bg-transparent text-white font-bold px-4 py-2 text-sm transition-all duration-300 group-hover:border-gray-300 group-hover:bg-gray-900/30 transform translate-x-0.5 translate-y-0.5 group-hover:translate-x-0 group-hover:translate-y-0">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  <span>
                    {isConnected && address ? formatAddress(address) : 'Connect Wallet'}
                  </span>
                  {isSyncing && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  )}
                  {isConnected && <ChevronDown className="w-3 h-3" />}
                </div>
              </div>
            </button>

            {/* Dropdown */}
            {showDropdown && isConnected && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 top-full mt-2 w-80 bg-black border border-gray-700 shadow-2xl z-50"
              >
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-gray-400" />
                      <span className="text-white font-mono text-sm">Wallet</span>
                    </div>
                    <button
                      onClick={() => {
                        disconnect();
                        setShowDropdown(false);
                      }}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>

                  {/* Address */}
                  <div className="mb-4">
                    <div className="text-xs text-gray-400 mb-1">Address</div>
                    <div className="flex items-center justify-between bg-gray-900/50 border border-gray-800 px-3 py-2 rounded">
                      <span className="font-mono text-sm text-white">
                        {address && formatAddressDropdown(address)}
                      </span>
                      <button
                        onClick={copyAddressToClipboard}
                        className="ml-2 text-gray-400 hover:text-white transition-colors"
                        title="Copy address"
                      >
                        {addressCopied ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>



                  {/* Balances */}
                  <div className="space-y-4">
                    {/* Sepolia Testnet */}
                    <div>
                      <div className="text-xs text-gray-400 mb-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Sepolia Testnet
                      </div>
                      <div className="space-y-2 ml-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-300">USDC</span>
                          <span className="text-sm font-mono text-white">
                            {formatBalance(usdcSepoliaBalance, 'USDC')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Arbitrum Sepolia */}
                    <div>
                      <div className="text-xs text-gray-400 mb-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        Arbitrum Sepolia
                      </div>
                      <div className="space-y-2 ml-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-300">USDC</span>
                          <span className="text-sm font-mono text-white">
                            {formatBalance(usdcArbitrumBalance, 'USDC')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-3 border-t border-gray-800 text-xs text-gray-500 text-center">
                    Click outside to close
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
