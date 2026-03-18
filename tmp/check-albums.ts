import { createClient } from '../lib/supabase/server';

async function checkAlbums() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error accessing albums table:', error.message);
    console.error('Code:', error.code);
  } else {
    console.log('✅ Albums table is accessible!');
    console.log('Data:', data);
  }
}

checkAlbums();
