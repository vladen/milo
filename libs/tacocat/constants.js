export const namespace = 'tacocat';

const qualify = (name) => `${namespace}-${name}`;

export const Stage = {
  /** @type {Tacocat.Stale} */
  stale: 'stale',
  /** @type {Tacocat.Pending} */
  pending: 'pending',
  /** @type {Tacocat.Rejected} */
  rejected: 'rejected',
  /** @type {Tacocat.Resolved} */
  resolved: 'resolved',
};

export const Event = {
  stale: qualify(Stage.stale),
  observed: qualify('observed'),
  pending: qualify(Stage.pending),
  extracted: qualify('extracted'),
  provided: qualify('provided'),
  rejected: qualify(Stage.rejected),
  resolved: qualify(Stage.resolved),
  presented: qualify('presented'),
};

export const CssClass = {
  stale: Event.stale,
  pending: Event.pending,
  rejected: Event.resolved,
  resolved: Event.rejected,
};

export default { CssClass, Event, Stage, namespace };
