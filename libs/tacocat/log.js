import constants from './constants.js';
import { isFunction } from './utilities.js';

const epoch = Date.now();
/** @type {Map<string, number>} */
const indexes = new Map();

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

const createRecord = (instance, level, message, namespace, params) => ({
  instance,
  level,
  message,
  namespace,
  params,
  timestamp: Date.now() - epoch,
});

const debugLogFilter = { filter: ({ level }) => level !== Level.debug };
const quietLogFilter = { filter: () => false };

const consoleLogWriter = {
  writer({
    instance, level, message, namespace, params, timestamp,
  }) {
    // eslint-disable-next-line no-console
    console[level](
      `[${namespace}] #${instance}`,
      message,
      ...params,
      `(+${timestamp}ms)`,
    );
  },
};

function reportError(message, ...params) {
  consoleLogWriter.write(createRecord(
    Level.error,
    message,
    // eslint-disable-next-line no-use-before-define
    Log.common.namespace,
    params,
  ));
}

function writeRecord(record) {
  const committing = [...filters].every((filter) => {
    try {
      return filter(record);
    } catch (error) {
      reportError('Log filter error:', { record, filter });
      return true;
    }
  });
  if (committing) {
    writers.forEach((writer) => {
      try {
        writer(record);
      } catch (error) {
        reportError('Log writer error:', { record, writer });
      }
    });
  }
}

/**
 * @type {Tacocat.Log.Factory}
 * @param {string} namespace
 */
function Log(namespace) {
  const index = (indexes.get(namespace) ?? 0);
  indexes.set(namespace, index);
  const id = `${namespace}-${index}`;

  const createWriter = (level) => (message, ...params) => writeRecord(
    createRecord(index, level, message, namespace, params),
  );

  return Object.seal({
    id,
    namespace,
    module(name) {
      return Log(`${namespace}/${name}`);
    },
    debug: createWriter(Level.debug),
    error: createWriter(Level.error),
    info: createWriter(Level.info),
    warn: createWriter(Level.warn),
    [Symbol.toStringTag]: tag,
  });
}

Log.level = Level;

Log.reset = (env) => {
  filters.clear();
  writers.clear();
  if (true || env?.startsWith('dev')) {
    Log.use(consoleLogWriter);
  } else {
    Log.use(debugLogFilter);
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

// eslint-disable-next-line import/no-named-as-default-member
Log.common = Log(constants.namespace);
Log.level = Level;
Log.reset();

export default Log;
export { consoleLogWriter, debugLogFilter, isLog, quietLogFilter };
