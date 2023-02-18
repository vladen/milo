import Log from './log.js';
import { safeSync } from './safe.js';

function Compare(comparer) {
  const log = Log.common.module('compare');
  log.debug('Created:', { comparer });

  return (one, two) => safeSync(
    log,
    'Comparer callback error:',
    () => comparer(one, two),
  );
}

export default Compare;
