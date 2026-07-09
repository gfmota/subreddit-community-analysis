// `trajectories` is the flattened lookup produced by
// steps/community_trajectories_step.py: { "<date>:<communityId>": "<trajectoryId>" }.
// `labels` is produced by steps/apply_community_labels_step.py:
// { "<trajectoryId>": { label, description } }. Both are optional — if either
// is missing, or has no entry for this community, callers fall back to the
// raw community id.

export function resolveTrajectoryId(trajectories, date, communityId) {
  return trajectories?.[`${date}:${communityId}`];
}

// Falls back to the raw community id when no trajectory is known yet (data
// still loading, or this community didn't match anything).
export function resolveColorKey(trajectories, date, communityId) {
  return resolveTrajectoryId(trajectories, date, communityId) ?? communityId;
}

// Returns undefined when no label is available; callers decide the fallback text.
export function resolveLabel(trajectories, labels, date, communityId) {
  const trajectoryId = resolveTrajectoryId(trajectories, date, communityId);
  return trajectoryId ? labels?.[trajectoryId]?.label : undefined;
}
