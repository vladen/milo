/**
 * @param {Tacocat.Engine.Control} control
 * @returns {Tacocat.Internal.Control}
 */
const Control = ({ signal, timeout = 30000 }) => ({
  promise: new Promise((_, reject) => {
    let timer;
    const aborted = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', aborted);
      reject(new Error('Aborted'));
    };
    signal.addEventListener('abort', aborted);
    timer = setTimeout(aborted, timeout);
  }),
  signal,
  timeout,
});

export default Control;
