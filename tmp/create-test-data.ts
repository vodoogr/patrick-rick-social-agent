import { createClient } from '../lib/supabase/server';

async function createTestAlbum() {
  const supabase = createClient();
  
  // 1. Get the owner_id (first profile)
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);
    
  if (pError || !profiles?.[0]) {
    console.error('Could not find profile:', pError);
    return;
  }
  
  const ownerId = profiles[0].id;
  
  // 2. Create the album
  const { data: album, error: aError } = await supabase
    .from('albums')
    .insert({
      owner_id: ownerId,
      title: 'The Sin Collection',
      slug: 'the-sin-collection',
      era: 'RED',
      release_year: 2024,
      description: 'A collection of tracks exploring human desire and red-era intensity.',
      creative_dna: {
        narrative_summary: 'The exploration of heat, pulse, and impulse.',
        canonical_phrase: 'Some fires are softer when they know your name.'
      }
    })
    .select()
    .single();
    
  if (aError) {
    console.error('Error creating album:', aError.message);
    return;
  }
  
  console.log('✅ Created Album:', album.title, album.id);
  
  // 3. Link a song to it (Warmth of Sin)
  const { data: song, error: sError } = await supabase
    .from('songs')
    .update({ album_id: album.id, track_number: 1 })
    .ilike('title', '%Warmth of Sin%')
    .select()
    .single();
    
  if (sError) {
    console.error('Error linking song:', sError.message);
  } else {
    console.log('✅ Linked song:', song.title, 'to album.');
  }
}

createTestAlbum();
