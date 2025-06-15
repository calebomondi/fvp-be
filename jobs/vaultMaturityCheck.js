import supabase from "../database/supabaseClient.js";
import dayjs from 'dayjs';

export async function checkVaultMaturity() {
  const now = dayjs().toISOString();

  const { data: vaults, error } = await supabase
    .from('vaults')
    .select('*')
    .eq('status', 'active')
    .lte('lock_end_date', now);

  if (error) {
    console.error('Vault maturity check failed:', error);
    return;
  }

  for (const vault of vaults) {
    await supabase
      .from('vaults')
      .update({
        status: 'completed',
        points_status: 'earned'
      })
      .eq('id', vault.id);

    await supabase
      .from('users_points')
      .upsert({
        user_id: vault.user_id,
        earned_points: vault.points
      }, { onConflict: ['user_id'] });
  }

  console.log(`✅ Matured ${vaults.length} vaults`);
}
