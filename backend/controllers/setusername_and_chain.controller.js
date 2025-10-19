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

export { setUsernameAndChain };