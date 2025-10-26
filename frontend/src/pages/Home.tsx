import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, Coins, Shield, Award, X, CheckCircle } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export function Home() {
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentStep, setCurrentStep] = useState('initial');
  const [availableOptions, setAvailableOptions] = useState<string[]>([]);
  const [showCursor, setShowCursor] = useState(true);
  const [githubUser, setGithubUser] = useState<any>(null);
  const [authProcessed, setAuthProcessed] = useState(false);
  const [registeredRepos, setRegisteredRepos] = useState<any[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Cursor blinking effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Focus input when terminal opens
  useEffect(() => {
    if (showTerminal && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showTerminal]);

  // Check if user is already authenticated on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Listen for OAuth completion message from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from our backend domain
      const backendURL = 'https://mergefi.onrender.com'; // Should match your backend URL
      if (!event.origin.includes(backendURL)) return;

      if (event.data.type === 'GITHUB_AUTH_SUCCESS') {
        handleAuthSuccess();
      } else if (event.data.type === 'GITHUB_AUTH_ERROR') {
        handleAuthError(event.data.error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    fetchRegisteredRepos();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get('https://mergefi.onrender.com/api/auth/status', {
        withCredentials: true,
      });

      if (response.data.authenticated) {
        setGithubUser(response.data.user);
        setIsConnected(true);

        // Only show success message if we haven't processed auth yet and terminal is open
        if (!authProcessed && showTerminal) {
          setCurrentStep('connected');
          setTerminalLines(prev => [
            ...prev,
            '✅ GitHub connection successful!',
            `👤 Authenticated as: @${response.data.user.login}`,
            `📧 Email: ${response.data.user.email || 'Not public'}`,
            '',
            '📝 Type "ls" to see available options...',
            '',
          ]);
          setAuthProcessed(true);
          setIsConnecting(false);
        }
      }
    } catch (error) {
      // User not authenticated, which is fine
      console.log('User not authenticated');
    }
  };

  const fetchRegisteredRepos = async () => {
    setLoadingRepos(true);
    try {
      const response = await axios.get('https://mergefi.onrender.com/api/repos/all-listed');
      if (response.data.success) {
        setRegisteredRepos(response.data.repos);
      }
    } catch (error) {
      console.error('Error fetching listed repos:', error);
    }
    setLoadingRepos(false);
  };

  const handleGitHubConnect = () => {
    setShowTerminal(true);
    setAuthProcessed(false);
    setTerminalLines([
      'MergeFi Terminal v1.0.0',
      'Initializing GitHub OAuth connection...',
      '',
    ]);

    setTimeout(() => {
      setIsConnecting(true);
      setTerminalLines(prev => [
        ...prev,
        '🔗 Connecting to GitHub...',
        '🔐 Opening authentication window...',
      ]);

      // Open GitHub OAuth in popup
      const popup = window.open(
        'https://mergefi.onrender.com/auth/github',
        'github-oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      // Poll to check if popup is closed
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          // Check auth status after popup closes
          setTimeout(() => {
            if (!authProcessed) { // Only check if we haven't processed auth yet
              checkAuthStatus().then(() => {
                if (!isConnected && !authProcessed) {
                  handleAuthError('Authentication was cancelled or failed');
                }
              });
            }
          }, 1000);
        }
      }, 1000);
    }, 1000);
  };

  const handleAuthSuccess = async () => {
    // Prevent duplicate processing
    if (authProcessed) return;

    try {
      // Fetch user data
      const response = await axios.get('https://mergefi.onrender.com/api/auth/user', {
        withCredentials: true,
      });

      const user = response.data;
      setGithubUser(user);
      setIsConnecting(false);
      setIsConnected(true);
      setCurrentStep('connected');
      setAuthProcessed(true); // Mark as processed

      setTerminalLines(prev => [
        ...prev,
        '✅ GitHub connection successful!',
        `👤 Authenticated as: @${user.login}`,
        `📧 Email: ${user.email || 'Not public'}`,
        '',
        '📝 Type "ls" to see available options...',
        '',
      ]);
    } catch (error) {
      handleAuthError('Failed to fetch user data');
    }
  };

  const handleAuthError = (error: string) => {
    setIsConnecting(false);
    setIsConnected(false);
    setAuthProcessed(true); // Mark as processed to prevent further checks
    setTerminalLines(prev => [
      ...prev,
      `❌ Authentication failed: ${error}`,
      '',
      '💡 You can try connecting again by typing "retry"',
      '',
    ]);
  };

  const handleCommand = (command: string) => {
    const cmd = command.trim().toLowerCase();
    const promptLine = `user@mergefi:~$ ${command}`;

    setTerminalLines(prev => [...prev, promptLine]);
    setCurrentInput('');

    switch (currentStep) {
      case 'connected':
        if (cmd === 'ls') {
          setCurrentStep('ls');
          setAvailableOptions(['Contributor', 'Maintainer']);
          setTerminalLines(prev => [
            ...prev,
            '',
            '📁 Available roles:',
            '',
            '  📝 Contributor  - Earn rewards for your contributions',
            '  🔧 Maintainer   - Manage repositories and reward pools',
            '',
            '💡 Type a role name to continue (Contributor/Maintainer)...',
            '',
          ]);
        } else if (cmd === 'help') {
          setTerminalLines(prev => [
            ...prev,
            '',
            'Available commands:',
            '  ls      - List available options',
            '  help    - Show this help message',
            '  clear   - Clear terminal',
            '  whoami  - Show current user info',
            '',
          ]);
        } else if (cmd === 'whoami') {
          setTerminalLines(prev => [
            ...prev,
            '',
            `👤 GitHub User: @${githubUser?.login}`,
            `📧 Email: ${githubUser?.email || 'Not public'}`,
            `🏢 Company: ${githubUser?.company || 'Not specified'}`,
            `📍 Location: ${githubUser?.location || 'Not specified'}`,
            `⭐ Public Repos: ${githubUser?.public_repos || 0}`,
            `👥 Followers: ${githubUser?.followers || 0}`,
            '',
          ]);
        } else if (cmd === 'clear') {
          setTerminalLines([
            'MergeFi Terminal v1.0.0',
            '✅ GitHub connection successful!',
            `👤 Authenticated as: @${githubUser?.login}`,
            '',
            '📝 Type "ls" to see available options...',
            '',
          ]);
        } else {
          setTerminalLines(prev => [
            ...prev,
            `Command '${command}' not found. Type 'help' for available commands.`,
            '',
          ]);
        }
        break;

      case 'ls':
        if (cmd === 'contributor') {
          setCurrentStep('choose');
          setTerminalLines(prev => [
            ...prev,
            '',
            '🎯 Redirecting to Contributor Dashboard...',
            '⚡ Setting up your contributor environment...',
            '',
          ]);
          setTimeout(() => {
            setShowTerminal(false);
            navigate('/contributor');
          }, 2000);
        } else if (cmd === 'maintainer') {
          setCurrentStep('choose');
          setTerminalLines(prev => [
            ...prev,
            '',
            '🔧 Redirecting to Maintainer Dashboard...',
            '⚡ Loading repository management tools...',
            '',
          ]);
          setTimeout(() => {
            setShowTerminal(false);
            navigate('/maintainer');
          }, 2000);
        } else if (cmd === 'ls') {
          setTerminalLines(prev => [
            ...prev,
            '',
            '📁 Available roles:',
            '',
            '  📝 Contributor  - Earn rewards for your contributions',
            '  🔧 Maintainer   - Manage repositories and reward pools',
            '',
            '💡 Type a role name to continue (Contributor/Maintainer)...',
            '',
          ]);
        } else if (cmd === 'help') {
          setTerminalLines(prev => [
            ...prev,
            '',
            'Available commands:',
            '  Contributor - Access contributor dashboard',
            '  Maintainer  - Access maintainer dashboard',
            '  ls          - List available options',
            '  help        - Show this help message',
            '  clear       - Clear terminal',
            '  back        - Go back to main menu',
            '',
          ]);
        } else if (cmd === 'back') {
          setCurrentStep('connected');
          setTerminalLines(prev => [
            ...prev,
            '',
            '📝 Type "ls" to see available options...',
            '',
          ]);
        } else if (cmd === 'clear') {
          setTerminalLines([
            'MergeFi Terminal v1.0.0',
            '✅ GitHub connection successful!',
            `👤 Authenticated as: @${githubUser?.login}`,
            '',
            '📁 Available roles:',
            '',
            '  📝 Contributor  - Earn rewards for your contributions',
            '  🔧 Maintainer   - Manage repositories and reward pools',
            '',
            '💡 Type a role name to continue (Contributor/Maintainer)...',
            '',
          ]);
        } else {
          setTerminalLines(prev => [
            ...prev,
            `Role '${command}' not found. Available: Contributor, Maintainer`,
            '',
          ]);
        }
        break;

      default:
        if (cmd === 'retry') {
          handleGitHubConnect();
        } else {
          setTerminalLines(prev => [
            ...prev,
            'Please authenticate with GitHub first or type "retry" to try again.',
            '',
          ]);
        }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentInput.trim() && !isConnecting && currentStep !== 'choose') {
      handleCommand(currentInput);
    }
  };

  const closeTerminal = () => {
    setShowTerminal(false);
    setTerminalLines([]);
    setCurrentInput('');
    setIsConnecting(false);
    setAuthProcessed(false);
    setCurrentStep(isConnected ? 'connected' : 'initial');
    setAvailableOptions([]);
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Hero Section */}
      <section className="relative px-6 py-20 lg:px-12 overflow-hidden">
        {/* ...existing hero content... */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="grid grid-cols-20 gap-1 h-full">
            {Array.from({ length: 100 }).map((_, i) => (
              <div key={i} className="text-gray-500 text-xs animate-pulse">
                {['$', '>', '|', '_', '█'][Math.floor(Math.random() * 5)]}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="mb-8">
              <pre className="text-white text-sm lg:text-[20px] font-bold leading-none inline-block">
                {`
 ███╗   ███╗███████╗██████╗  ██████╗ ███████╗███████╗██╗
 ████╗ ████║██╔════╝██╔══██╗██╔════╝ ██╔════╝██╔════╝██║
 ██╔████╔██║█████╗  ██████╔╝██║  ███╗█████╗  █████╗  ██║
 ██║╚██╔╝██║██╔══╝  ██╔══██╗██║   ██║██╔══╝  ██╔══╝  ██║
 ██║ ╚═╝ ██║███████╗██║  ██║╚██████╔╝███████╗██║     ██║
 ╚═╝     ╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝     ╚═╝
`}
              </pre>
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
              Empowering Open Source Collaboration
              <br />
              with <span className="text-gray-400">Automated Rewards</span>
            </h1>

            <p className="text-lg text-gray-400 leading-relaxed max-w-3xl mx-auto mb-12">
              Earn USDC for your contributions. Verified, transparent, and on-chain.
              <br />
              MergeFi bridges the gap between open source work and fair compensation.
            </p>

            <div className="flex justify-center items-center gap-4">
              {isConnected && githubUser ? (
                <button
                  onClick={handleGitHubConnect}
                  className="group relative"
                >
                <div className="flex items-center gap-4">
                  <div className="group relative">
                    <div className="absolute inset-0 border-2 border-dashed border-gray-600 bg-gray-900/20"></div>
                    <div className="relative border-2 border-dashed border-gray-400 bg-transparent px-6 py-3 transform translate-x-1 translate-y-1">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-green-400">Connected to GitHub</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-400">@{githubUser.login}</span>
                      </div>
                    </div>
                  </div>
                </div>
                </button>
              ) : (
                <button
                  onClick={handleGitHubConnect}
                  className="group relative"
                >
                  <div className="absolute inset-0 border-2 border-dashed border-gray-600 bg-gray-900/20 transition-all duration-300 group-hover:border-gray-400 group-hover:shadow-lg group-hover:shadow-white/10"></div>
                  <div className="relative border-2 border-dashed border-gray-400 bg-transparent text-white font-bold px-8 py-3 text-base transition-all duration-300 group_hover:border-gray-300 group_hover:bg-gray-900/30 transform translate-x-1 translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0">
                    <span className="flex items-center gap-3">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                      </svg>
                      Connect to GitHub
                    </span>
                  </div>
                </button>
               )}
            </div>
          </motion.div>

          {/* Terminal Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-5xl mx-auto"
          >
            <Card className="bg-gradient-to-br from-gray-950 to-black border-gray-700">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-red-500"></div>
                    <div className="w-3 h-3 bg-yellow-500"></div>
                    <div className="w-3 h-3 bg-green-500"></div>
                  </div>
                  <span className="text-gray-400 text-sm">mergefi-terminal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-500 text-xs">LIVE</span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="text-gray-400">$ mergefi status --active</div>
                <div className="text-white">✓ Platform Status: Online</div>
                <div className="text-white">✓ Payment Network: USDC</div>
                <div className="text-white">✓ Verified Repos: 247</div>
                <div className="text-white">✓ Total Contributors: 1,829</div>
                <div className="text-green-400">✓ Total Rewards Distributed: $54,290 USDC</div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Terminal Modal */}
      <AnimatePresence>
        {showTerminal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeTerminal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black border border-gray-700 shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
            >
              {/* Terminal Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full cursor-pointer hover:bg-red-400" onClick={closeTerminal}></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-400 text-sm">mergefi-connect</span>
                </div>
                <button
                  onClick={closeTerminal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Terminal Content */}
              <div className="p-6 h-96 overflow-y-auto bg-black font-mono text-sm">
                <div className="space-y-1">
                  {terminalLines.map((line, index) => (
                    <div
                      key={index}
                      className={`${line.startsWith('user@mergefi')
                        ? 'text-white'
                        : line.includes('✅') || line.includes('🎯') || line.includes('🔧')
                          ? 'text-green-400'
                          : line.includes('🔗') || line.includes('🔐') || line.includes('⚡')
                            ? 'text-blue-400'
                            : line.includes('📝') || line.includes('💡')
                              ? 'text-yellow-400'
                              : line.includes('👤') || line.includes('📁')
                                ? 'text-cyan-400'
                                : line.startsWith('Command') || line.startsWith('Role')
                                  ? 'text-red-400'
                                  : 'text-gray-300'
                        }`}
                    >
                      {line}
                    </div>
                  ))}

                  {/* Loading indicator */}
                  {isConnecting && (
                    <div className="flex items-center gap-2 text-blue-400">
                      <div className="flex gap-1">
                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span>Connecting...</span>
                    </div>
                  )}

                  {/* Input line */}
                  {!isConnecting && isConnected && currentStep !== 'choose' && (
                    <div className="flex items-center text-white">
                      <span className="text-green-400">user@mergefi</span>
                      <span className="text-gray-500">:</span>
                      <span className="text-blue-400">~</span>
                      <span className="text-white">$ </span>
                      <input
                        ref={inputRef}
                        type="text"
                        value={currentInput}
                        onChange={(e) => setCurrentInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="bg-transparent border-none outline-none text-white flex-1 font-mono"
                        autoComplete="off"
                        spellCheck="false"
                      />
                      <span className={`text-white ${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
                        █
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Terminal Footer */}
              <div className="px-6 py-3 bg-gray-900 border-t border-gray-700 text-xs text-gray-500">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <span>Status: {isConnected ? 'Connected' : 'Connecting...'}</span>
                    {isConnected && currentStep === 'connected' && (
                      <span className="text-yellow-400">Type "ls" to continue</span>
                    )}
                    {currentStep === 'ls' && (
                      <span className="text-yellow-400">Type "Contributor" or "Maintainer"</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Press Esc to close</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Escape key handler */}
      {showTerminal && (
        <div
          className="fixed inset-0 pointer-events-none"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              closeTerminal();
            }
          }}
          tabIndex={0}
        />
      )}

      {/* How It Works Section - same as before */}
      <section className="px-6 py-20 lg:px-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Open for Contributions
            </h2>
            <p className="text-gray-400 text-lg">
              Discover repositories actively seeking contributors with reward pools
            </p>
          </motion.div>

          {loadingRepos ? (
            <div className="flex justify-center items-center py-12">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-gray-600 border-t-white rounded-full animate-spin"></div>
                <span className="text-gray-400">Loading repositories...</span>
              </div>
            </div>
          ) : registeredRepos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No repositories open for contributions yet</p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {registeredRepos.slice(0, 3).map((repo, index) => (
                  <motion.div
                    key={repo.github_repo_id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card hover className="h-full">
                      <div className="flex flex-col h-full">
                        {/* Header with Repo Name and Stats */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg mb-2">{repo.name}</h3>
                            <p className="text-xs text-gray-500 mb-3">
                              {repo.full_name}
                            </p>
                          </div>
                          {repo.language && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-gray-900 border border-gray-700 rounded text-xs">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span>{repo.language}</span>
                            </div>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-400 mb-4 line-clamp-2 flex-grow">
                          {repo.description || 'No description provided'}
                        </p>

                        {/* Stats Row */}
                        <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span>{repo.stargazers_count || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            <span>{repo.forks_count || 0}</span>
                          </div>
                        </div>

                        {/* Pool Reward Section */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                          <div>
                            <div className="text-sm font-semibold text-gray-300">
                              Pool: <span className="text-green-400">${repo.pool_reward?.toLocaleString() || 0}</span> USDC
                            </div>
                          </div>
                          <a
                            href={repo.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm hover:text-gray-300 transition-colors"
                          >
                            <span>View</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* View All Button */}
              {registeredRepos.length > 3 && (
                <div className="flex justify-center">
                  <button
                    onClick={() => navigate('/listed-repos')}
                    className="group relative"
                  >
                    <div className="absolute inset-0 border-2 border-dashed border-gray-600 bg-gray-900/20 transition-all duration-300 group-hover:border-gray-400 group-hover:shadow-lg group-hover:shadow-white/10"></div>
                    <div className="relative border-2 border-dashed border-gray-400 bg-transparent text-white font-bold px-8 py-3 text-base transition-all duration-300 group_hover:border-gray-300 group_hover:bg-gray-900/30 transform translate-x-1 translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0">
                      <span className="flex items-center gap-3">
                        View All {registeredRepos.length} Repositories
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </span>
                    </div>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <section className="px-6 py-20 lg:px-12 border-t border-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">Platform Features</h2>
            <p className="text-xl text-gray-400">
              Built for the future of collaborative development
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'AI-Driven Allocation',
                description:
                  'Smart algorithms suggest fair reward distribution based on contribution complexity and impact',
              },
              {
                title: 'Decentralized Payments',
                description:
                  'All transactions processed on-chain with USDC for transparency and security',
              },
              {
                title: 'NFT Achievement Badges',
                description:
                  'Contributors earn unique NFT badges as proof of their contributions to verified repos',
              },
              {
                title: 'Repository Verification',
                description:
                  'Multi-step verification ensures only legitimate projects participate in the reward system',
              },
              {
                title: 'Real-Time Analytics',
                description:
                  'Track contributions, earnings, and platform activity with comprehensive dashboards',
              },
              {
                title: 'Cross-Chain Ready',
                description:
                  'Avail integration planned for seamless cross-chain payouts and enhanced scalability',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card hover className="h-full">
                  <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-12 border-t border-gray-900 bg-gray-950/50">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">Powered By</h2>
            <p className="text-lg text-gray-400 mb-12">
              Built on cutting-edge blockchain technology
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
              {['USDC', 'Avail', 'Blockscout', 'Ethereum'].map((tech) => (
                <div key={tech} className="text-xl font-bold text-gray-500">
                  {tech}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-gray-900 px-6 py-12 lg:px-12">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-gray-600 text-lg mb-4">
            Built with ❤️ by MergeFi Team
          </div>
          <div className="text-gray-700 text-sm">
            © 2025 MergeFi. Empowering open source collaboration.
          </div>
        </div>
      </footer>
    </div>
  );
}
