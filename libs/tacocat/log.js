import { getConfig } from '../utils/utils';
import safe from './safe';

const epoch = Date.now();
const isProd = 'prod' === getConfig().env.name;
export const level = Object.freeze({
  debug: 'debug',
  error: 'error',
  info: 'info',
  warn: 'warn'
});
const filters = [];
const tag = 'Log';
const writers = [];

if (isProd) {
  filters.push(({ level }) => level !== level.debug);
} else {
  writers.push(({ level, message, namespace, parameters, timestamp }) => {
    console[level](`[${namespace}]`, message, ...parameters, `(+${timestamp}ms)`);
  });
}

const isLog = (object) => object != null && object[Symbol.toStringTag] === tag;

function write(level, message, namespace, params) {
  const record = {
    level,
    message,
    namespace,
    params,
    timestamp: Date.now() - epoch,
  };
  if (
    filters.every((filter) => safe(
      'Log filter error:',
      () => filter(record)
    ))
  ) {
    writers.forEach((write) => safe(
      'Log writer error:',
      () => write(record)
    ));
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
    write(level.debug, message, namespace, params);
  },
  error(message, ...params) {
    write(level.error, message, namespace, params);
  },
  info(message, ...params) {
    write(level.info, message, namespace, params);
  },
  warn(message, ...params) {
    write(level.warn, message, namespace, params);
  },
  [Symbol.toStringTag]: tag,
});

Log.use = (...modules) => {
  for (const module of modules) {
    const { filter, write } = module;
    if (typeof filter === 'function') {
      filters.push(filter);
    }
    if (typeof write === 'function') {
      writers.push(write);
    } else {
      Log.common.warn('Unknown log module:', { module });
    }
  }
  return Log;
}

Log.common = Log('tacocat');
Log.level = level;

export default Log;
export { isLog, Log };
