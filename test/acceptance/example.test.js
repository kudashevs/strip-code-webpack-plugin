import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import converter from '../helpers/converter.js';
import {createWebpack} from '../helpers/compiler';
import EntryKeeper from '../helpers/entry-keeper';
import WebpackPlugin from '../../src';

describe('README example test suite', () => {
  const keeper = new EntryKeeper();
  const input = `function makeFoo(bar, baz) {
    /* debug-start */ console.log('creating Foo'); /* debug-end */
    // dev-start
    if (bar instanceof Bar !== true) {
        throw new Error('makeFoo: bar param must be an instance of Bar');
    }
    // dev-end
    // dev-start
    if (baz instanceof Baz !== true) {
        throw new Error('makeFoo: baz param must be an instance of Baz');
    }
    // dev-end
    // This code will remain
    return new Foo(bar, baz);
}`;

  const expected = `function makeFoo(bar, baz) {
    // This code will remain
    return new Foo(bar, baz);
}`;

  beforeAll(async () => {
    await keeper.open('example.js');
  });

  afterAll(async () => {
    await keeper.close();
  });

  it('can process the example from README.md', async () => {
    const webpack = createWebpack(
      keeper,
      {},
      {
        plugins: [
          new WebpackPlugin({
            blocks: [
              'debug',
              {
                start: 'dev-start',
                end: 'dev-end',
                prefix: '//',
                suffix: '',
              },
            ],
          }),
        ],
      },
    );

    const output = (await webpack.compile(input)).getCompiledOutput();

    expect(converter(output)).toMatch(converter(expected));
  });
});
