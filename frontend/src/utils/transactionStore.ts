// Transaction storage utility for tracking transactions in the database

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://mergefi.onrender.com';

export interface TransactionData {
  tx_hash: string;
  from_chain_id: number;
  to_chain_id?: number;
  description?: string;
}

/**
 * Store a transaction in the database
 */
export async function storeTransaction(data: TransactionData): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/transactions/saveTx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error('Failed to store transaction:', await response.text());
      return false;
    }

    const result = await response.json();
    console.log('✅ Transaction stored:', result);
    return true;
  } catch (error) {
    console.error('Error storing transaction:', error);
    return false;
  }
}

/**
 * Get all transactions
 */
export async function getAllTransactions(from_chain_id?: number) {
  try {
    const url = from_chain_id
      ? `${BACKEND_URL}/api/transactions?from_chain_id=${from_chain_id}`
      : `${BACKEND_URL}/api/transactions`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }

    const data = await response.json();
    return data.transactions;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}
