export function getNextContentAngle(day: number): string {
  const rotation = [
    "atmospheric_teaser",
    "lyric_focus",
    "emotional_hook",
    "cinematic_visual",
    "era_storytelling",
    "intimate_interpretation",
    "listening_invitation",
  ];

  return rotation[(day - 1) % rotation.length];
}

export function shouldContinueCampaign(
  currentSongId: string,
  newSongId?: string
): boolean {
  if (!newSongId) return true;
  return currentSongId === newSongId;
}