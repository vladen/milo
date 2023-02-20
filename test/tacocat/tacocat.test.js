import Log, { quietFilter } from '../../libs/tacocat/log.js';
import tacocat from '../../libs/tacocat/tacocat.js';

const attribute = 'data-test';
const defined = 'defined';
const extracted = 'extracted';
const rejected = 'rejected';
const resolved = 'rejected';

const createBasePipeline = () => tacocat
  .define({ defined })
  .extract(
    (context, element) => Promise.resolve({
      ...context,
      extracted: element.getAttribute(attribute),
    }),
    {
      events: ['click'],
      mutations: { attributeFilter: [attribute] },
    },
  );

const createRejectPipeline = () => createBasePipeline()
  .provide(
    (contexts) => Promise.resolve(contexts.map((context) => {
      const error = new Error('test');
      error.context = context;
      return Promise.reject(error);
    })),
  )
  .pending((element, state) => {
    element.state = state;
  })
  .resolved((element, state) => {
    element.state = state;
  });

const createResolvePipeline = () => createBasePipeline()
  .provide(
    (contexts) => Promise.resolve(contexts.map((context) => ({
      context,
      value: resolved,
    }))),
  )
  .pending((element, state) => {
    element.state = state;
  })
  .resolved((element, state) => {
    element.state = state;
  });

describe('function "tacocat"', () => {
  after(() => {
    Log.reset();
  });
  before(() => {
    Log.use(quietFilter);
  });

  it('processes', () => {
    createResolvePipeline()
      .observe(document.body, 'p')
      .explore(document.querySelector('test'));
  });
});
