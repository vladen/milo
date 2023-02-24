import { namespace, Stage } from './constants.js';
import { isError, isNil } from './utilities.js';

/** @type {WeakMap<Event, Event>} */
const events = new WeakMap();

// TODO: use original or custom events of same type `tacocat:event`
const getEventType = (channel) => `${namespace}:${channel}`;

/** @type {Tacocat.StateEvent} */
class TacocatStateEvent extends Event {
  constructor(stage, state, type) {
    super(type, { bubbles: true });
    this.stage = stage;
    this.state = state;
  }
}

/**
 * @template T
 * @param {string} type
 * @returns {Tacocat.Engine.Channel<T>}
 */
const Channel = (type) => ({
  dispatch(target, state, stage, event) {
    const tacoEvent = new TacocatStateEvent(stage, state, type);
    if (event) events.set(tacoEvent, event);
    target.dispatchEvent(tacoEvent);
  },
  listen(target, listener, options = {}) {
    const tacoListener = (event) => {
      listener(event.state, event.stage, events.get(event));
    };
    target.addEventListener(type, tacoListener, options);
    return () => target.removeEventListener(type, tacoListener);
  },
  promise(target) {
    return new Promise((resolve, reject) => {
      target.addEventListener(type, (event) => {
        // @ts-ignore
        const { state } = event;
        ((isNil(state) || isError(state)) ? reject : resolve)(state);
      }, { once: true });
    });
  },
});

export default {
  /** @type {Tacocat.Engine.Channel<Tacocat.SomeContext>} */
  extract: Channel(getEventType('extract')),

  /** @type {Tacocat.Engine.Channel<void>} */
  mount: Channel(getEventType('mount')),

  /** @type {Tacocat.Engine.Channel<void>} */
  observe: Channel(getEventType('observe')),

  /** @type {Tacocat.Engine.Channel<Tacocat.SomeContext>} */
  pending: Channel(getEventType(Stage.pending)),

  /** @type {Tacocat.Engine.Channel<Tacocat.SomeRejection | Tacocat.SomeResolution>} */
  provide: Channel(getEventType('provide')),

  /** @type {Tacocat.Engine.Channel<Tacocat.SomeContext>} */
  refresh: Channel(getEventType('refresh')),

  /** @type {Tacocat.Engine.Channel<Tacocat.SomeRejection>} */
  rejected: Channel(getEventType(Stage.rejected)),

  /** @type {Tacocat.Engine.Channel<Tacocat.SomeContext>} */
  present: Channel(getEventType('present')),

  /** @type {Tacocat.Engine.Channel<Tacocat.SomeResolution>} */
  resolved: Channel(getEventType(Stage.resolved)),

  /** @type {Tacocat.Engine.Channel<void>} */
  unmount: Channel(getEventType('unmount')),
};
