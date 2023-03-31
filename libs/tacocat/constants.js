export const namespace = 'tacocat';

const qualify = (name) => `${namespace}:${name}`;

export const StageName = {
  /** @type {Tacocat.Stale} */
  stale: 'stale',
  /** @type {Tacocat.Pending} */
  pending: 'pending',
  /** @type {Tacocat.Rejected} */
  rejected: 'rejected',
  /** @type {Tacocat.Resolved} */
  resolved: 'resolved',
};

export const EventType = {
  stale: qualify(StageName.stale),
  observed: qualify('observed'),
  pending: qualify(StageName.pending),
  extracted: qualify('extracted'),
  provided: qualify('provided'),
  rejected: qualify(StageName.rejected),
  resolved: qualify(StageName.resolved),
  presented: qualify('presented'),
};

export default { namespace, EventType, StageName };
