-- 1. Fix RLS policies for songs to allow reading any active song if authenticated
-- or allow reading seeded songs for the initial demo.
-- For now, let's keep it strictly "own songs" but ensure the user has a profile.

-- 2. Update existing seeded songs to a known owner_id if possible, 
-- or create a policy that allows reading "system" songs.

-- Let's create a "system" user or just allow reading all active songs for now 
-- since it's a social agent for a single artist (Patrick Rick).
-- If the project intent is multi-user, we should keep owner_id.
-- But the user says "seeded songs are not rendering", so they expect to see them.

drop policy if exists "songs_own_all" on public.songs;
create policy "songs_read_all"
on public.songs
for select
using (true); -- Allow anyone to read songs for now to fix visibility

create policy "songs_modify_own"
on public.songs
for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

-- 3. Fix the campaign error (handling missing current campaign)
-- This is a code fix, but good to note.

-- 4. Ensure we have at least one profile to link songs to if we want to test creation.
-- The trigger handle_new_user should do this.
