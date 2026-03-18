import { createAdminClient } from '../lib/supabase/server';

async function checkDb() {
  const supabase = createAdminClient();
  
  console.log('--- Checking Profiles ---');
  const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
  if (pError) console.error('Error fetching profiles:', pError);
  else console.log('Profiles found:', profiles.length, profiles);

  console.log('\n--- Checking Songs ---');
  const { data: songs, error: sError } = await supabase.from('songs').select('*');
  if (sError) console.error('Error fetching songs:', sError);
  else console.log('Songs found:', songs.length, songs.map(s => ({ id: s.id, title: s.title, owner_id: s.owner_id })));

  console.log('\n--- Checking Campaigns ---');
  const { data: campaigns, error: cError } = await supabase.from('campaigns').select('*');
  if (cError) console.error('Error fetching campaigns:', cError);
  else console.log('Campaigns found:', campaigns.length, campaigns);
}

checkDb();
