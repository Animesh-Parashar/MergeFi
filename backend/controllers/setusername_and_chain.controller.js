import { supabase } from "../utils/supabase.js";

/**
 * Set or update user's GitHub username, wallet address, and chain preference
 * 
 * Expected table structure:
 * CREATE TABLE address_and_chain (
 *   id SERIAL PRIMARY KEY,
 *   github_username VARCHAR NOT NULL,
 *   walletaddress VARCHAR NOT NULL,
 *   chain VARCHAR NOT NULL,
 *   created_at TIMESTAMP DEFAULT NOW()
 * );
 */
const setUsernameAndChain = async (req, res) => {
  try {
    const { github_username, walletaddress, chain } = req.body;

    // Validate required fields
    if (!github_username || !walletaddress || !chain) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "github_username, walletaddress, and chain are required"
      });
    }

    // Check if user already exists
    const { data: existingUser, error: selectError } = await supabase
      .from('address_and_chain')
      .select('*')
      .eq('github_username', github_username)
      .single();

    let data, error;

    if (existingUser && !selectError) {
      // Update existing user
      const { data: updateData, error: updateError } = await supabase
        .from('address_and_chain')
        .update({
          walletaddress,
          chain
        })
        .eq('github_username', github_username)
        .select()
        .single();
      
      data = updateData;
      error = updateError;
    } else {
      // Insert new user
      const { data: insertData, error: insertError } = await supabase
        .from('address_and_chain')
        .insert({
          github_username,
          walletaddress,
          chain
        })
        .select()
        .single();
      
      data = insertData;
      error = insertError;
    }

    if (error) {
      console.error('Error upserting user data:', error);
      return res.status(500).json({
        error: "Database operation failed",
        message: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: "User data saved successfully",
      data: data
    });

  } catch (error) {
    console.error('Unexpected error in setUsernameAndChain:', error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
};

const getchain = async (req, res) => {
  try {
    const { github_username } = req.body;

    if (!github_username) {
      return res.status(400).json({
        error: "Missing required field",
        message: "github_username is required"
      });
    }

    const { data, error } = await supabase
      .from('address_and_chain')
      .select('chain')
      .eq('github_username', github_username)
      .single();

    if (error) {
      console.error('Error fetching chain for username:', error);
      return res.status(404).json({
        error: "User not found",
        message: "No chain preference found for this user"
      });
    }

    // Chain name to chainId mapping
    const chainMapping = {
      'optimism-sepolia': 11155420,
      'polygon-amoy': 80002,
      'arbitrum-sepolia': 421614,
      'base-sepolia': 84532,
      'sepolia': 11155111,
      'monad-testnet': 10143,
    };

    const chainId = chainMapping[data.chain.toLowerCase()] || null;

    res.status(200).json({
      success: true,
      chain: data.chain,
      chainId: chainId
    });

  } catch (error) {
    console.error('Unexpected error in getchain:', error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
}

export { setUsernameAndChain ,getchain};