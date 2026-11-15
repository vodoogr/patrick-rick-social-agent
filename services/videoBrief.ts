export type VideoBriefInput = {
  song: string;
  version: string;
  artist: string;
  location: string;
  concept: string;
  wardrobe: string;
  visualStyle: string;
  audioReference?: string;
};

/** Returns a production brief; it does not generate, store, schedule or publish media. */
export function createVideoBrief(input: VideoBriefInput) {
  return {
    ...input,
    format: "vertical 9:16",
    stages: [
      { stage: "concept", status: "provided" },
      { stage: "shots_and_references", status: "pending" },
      { stage: "video_generation", status: "pending" },
      { stage: "lip_sync", status: "pending_if_needed" },
      { stage: "edit_and_music", status: "pending" },
      { stage: "human_review", status: "pending" },
    ],
    safeguards: {
      preserveIdentityAndWardrobe: true,
      confirmAudioAndRights: true,
      requireApprovalBeforePublishing: true,
    },
    saved: false,
    generated: false,
    scheduled: false,
    published: false,
  };
}

