import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const { 
      campaign_id, 
      song_id,
      hook, 
      caption, 
      hashtags, 
      campaign_concept, 
      video_prompt,
      song_cover_prompt,
      reel_visual_prompt
    } = body;

    if (!campaign_id) {
      return NextResponse.json({ error: "campaign_id is required" }, { status: 400 });
    }

    // Update Campaign with new fields
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({
        campaign_hook: hook,
        caption: caption,
        hashtags: hashtags,
        campaign_concept: campaign_concept,
        video_prompt: video_prompt,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaign_id);

    if (updateError) throw updateError;

    // Create Assets for the prompts if we want them saved there too 
    // We get owner_id from campaign
    const { data: campaign } = await supabase.from('campaigns').select('owner_id').eq('id', campaign_id).single();
    if (campaign?.owner_id) {
      // Upsert song_cover
      await supabase.from('assets').insert({
        owner_id: campaign.owner_id,
        song_id: song_id,
        campaign_id: campaign_id,
        asset_type: 'song_cover',
        storage_path: 'generated_prompt', // or a real path if we save the actual image
        metadata: { prompt: song_cover_prompt }
      });

      // Upsert reel_visual
      await supabase.from('assets').insert({
        owner_id: campaign.owner_id,
        song_id: song_id,
        campaign_id: campaign_id,
        asset_type: 'reel_visual',
        storage_path: 'generated_prompt',
        metadata: { prompt: reel_visual_prompt }
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("API Error updating campaign assets:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
