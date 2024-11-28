import {describe, beforeAll, beforeEach, afterAll, expect, it} from 'vitest';
import {createWebpack, createWebpackWithEnv} from '../helpers/compiler';
import EntryKeeper from '../helpers/entry-keeper';

describe('default test suite', () => {
  const originalMode = process.env.NODE_ENV;
  const keeper = new EntryKeeper();

  beforeAll(async () => {
    await keeper.open('default.tmp');
  });

  beforeEach(() => {
    process.env.NODE_ENV = originalMode;
  });

  afterAll(async () => {
    await keeper.close();
  });

  it.each([
    ['production', '/* dev-start */ any /* dev-end */', ''],
    ['test', '/* dev-start */ any /* dev-end */', ''],
  ])('can proceed in %s environment', async (environment, input, expected) => {
    const webpack = createWebpackWithEnv(keeper, environment);

    const output = (await webpack.compile(input)).getCompiledFixture();

    expect(output).toStrictEqual(expected);
  });

  // prettier-ignore
  it.each([
    ['development', '/* dev-start */ any /* dev-end */', '/* dev-start */ any /* dev-end */'],
  ])('can skip in %s environment', async (environment, input, expected) => {
    const webpack = createWebpackWithEnv(keeper, environment);

    const output = (await webpack.compile(input)).getCompiledFixture();

    expect(output).toStrictEqual(expected);
  });

  it('can skip development environment set with a webpack option', async () => {
    const webpack = createWebpack(keeper, {}, {mode: 'development'});

    const input = '/* dev-start */ any /* dev-end */';
    const expected = '/* dev-start */ any /* dev-end */';

    const output = (await webpack.compile(input)).getCompiledFixture();

    expect(output).toStrictEqual(expected);
  });

  it('can handle a none mode option', async () => {
    const webpack = createWebpack(keeper, {}, {mode: 'none'});

    const input = '/* dev-start */ any /* dev-end */';
    const expected = '';

    const output = (await webpack.compile(input)).getCompiledFixture();

    expect(output).toStrictEqual(expected);
  });

  it('can handle an empty blocks options', async () => {
    const webpack = createWebpack(keeper, {blocks: []});

    const input = '/* dev-start */ any /* dev-end */';
    const expected = '';

    const output = (await webpack.compile(input)).getCompiledFixture();

    expect(output).toStrictEqual(expected);
  });

  it.each([
    ['is of a wrong type', {blocks: 'wrong'}, 'blocks option must be an array'],
    ['has a wrong value', {blocks: [42]}, 'blocks.0 should be a string or a valid object'],
  ])('can validate blocks option when it %s', async (_, options, expected) => {
    const webpack = createWebpack(keeper, options);

    try {
      await webpack.compile('any');
    } catch (e) {
      expect(e.message).toMatch(expected);
    }

    expect.assertions(1);
  });

  it('can remove a code block marked with the colon (default block representation)', async () => {
    const webpack = createWebpack(keeper);

    const input = 'visible /* dev-start */ will be removed /* dev-end */';
    const expected = 'visible ';

    const output = (await webpack.compile(input)).getCompiledFixture();

    expect(output).toStrictEqual(expected);
  });

  it('can use special characters in names', async () => {
    const webpack = createWebpack(keeper, {
      blocks: [
        {
          start: '*dev#start!',
          end: '*dev#end!',
          prefix: '<!--',
          suffix: '-->',
        },
      ],
    });

    const input = 'visible <!-- *dev#start! --> will be removed <!-- *dev#end! -->';
    const expected = 'visible ';

    const output = (await webpack.compile(input)).getCompiledFixture();

    expect(output).toStrictEqual(expected);
  });

  it('can remove a code block marked in lower case', async () => {
    const webpack = createWebpack(keeper);

    const input = 'visible /* dev-start */ will be removed /* dev-end */';
    const expected = 'visible ';

    const output = (await webpack.compile(input)).getCompiledFixture();

    expect(output).toStrictEqual(expected);
  });

  it('cannot remove a code block marked in upper case with default options', async () => {
    const webpack = createWebpack(keeper);

    const input = "visible /* DEVBLOCK:START */ won't be removed /* DEVBLOCK:END */";
    const expected = `visible /* DEVBLOCK:START */ won't be removed /* DEVBLOCK:END */`;

    const output = (await webpack.compile(input)).getCompiledFixture();

    expect(output).toStrictEqual(expected);
  });

  it('can remove a code block marked in upper case with the specific options', async () => {
    const webpack = createWebpack(keeper, {
      blocks: [
        {
          start: 'DEVBLOCK-START',
          end: 'DEVBLOCK-END',
          prefix: '/*',
          suffix: '*/',
        },
      ],
    });

    const input = 'visible /* DEVBLOCK-START */ will be removed /* DEVBLOCK-END */';
    const expected = 'visible ';

    const output = (await webpack.compile(input)).getCompiledFixture();

    expect(output).toStrictEqual(expected);
  });
});
