import { delay } from './utilities.js';

/**
 * @param {Tacocat.Engine.Control} control
 * @returns {Tacocat.Internal.Control}
 */
const Control = ({
  signal,
  timeout = 30000,
}) => ({
  get promise() {
    return delay(timeout, signal);
  },
  signal,
  timeout,
});

export default Control;
