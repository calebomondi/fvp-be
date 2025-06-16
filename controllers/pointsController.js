import supabase from "../database/supabaseClient.js";
import { getVaultID } from "./vaultsController.js";

const AMOUNT_WEIGHT = 1;
const DURATION_WEIGHT = 0.5;

function getDate(daysToAdd) {
  const today = new Date();
  today.setDate(today.getDate() + daysToAdd);
  return today;
}

export async function earnPoints(req, res) {
  const {owner, chainId, contractAddress, amount_locked, lock_duration_days} = req.body;

  //get vault Id
  const vaultId = await getVaultID(owner, chainId, contractAddress);

  const points = (amount_locked * AMOUNT_WEIGHT) + (lock_duration_days * DURATION_WEIGHT);

  const { error } = await supabase
    .from('vaults')
    .insert([
      {
        user: owner,
        chain_id: chainId,
        vault_id: vaultId,
        amount_locked: amount_locked,
        lock_duration_days: lock_duration_days,
        lock_enddate: getDate(lock_duration_days),
        points: points,
        points_status: 'pending',
        status: 'active'
      }
    ]);

  if (error) return res.status(500).json({ error });

  res.status(200).json({ status:true });
}

export async function breakVault(req, res) {
  const { vaultId, chainId, owner } = req.body;

  // fetch the vault data
  const { data: vault, error } = await supabase
    .from('vaults')
    .select('*')
    .eq('vault_id', vaultId)
    .eq('chain_id', chainId)
    .eq('user', owner)
    .single();

  if (error || !vault) return res.status(404).json({ error: 'Vault not found' });

  if (vault.status !== 'active') return res.status(400).json({ error: 'Vault is already closed' });

  // Check if the vault is broken early
  const lockEndDate = new Date(vault.lock_enddate);
  const createdAt = new Date(vault.created_at);
  const now = new Date();

  const totalDuration = Math.floor((lockEndDate - createdAt) / (1000 * 60 * 60 * 24)); // in days
  const elapsed = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24)); // in days
  const progress = elapsed / totalDuration;

  console.log(`Total Duration: ${totalDuration} days, Elapsed: ${elapsed} days, Progress: ${progress}`);

  let penalty = 1;
  if (progress >= 0.75) penalty = 0.25;
  else if (progress >= 0.25) penalty = 0.5;

  const lostPoints = vault.points * penalty;
  const pointsafterPenalty = vault.points - lostPoints;

  if (pointsafterPenalty > 0) {
    // get current points for the user
    const { data: userPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('points')
      .eq('user', owner)
      .eq('chain_id', chainId)
      .maybeSingle();
    
    if (pointsError) {
      console.error("Error fetching user points:", pointsError);
      return res.status(500).json({ error: "Failed to fetch user points" });
    }

    const currentPoints = userPoints ? userPoints.points : 0;
    const newPoints = currentPoints + pointsafterPenalty;
  
    // Claim remaining points
    const { error: claimError } = await supabase
      .from('user_points')
      .insert([
        {
          user: owner,
          chain_id: chainId,
          points: newPoints
        }
      ]);

    if (claimError) {
      console.error("Error claiming points:", claimError);
      return res.status(500).json({ error: "Failed to claim points" });
    }
  }

  // delete the vault
  const { error: deleteError } = await supabase
    .from('vaults')
    .delete()
    .eq('vault_id', vaultId)
    .eq('chain_id', chainId)
    .eq('user', owner);
  
  if (deleteError) {
    console.error("Error deleting vault:", deleteError);
    return res.status(500).json({ error: "Failed to delete vault" });
  }

  res.json({ message: 'Vault broken early', pointsafterPenalty });
}

export async function getPoints(req, res) {
  const { owner, chainId, vaultId } = req.body;

  // Fetch user points
  const { data: userPoints, error } = await supabase
    .from('vaults')
    .select('points')
    .eq('user', owner)
    .eq('chain_id', chainId)
    .eq('vault_id', vaultId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching user points:", error);
    return res.status(500).json({ error: "Failed to fetch user points" });
  }

  if (!userPoints) {
    return res.status(404).json({ message: "No points found for this user" });
  }

  res.json({ points: userPoints.points });
}
