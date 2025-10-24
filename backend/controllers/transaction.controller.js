import { supabase } from '../utils/supabase.js';

// Store a new transaction (only hash and chain_id)
export const storeTransaction = async (req, res) => {
  try {
    const { 
      tx_hash, 
      chain_id,
      description
    } = req.body;

    if (!tx_hash || !chain_id) {
      return res.status(400).json({ 
        error: 'Transaction hash and chain ID are required' 
      });
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          tx_hash,
          chain_id,
          description: description || '',
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      // Check if it's a duplicate entry
      if (error.code === '23505') {
        return res.status(200).json({ 
          message: 'Transaction already exists', 
          data: null 
        });
      }
      console.error('Error storing transaction:', error);
      return res.status(500).json({ error: 'Failed to store transaction' });
    }

    res.status(200).json({ 
      message: 'Transaction stored successfully', 
      data: data[0] 
    });
  } catch (error) {
    console.error('Error in storeTransaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all transactions
export const getAllTransactions = async (req, res) => {
  try {
    const { chain_id, limit = 50 } = req.query;

    let query = supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (chain_id) {
      query = query.eq('chain_id', chain_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return res.status(500).json({ error: 'Failed to fetch transactions' });
    }

    res.status(200).json({ transactions: data });
  } catch (error) {
    console.error('Error in getAllTransactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get transaction by hash
export const getTransactionByHash = async (req, res) => {
  try {
    const { hash } = req.params;

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('tx_hash', hash)
      .single();

    if (error) {
      console.error('Error fetching transaction:', error);
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.status(200).json({ transaction: data });
  } catch (error) {
    console.error('Error in getTransactionByHash:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete transaction (optional utility endpoint)
export const deleteTransaction = async (req, res) => {
  try {
    const { hash } = req.params;

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('tx_hash', hash);

    if (error) {
      console.error('Error deleting transaction:', error);
      return res.status(500).json({ error: 'Failed to delete transaction' });
    }

    res.status(200).json({ 
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteTransaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
