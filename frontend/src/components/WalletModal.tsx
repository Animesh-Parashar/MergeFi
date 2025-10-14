import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, ChevronRight } from 'lucide-react';

interface Chain {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const chains: Chain[] = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    icon: '⟠',
    color: 'bg-blue-600'
  },
  {
    id: 'polygon',
    name: 'Polygon',
    icon: '⬡',
    color: 'bg-purple-600'
  },
  {
    id: 'avail',
    name: 'Avail Nexus',
    icon: '◈',
    color: 'bg-cyan-600'
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum',
    icon: '◆',
    color: 'bg-blue-500'
  }
];

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (chain: string) => void;
}

export default function WalletModal({ isOpen, onClose, onConnect }: WalletModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md"
            >
              <div className="absolute inset-0 bg-cyan-500/20 rounded-3xl blur-2xl"></div>

              <div className="relative bg-slate-900 border border-slate-800/50 rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-slate-800/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-400">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <h2 className="text-2xl font-bold">Connect Wallet</h2>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={onClose}
                      className="w-8 h-8 rounded-lg bg-slate-800/50 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                  </div>
                  <p className="text-slate-400 mt-2 text-sm">
                    Select a blockchain network to receive your payouts
                  </p>
                </div>

                <div className="p-6 space-y-3">
                  {chains.map((chain, index) => (
                    <motion.button
                      key={chain.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: 5 }}
                      onClick={() => {
                        onConnect(chain.id);
                        onClose();
                      }}
                      className="w-full group relative"
                    >
                      <div className="relative bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between transition-all">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 ${chain.color} rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
                            {chain.icon}
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-white">{chain.name}</div>
                            <div className="text-xs text-slate-400 font-mono">
                              {chain.id}.network
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                      </div>
                    </motion.button>
                  ))}
                </div>

                <div className="p-6 border-t border-slate-800/50 bg-slate-800/20">
                  <div className="flex items-start space-x-3">
                    <div className="text-cyan-400 text-sm">ℹ️</div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Cross-chain payouts are powered by Avail Nexus. Your wallet will prompt you to sign the connection.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
