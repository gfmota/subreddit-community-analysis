// `trajectories` is the flattened lookup produced by
// steps/community_trajectories_step.py: { "<date>:<communityId>": "<trajectoryId>" }.
// Falls back to the raw community id when no trajectory is known yet (data
// still loading, or this community didn't match anything).
export function resolveColorKey(trajectories, date, communityId) {
  return trajectories?.[`${date}:${communityId}`] ?? communityId;
}
