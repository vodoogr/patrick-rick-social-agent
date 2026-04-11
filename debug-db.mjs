import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkAssets() {
  const { data, error } = await supabase.from('assets').select('*');
  if (error) {
    console.error("DB Error:", error);
  } else {
    console.log(`Found ${data?.length} assets in DB.`);
    console.log(JSON.stringify(data, null, 2));
  }
}

async function checkBuckets() {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error("Bucket Error:", error);
  } else {
    console.log("Buckets:", data?.map(b => b.name));
  }
}

async function checkStorageObjects() {
  const { data, error } = await supabase.storage.from('assets').list('ai_generated');
  if (error) {
    console.error("Storage list Error:", error);
  } else {
    console.log(`Found ${data?.length} files in assets/ai_generated.`);
    console.log(JSON.stringify(data, null, 2));
  }
}

async function run() {
  await checkBuckets();
  await checkAssets();
  await checkStorageObjects();
}

run();
