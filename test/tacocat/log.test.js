/// <reference path="../../libs/tacocat/types.d.ts" />

import { expect } from '@esm-bundle/chai';
import { spy } from 'sinon';
import Log, { isLog } from '../../libs/tacocat/log.js';

describe.skip('isLog', () => {
  it('returns false of argument is not an instance of Log', () => {
    expect(isLog()).to.be.false;
  });

  it('returns true of argument is an instance of Log', () => {
    expect(isLog(Log.common)).to.be.true;
    expect(isLog(Log('namespace'))).to.be.true;
  });
});

describe.skip('Log', () => {
  describe('object', () => {
    describe('module', () => {
      it('returns new Log instance with module name added to namespace', () => {
        expect(Log('test').module('module').namespace).to.contain('module');
      });
    });

    describe('namespace', () => {
      it('returns namespace assigned to the Log instance', () => {
        expect(Log('test').namespace).to.contain('test');
      });
    });
  });

  describe.only('use', () => {
    it('registers log filter module', () => {
      const filter = spy();
      Log.use({ filter });
      Log.common.error('Test');
      expect(filter.firstCall.firstArg).to.contain({
        level: Log.level.error,
        message: 'Test',
      });
    });

    it.only('registers log writer module', () => {
      const write = spy();
      Log.use({ write });
      Log.common.error('Test');
      expect(write.firstCall.firstArg).to.contain({
        level: Log.level.error,
        message: 'Test',
      });
    });
  });
});
