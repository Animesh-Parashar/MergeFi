import express from 'express';
import {
  storeTransaction,
  getAllTransactions,
  getTransactionByHash,
  deleteTransaction
} from '../controllers/transaction.controller.js';

const router = express.Router();

// Store a new transaction
router.post('/', storeTransaction);

// Get all transactions
router.get('/', getAllTransactions);

// Get transaction by hash
router.get('/:hash', getTransactionByHash);

// Delete transaction (optional)
router.delete('/:hash', deleteTransaction);

export default router;
