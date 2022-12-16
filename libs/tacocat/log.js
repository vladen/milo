import { getConfig } from '../utils/utils.js';
import { isFunction } from './utilities.js';

const epoch = Date.now();
const isProd = getConfig().env?.name === 'prod';
export const Level = Object.freeze({
  debug: 'debug',
  error: 'error',
  info: 'info',
  warn: 'warn',
});
const filters = new Set();
const tag = 'Log';
const writers = new Set();

const isLog = (object) => object != null && object[Symbol.toStringTag] === tag;

const createRecord = (level, message, namespace, params) => ({
  level,
  message,
  namespace,
  params,
  timestamp: Date.now() - epoch,
});

const debugFilter = { filter: ({ level }) => level !== Level.debug };
const quietFilter = { filter: () => false };

const consoleWriter = {
  writer({ level, message, namespace, params, timestamp }) {
    // eslint-disable-next-line no-console
    console[level](`[${namespace}]`, message, ...params, `(+${timestamp}ms)`);
  },
};

function commitError(message, ...params) {
  consoleWriter.write(createRecord(
    Level.error,
    message,
    // eslint-disable-next-line no-use-before-define
    Log.common.namespace,
    params,
  ));
}

function commitRecord(record) {
  if ([...filters].every((filter) => {
    try {
      return filter(record);
    } catch (error) {
      commitError('Log filter error:', { record, filter });
      return true;
    }
  })) {
    writers.forEach((writer) => {
      try {
        writer(record);
      } catch (error) {
        commitError('Log eriter error:', { record, writer });
      }
    });
  }
}

/**
 * @type {Tacocat.Log.Factory}
 */
const Log = (namespace) => ({
  namespace,
  module(name) {
    return Log(`${namespace}/${name}`);
  },
  debug(message, ...params) {
    commitRecord(createRecord(Level.debug, message, namespace, params));
  },
  error(message, ...params) {
    commitRecord(createRecord(Level.error, message, namespace, params));
  },
  info(message, ...params) {
    commitRecord(createRecord(Level.info, message, namespace, params));
  },
  warn(message, ...params) {
    commitRecord(createRecord(Level.warn, message, namespace, params));
  },
  [Symbol.toStringTag]: tag,
});

Log.level = Level;

Log.reset = () => {
  filters.clear();
  writers.clear();
  if (isProd) {
    Log.use(debugFilter);
  } else {
    Log.use(consoleWriter);
  }
};

Log.use = (...modules) => {
  modules.forEach(
    (module) => {
      const { filter, writer } = module;
      if (isFunction(filter)) {
        filters.add(filter);
      } else if (isFunction(writer)) {
        writers.add(writer);
      } else {
        Log.common.warn('Unknown log module:', { module });
      }
    },
  );

  return Log;
};

Log.common = Log('tacocat');
Log.level = Level;
Log.reset();

export default Log;
export { debugFilter, isLog, quietFilter };
