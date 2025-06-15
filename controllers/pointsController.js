import supabase from "../database/supabaseClient.js";
import dayjs from 'dayjs';

const AMOUNT_WEIGHT = 0.5;
const DURATION_WEIGHT = 1;

export async function createVault(req, res) {
  const { user_id, amount_locked, lock_duration_days } = req.body;

  const points = (amount_locked * AMOUNT_WEIGHT) + (lock_duration_days * DURATION_WEIGHT);
  const lock_end_date = dayjs().add(lock_duration_days, 'day').toISOString();

  const { data, error } = await supabase
    .from('vaults')
    .insert([
      {
        user_id,
        amount_locked,
        lock_duration_days,
        lock_end_date,
        points,
        points_status: 'pending',
        status: 'active'
      }
    ]);

  if (error) return res.status(500).json({ error });

  return res.status(200).json({ message: 'Vault created', data });
}

export async function breakVault(req, res) {
  const { vault_id } = req.params;
  const now = dayjs();

  const { data: vault, error } = await supabase
    .from('vaults')
    .select('*')
    .eq('id', vault_id)
    .single();

  if (error || !vault) return res.status(404).json({ error: 'Vault not found' });

  if (vault.status !== 'active') return res.status(400).json({ error: 'Vault is already closed' });

  const totalDuration = dayjs(vault.lock_end_date).diff(dayjs(vault.created_at), 'day');
  const elapsed = now.diff(dayjs(vault.created_at), 'day');
  const progress = elapsed / totalDuration;

  let penalty = 1;
  if (progress >= 0.75) penalty = 0.25;
  else if (progress >= 0.25) penalty = 0.5;

  const lostPoints = vault.points * penalty;

  await supabase
    .from('vaults')
    .update({
      status: 'broken',
      points_status: 'forfeited',
      lost_points: lostPoints
    })
    .eq('id', vault_id);

  res.json({ message: 'Vault broken early', lostPoints });
}
