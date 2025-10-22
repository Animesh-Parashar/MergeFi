// Transaction storage utility for tracking transactions in the database

const BACKEND_URL = 'http://localhost:5000';

export interface TransactionData {
  tx_hash: string;
  from_address: string;
  to_address: string;
  value: string;
  token: string;
  chain_id: number;
  status?: string;
  type?: string;
  description?: string;
}

/**
 * Store a transaction in the database
 */
export async function storeTransaction(data: TransactionData): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        status: data.status || 'pending',
        type: data.type || 'payment',
        description: data.description || '',
      }),
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
 * Update transaction status
 */
export async function updateTransactionStatus(
  tx_hash: string,
  status: 'pending' | 'success' | 'failed'
): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/transactions/${tx_hash}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      console.error('Failed to update transaction status');
      return false;
    }

    console.log(`✅ Transaction ${tx_hash} status updated to: ${status}`);
    return true;
  } catch (error) {
    console.error('Error updating transaction status:', error);
    return false;
  }
}

/**
 * Get all transactions
 */
export async function getAllTransactions(chain_id?: number) {
  try {
    const url = chain_id
      ? `${BACKEND_URL}/api/transactions?chain_id=${chain_id}`
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
