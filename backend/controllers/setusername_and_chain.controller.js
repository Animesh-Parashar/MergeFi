import { supabase } from "../utils/supabase.js";

/**
 * Set or update user's GitHub username, wallet address, and chain preference
 * 
 * Expected table structure:
 * CREATE TABLE adderess_and_chain (
 *   id SERIAL PRIMARY KEY,
 *   github_username VARCHAR UNIQUE NOT NULL,
 *   wallet_address VARCHAR NOT NULL,
 *   chain VARCHAR NOT NULL,
 *   created_at TIMESTAMP DEFAULT NOW(),
 *   updated_at TIMESTAMP DEFAULT NOW()
 * );
 */
const setUsernameAndChain = async (req, res) => {
  try {
    const { github_username, wallet_address, chain } = req.body;

    // Validate required fields
    if (!github_username || !wallet_address || !chain) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "github_username, wallet_address, and chain are required"
      });
    }

    // Use Supabase upsert functionality (more efficient)
    const { data, error } = await supabase
      .from('adderess_and_chain')
      .upsert({
        github_username,
        wallet_address,
        chain,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'github_username', // Specify the conflict column
        ignoreDuplicates: false // This ensures updates happen on conflict
      })
      .select()
      .single();

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

export { setUsernameAndChain };