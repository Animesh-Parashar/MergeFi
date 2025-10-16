import { motion } from 'framer-motion';
import { GitBranch, Coins, Shield, Award } from 'lucide-react';
import { Card } from '../components/Card';

export function Home() {

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      <section className="relative px-6 py-20 lg:px-12 overflow-hidden">
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
              <pre className="text-white text-sm lg:text-base font-bold leading-none inline-block">
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
              Earn PyUSD for your contributions. Verified, transparent, and on-chain.
              <br />
              MergeFi bridges the gap between open source work and fair compensation.
            </p>

            <div className="flex justify-center items-center">
              <button 
                onClick={() => window.location.href = 'http://localhost:5000/auth/github'}
                className="group relative"
              >
                <div className="absolute inset-0 border-2 border-dashed border-gray-600 bg-gray-900/20 transition-all duration-300 group-hover:border-gray-400 group-hover:shadow-lg group-hover:shadow-white/10"></div>
                <div className="relative border-2 border-dashed border-gray-400 bg-transparent text-white font-bold px-8 py-3 text-base transition-all duration-300 group-hover:border-gray-300 group-hover:bg-gray-900/30 transform translate-x-1 translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0">
                  <span className="flex items-center gap-3">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                    </svg>
                    Connect to GitHub
                  </span>
                </div>
              </button>
            </div>
          </motion.div>

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
                <div className="text-white">✓ Payment Network: PyUSD</div>
                <div className="text-white">✓ Verified Repos: 247</div>
                <div className="text-white">✓ Total Contributors: 1,829</div>
                <div className="text-green-400">✓ Total Rewards Distributed: $54,290 PyUSD</div>
              </div>
            </Card>
          </motion.div>
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
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">How It Works</h2>
            <p className="text-xl text-gray-400">
              A seamless flow from contribution to compensation
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Maintainer Creates Pool',
                description: 'Repository owners set up reward pools with PyUSD',
                icon: Coins,
              },
              {
                step: '02',
                title: 'Contributor Submits PR',
                description: 'Contributors work on verified repositories',
                icon: GitBranch,
              },
              {
                step: '03',
                title: 'AI-Assisted Review',
                description: 'Smart verification and reward calculation',
                icon: Shield,
              },
              {
                step: '04',
                title: 'Earn & Badge',
                description: 'Get paid in PyUSD and earn NFT badges',
                icon: Award,
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card hover>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-900 border border-gray-700 flex items-center justify-center">
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-gray-500 text-sm mb-2">{item.step}</div>
                    <h3 className="text-lg font-bold mb-3">{item.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
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
                  'All transactions processed on-chain with PyUSD for transparency and security',
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
              {['PyUSD', 'Avail', 'Blockscout', 'Ethereum'].map((tech) => (
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
