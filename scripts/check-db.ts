import { createClient } from '../lib/supabase/server';

async function checkData() {
  const supabase = createClient();
  const { count, error } = await supabase
    .from('songs')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error checking songs:', error);
    return;
  }

  console.log('Total songs in database:', count);
}

checkData();
