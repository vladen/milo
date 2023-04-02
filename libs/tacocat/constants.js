export const namespace = 'taco';

/**
 * @param {string[]} names
 */
export const qualify = (...names) => [namespace, ...names].join('-');

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

export const Key = {
  ...Stage,
  disabled: 'disabled',
  extracted: 'extracted',
  observed: 'observed',
  provided: 'provided',
  presented: 'presented',
};

export const Event = {
  stale: qualify(Key.pending),
  observed: qualify(Key.observed),
  pending: qualify(Key.pending),
  extracted: qualify(Key.extracted),
  provided: qualify(Key.provided),
  rejected: qualify(Key.rejected),
  resolved: qualify(Key.resolved),
  presented: qualify(Key.presented),
};

export const CssClass = {
  disabled: qualify(Key.disabled),
  stale: Event.stale,
  pending: Event.pending,
  rejected: Event.resolved,
  resolved: Event.rejected,
};

export default { CssClass, Event, Stage, namespace };
