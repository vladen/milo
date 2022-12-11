/// <reference path="../../libs/tacocat/types.d.ts" />

import { expect } from '@esm-bundle/chai';
import { spy } from 'sinon';
import Log, { debugFilter } from '../../libs/tacocat/log.js';
import Process from '../../libs/tacocat/process.js';

function Deferal() {
  const object = {};
  object.promise = new Promise((resolve) => {
    object.resolve = resolve;
  });
  return object;
}

describe('Process', () => {
  after(() => {
    Log.reset();
  });
  before(() => {
    Log.use();
  });

  it('immediately calls "resolver" callback for static results', () => {
    const product = { context: {}, value: 1 };
    const products = [product, [product, product, [product]]];
    const resolver = spy();
    Process(Log.common, resolver, products);
    expect(resolver.firstCall.firstArg).to.deep.equal(products.flat(3));
  });

  it('calls "resolver" callback only after all promises fulfil', async () => {
    const product1 = { context: {}, value: 1 };
    const product2 = { context: {}, value: 2 };
    const product3 = { context: {}, value: 3 };
    const promise1 = Promise.resolve(product1);
    const promise2 = Promise.resolve(product2);
    const promise3 = Promise.resolve(product3);
    const resolver = spy();
    Process(
      Log.common,
      () => { },
      Promise.resolve([promise1, promise2, [promise3]]),
    );
    expect(resolver.called).to.equal(false);
    await promise1;
    expect(resolver.called).to.equal(false);
    await promise2;
    expect(resolver.called).to.equal(false);
    await promise2;
    expect(resolver.firstCall.firstArg).to.equal([product1, product2, product3]);
  });

  it.only('calls "transformer" callback for each product in results', async () => {
    const deferal = Deferal();
    const product1 = { context: {}, value: 1 };
    const product2 = { context: {}, value: 2 };
    const product3 = { context: {}, value: 3 };
    const transformer = spy((product) => product);
    debugger;
    Process(
      Log.common,
      deferal.resolve,
      [product1, Promise.resolve([product3, Promise.resolve(product3)])],
      transformer,
    );
    await deferal.promise;

    expect(transformer.firstCall.firstArg).to.equal(product1);
    expect(transformer.secondCall.firstArg).to.equal(product2);
    expect(transformer.thirdCall.firstArg).to.equal(product3);
  });
});
