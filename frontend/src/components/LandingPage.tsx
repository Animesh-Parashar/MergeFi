import { motion } from 'framer-motion';
import { Github, Zap, DollarSign, Globe, Shield, TrendingUp } from 'lucide-react';

export default function LandingPage({ onConnectGithub }: { onConnectGithub: () => void }) {
  const features = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Smart Contracts for Revenue Splits',
      description: 'Automated, transparent, and trustless revenue distribution powered by blockchain smart contracts.'
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Instant PYUSD Payments',
      description: 'Receive payments instantly in PYUSD with zero delays and minimal transaction fees.'
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: 'Cross-Chain Payouts (Avail Nexus)',
      description: 'Seamlessly distribute funds across multiple blockchain networks with Avail Nexus integration.'
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Transparent Tracking (Blockscout SDK)',
      description: 'Full visibility into all transactions and payouts with real-time blockchain explorer integration.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-hidden">
      <div className="absolute inset-0 bg-cyan-900/10"></div>
      <div className="absolute inset-0 bg-violet-900/10"></div>

      <div className="relative">
        <nav className="border-b border-slate-800/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-cyan-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold text-cyan-400">
                CollabPay
              </span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onConnectGithub}
              className="flex items-center space-x-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-600/80 rounded-xl font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
            >
              <Github className="w-5 h-5" />
              <span>Connect with GitHub</span>
            </motion.button>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-block mb-6 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-400 text-sm font-mono"
            >
              ✨ Powered by Blockchain Technology
            </motion.div>

            <h1 className="text-6xl md:text-7xl font-bold mb-6 text-white leading-tight">
              Automate Revenue Sharing<br />for Your GitHub Projects
            </h1>

            <p className="text-xl md:text-2xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              Connect your GitHub, set your team shares, and let smart contracts handle payouts in real time.
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onConnectGithub}
              className="inline-flex items-center space-x-3 px-8 py-4 bg-cyan-600 hover:bg-cyan-600/80 rounded-2xl font-bold text-lg shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all"
            >
              <Github className="w-6 h-6" />
              <span>Connect with GitHub</span>
              <Zap className="w-5 h-5" />
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-cyan-500/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
                <div className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-8 hover:border-cyan-500/30 transition-colors">
                  <div className="w-16 h-16 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-6 text-cyan-400 group-hover:text-cyan-300 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="mt-20 text-center"
          >
            <div className="inline-block px-6 py-3 bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl">
              <p className="text-slate-400 font-mono text-sm">
                Trusted by <span className="text-cyan-400 font-bold">1,000+</span> open-source teams
              </p>
            </div>
          </motion.div>
        </main>

        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
    </div>
  );
}
