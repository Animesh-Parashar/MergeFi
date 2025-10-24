import express from 'express';
import {
  contributorcontrol,
  getContributorStats,
  getContributorEarnings
} from '../controllers/contributor.controller.js';
import {
  maintainercontrol,
  getMaintainerStats,
  getRepoContributors,
  getRepoContributorsWithWallets
} from '../controllers/maintainer.controller.js';
import {
  listRepository,
  unlistRepository,
  getListedRepositories,
  getUserListedRepositories,
} from '../controllers/owner.controller.js';
import { setUsernameAndChain } from '../controllers/setusername_and_chain.controller.js';

const router = express.Router();

// Contributor routes
router.get('/contributor/stats', getContributorStats);
router.get('/contributor/earnings', getContributorEarnings);
router.get('/contributor', contributorcontrol);

// Maintainer routes
router.get('/maintainer/stats', getMaintainerStats);
router.get('/maintainer', maintainercontrol);
router.get('/maintainer/:owner/:repo/contributors', getRepoContributors);
router.get('/maintainer/:owner/:repo/contributors-wallets', getRepoContributorsWithWallets);

// Repository listing routes
router.post('/repos/list', listRepository);
router.post('/repos/unlist', unlistRepository);
router.get('/repos/listed', getUserListedRepositories);
router.get('/repos/all-listed', getListedRepositories);

router.post('/set-user-data', setUsernameAndChain);

export default router;