import { sinon } from '../utils';

const ogLana = window.lana;

export function mockLana() {
  const lana = {
    log: sinon.spy(),
  };
  window.lana = lana;
  return lana;
}

export function unmockLana() {
  window.lana = ogLana;
}
