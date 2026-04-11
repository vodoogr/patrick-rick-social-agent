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

    let resolvedCampaignId = campaign_id;

    // If no campaign_id provided, auto-create one for the song
    if (!resolvedCampaignId && song_id) {
      // Check if there's an active campaign for this song
      const { data: existing } = await supabase
        .from('campaigns')
        .select('id')
        .eq('song_id', song_id)
        .eq('status', 'active')
        .maybeSingle();
      
      if (existing) {
        resolvedCampaignId = existing.id;
      } else {
        // Try RPC first, fallback to direct insert
        try {
          const { data: newId, error: rpcError } = await supabase.rpc('start_campaign', {
            p_song_id: song_id
          });
          if (rpcError) throw rpcError;
          resolvedCampaignId = newId;
        } catch {
          // Direct insert fallback
          const { data: songData } = await supabase
            .from('songs')
            .select('owner_id')
            .eq('id', song_id)
            .single();
          
          const { data: inserted, error: insertErr } = await supabase
            .from('campaigns')
            .insert({
              song_id,
              owner_id: songData?.owner_id,
              status: 'active',
              is_current: false,
              day_number: 1,
            })
            .select('id')
            .single();
          
          if (insertErr) throw insertErr;
          resolvedCampaignId = inserted.id;
        }
      }
    }

    if (!resolvedCampaignId) {
      return NextResponse.json({ error: "campaign_id or song_id is required" }, { status: 400 });
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
      .eq('id', resolvedCampaignId);

    if (updateError) throw updateError;



    return NextResponse.json({ success: true, campaign_id: resolvedCampaignId });
  } catch (err: any) {
    console.error("API Error updating campaign assets:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
