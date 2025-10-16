import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Clock,
  Users,
  Activity,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';

export function Owner() {
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedMaintainer, setSelectedMaintainer] = useState<any>(null);

  const pendingVerifications = [
    {
      id: 1,
      maintainer: 'dev.alice',
      repo: 'crypto-wallet-lib',
      submitted: '2025-06-14',
      waitingDays: 2,
    },
    {
      id: 2,
      maintainer: 'bob.builder',
      repo: 'smart-contract-tools',
      submitted: '2025-06-10',
      waitingDays: 6,
    },
    {
      id: 3,
      maintainer: 'charlie.dev',
      repo: 'blockchain-analytics',
      submitted: '2025-06-08',
      waitingDays: 8,
    },
  ];

  const verifiedRepos = [
    {
      name: 'awesome-blockchain',
      maintainer: 'alice.eth',
      verified: '2025-05-20',
      contributors: 34,
      poolSize: 5000,
    },
    {
      name: 'defi-toolkit',
      maintainer: 'bob.dev',
      verified: '2025-05-15',
      contributors: 22,
      poolSize: 3200,
    },
    {
      name: 'web3-starter',
      maintainer: 'charlie.code',
      verified: '2025-05-10',
      contributors: 18,
      poolSize: 2100,
    },
  ];

  const handleVerifyClick = (maintainer: any) => {
    setSelectedMaintainer(maintainer);
    setShowVerifyModal(true);
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono p-6 lg:p-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">
            Platform Owner Dashboard
          </h1>
          <p className="text-gray-400 text-lg">
            Oversee verification requests and platform-wide activity
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6 mb-12">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-sm mb-2">Total Payouts</div>
                <div className="text-2xl font-bold">$54,290</div>
                <div className="text-green-400 text-sm mt-1">PyUSD</div>
              </div>
              <Activity className="w-10 h-10 text-gray-700" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-sm mb-2">Verified Repos</div>
                <div className="text-2xl font-bold">247</div>
                <div className="text-gray-500 text-sm mt-1">Active</div>
              </div>
              <ShieldCheck className="w-10 h-10 text-gray-700" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-sm mb-2">
                  Total Contributors
                </div>
                <div className="text-2xl font-bold">1,829</div>
                <div className="text-gray-500 text-sm mt-1">All-time</div>
              </div>
              <Users className="w-10 h-10 text-gray-700" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-sm mb-2">Pending</div>
                <div className="text-2xl font-bold">3</div>
                <div className="text-yellow-400 text-sm mt-1">To review</div>
              </div>
              <Clock className="w-10 h-10 text-gray-700" />
            </div>
          </Card>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Verification Queue</h2>
          <div className="space-y-4">
            {pendingVerifications.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <div className="grid md:grid-cols-5 gap-4 items-center">
                    <div>
                      <div className="text-sm text-gray-400">Maintainer</div>
                      <div className="font-bold">{item.maintainer}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Repository</div>
                      <div className="text-sm">{item.repo}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Submitted</div>
                      <div className="text-sm">{item.submitted}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Wait Period</div>
                      <div className="font-bold">
                        <span
                          className={
                            item.waitingDays >= 7
                              ? 'text-green-400'
                              : 'text-yellow-400'
                          }
                        >
                          {item.waitingDays}/7 days
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {item.waitingDays >= 7 ? (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleVerifyClick(item)}
                            className="flex-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <div className="text-xs text-gray-500 text-center flex-1">
                          Waiting period active
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Verification Log</h2>
          <Card>
            <div className="font-mono text-sm space-y-2">
              <div className="text-gray-500">
                $ collab-pay admin --verification-log
              </div>
              <div className="space-y-1 mt-4">
                <div className="flex items-start gap-3">
                  <div className="text-green-400 mt-1">▶</div>
                  <div className="flex-1">
                    <div className="text-gray-400">
                      [2025-06-14 14:32] Scanning maintainer: dev.alice
                    </div>
                    <div className="text-gray-500 text-xs ml-4">
                      → Repository: crypto-wallet-lib
                    </div>
                    <div className="text-gray-500 text-xs ml-4">
                      → Status: Waiting period (2/7 days)
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-green-400 mt-1">▶</div>
                  <div className="flex-1">
                    <div className="text-gray-400">
                      [2025-06-10 09:15] Scanning maintainer: bob.builder
                    </div>
                    <div className="text-gray-500 text-xs ml-4">
                      → Repository: smart-contract-tools
                    </div>
                    <div className="text-gray-500 text-xs ml-4">
                      → Status: Waiting period (6/7 days)
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-green-400 mt-1">✓</div>
                  <div className="flex-1">
                    <div className="text-green-400">
                      [2025-06-08 11:45] Verified: charlie.dev
                    </div>
                    <div className="text-gray-500 text-xs ml-4">
                      → Repository: blockchain-analytics
                    </div>
                    <div className="text-gray-500 text-xs ml-4">
                      → Status: Approved after 8 days
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6">Verified Repositories</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {verifiedRepos.map((repo, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card hover>
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck className="w-5 h-5 text-green-400" />
                    <span className="font-bold">{repo.name}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-400">
                      <span>Maintainer</span>
                      <span className="text-white">{repo.maintainer}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Verified</span>
                      <span className="text-white">{repo.verified}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Contributors</span>
                      <span className="text-white">{repo.contributors}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Pool Size</span>
                      <span className="text-green-400">
                        ${repo.poolSize} PyUSD
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <Modal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        title="Verify Maintainer"
      >
        {selectedMaintainer && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400">Maintainer</span>
                <span className="font-bold">{selectedMaintainer.maintainer}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400">Repository</span>
                <span className="font-bold">{selectedMaintainer.repo}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400">Submitted</span>
                <span className="font-bold">{selectedMaintainer.submitted}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400">Wait Period</span>
                <span className="font-bold text-green-400">
                  {selectedMaintainer.waitingDays}/7 days ✓
                </span>
              </div>
            </div>
            <div className="p-4 bg-gray-900 border border-gray-800">
              <div className="text-sm text-gray-400 mb-2">
                Verification Checklist
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300">Waiting period completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300">Repository is public</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300">Valid maintainer identity</span>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <Button className="flex-1">Approve Verification</Button>
              <Button variant="outline" className="flex-1">
                Reject
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
