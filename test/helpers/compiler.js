import webpack from 'webpack';
import path from 'path';
import {createFsFromVolume, Volume} from 'memfs';
import StripCodeWebpackPlugin from '../../src/plugin';
import {fileURLToPath} from 'node:url';

const __dirname = import.meta.dirname ?? path.dirname(fileURLToPath(import.meta.url));

export function createWebpack(file, pluginOptions = {}, webpackOptions = {}) {
  const compiler = webpack({
    cache: false,
    entry: {
      fixture: (file.path && file.path()) || path.resolve(__dirname, `../fixtures/${file}`),
    },
    optimization: {
      minimize: false,
    },
    output: {
      pathinfo: false,
      filename: '[name].js',
    },
    module: {
      rules: [
        {
          test: /\.tmp$/i,
          use: [
            {
              loader: path.resolve(__dirname, './raw-emitter.js'),
              options: {},
            },
          ],
        },
      ],
    },
    plugins: [new StripCodeWebpackPlugin(pluginOptions)],
    ...webpackOptions,
  });

  compiler.outputFileSystem = createFsFromVolume(new Volume());
  compiler.outputFileSystem.join = path.join.bind(path);

  return {
    async compile(input) {
      file.write && file.write(input);
      const compileStats = await compile(input, compiler);
      return {
        getCompiledOutput() {
          return retrieveCompiledOutput(compiler, compileStats);
        },
        getCompiledFixture() {
          return retrieveCompiledFixture(compiler, compileStats);
        },
      };
    },
  };
}

export function createWebpackWithEnv(file, environment, pluginOptions = {}, webpackOptions = {}) {
  process.env.NODE_ENV = environment;

  return createWebpack(file, pluginOptions, webpackOptions);
}

async function compile(input, compiler) {
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        return reject(err);
      }

      if (stats.hasErrors()) {
        return reject(new Error(stats.toJson().errors));
      }

      if (compiler.close) {
        compiler.close(() => {
          resolve(stats);
        });
      } else {
        resolve(stats);
      }
    });
  });
}

function retrieveCompiled(compiler, stats, filename) {
  const usedFs = compiler.outputFileSystem;
  const outputPath = stats.compilation.outputOptions.path;

  let data = '';

  try {
    data = usedFs.readFileSync(path.join(outputPath, filename)).toString();
  } catch (err) {
    data = err.toString();
  }

  return data;
}

function retrieveCompiledFixture(compiler, stats) {
  return retrieveCompiled(compiler, stats, retrieveFirstEntry(compiler));
}

function retrieveFirstEntry(compiler) {
  const entity = compiler.options.entry.fixture?.import
    ? compiler.options.entry.fixture.import[0]
    : compiler.options.entry.fixture;

  return path.basename(entity);
}

function retrieveCompiledOutput(compiler, stats) {
  return retrieveCompiled(compiler, stats, retrieveFirstAsset(stats));
}

function retrieveFirstAsset(stats) {
  return stats.toJson({source: true}).assets[0].name;
}
