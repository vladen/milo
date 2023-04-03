import Constant from './constant.js';
import { isFunction } from './util.js';

const epoch = Date.now();

const filters = new Set();
/** @type {Map<string, number>} */
const instances = new Map();
const tag = 'Log';
const writers = new Set();

const Level = Object.freeze({
  debug: 'debug',
  error: 'error',
  info: 'info',
  warn: 'warn',
});

/**
 * @param {string} alias
 * @param {number} instance
 * @param {Tacocat.Log.Level} level
 * @param {string} message
 * @param {string} namespace
 * @param {object} params
 */
const createRecord = (alias, instance, level, message, namespace, params) => ({
  alias,
  instance,
  level,
  message,
  namespace,
  params,
  timestamp: Date.now() - epoch,
});

function reportError(message, ...params) {
  // eslint-disable-next-line no-use-before-define
  Log.consoleWriter.writer(createRecord(
    undefined,
    0,
    // eslint-disable-next-line no-use-before-define
    Log.level.error,
    message,
    // eslint-disable-next-line import/no-named-as-default-member
    Constant.namespace,
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
 * @param {string} [alias]
 */
function Log(namespace, alias) {
  const instance = (instances.get(namespace) ?? 0) + 1;
  instances.set(namespace, instance);
  const id = `${namespace}-${instance}`;

  const createWriter = (level) => (message, ...params) => writeRecord(
    createRecord(alias, instance, level, message, namespace, params),
  );

  return Object.seal({
    alias,
    id,
    namespace,
    /**
     * @param {string} name
     * @param {string} alias
     * @returns {Tacocat.Log.Instance}
     */
    // eslint-disable-next-line no-shadow
    module(name, alias) {
      return Log(`${namespace}/${name}`, alias);
    },
    debug: createWriter(Level.debug),
    error: createWriter(Level.error),
    info: createWriter(Level.info),
    warn: createWriter(Level.warn),
    [Symbol.toStringTag]: tag,
  });
}

Log.level = Level;

Log.debugFilter = { filter: ({ level }) => level !== Level.debug };
Log.quietFilter = { filter: () => false };

Log.consoleWriter = {
  writer({
    alias, instance, level, message, namespace, params, timestamp,
  }) {
    // eslint-disable-next-line no-console
    console[level](
      `[${namespace}${alias ? `:${alias}` : ''} #${instance}]`,
      message,
      ...params,
      `(+${timestamp}ms)`,
    );
  },
};

/** @type {Tacocat.Log.isLog} */
Log.isLog = (object) => object != null && object[Symbol.toStringTag] === tag;

Log.reset = (env = 'prod') => {
  filters.clear();
  writers.clear();
  if (env?.toLowerCase() === 'dev') {
    Log.use(Log.consoleWriter);
  } else {
    Log.use(Log.debugFilter);
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
Log.common = Log(Constant.namespace);
Log.reset();

export default Log;
