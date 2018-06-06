const merge = require('webpack-merge');

const parts = require('./config/webpack.parts');
const pkg = require('./package.json');
const { PATHS } = require('./config/path-help');

const IS_DEV = process.env.NODE_ENV === 'development';
const browsers = ['>1%', 'last 4 versions', 'Firefox ESR', 'not ie < 9'];
const PUBLIC_PATH = IS_DEV ? '/' : './';

const babelConfig = Object.assign({}, pkg.babelConfig, {
  // 没有.bablerc文件
  babelrc: false,
  // 在dev时设置成true来调用缓存，提高性能
  cacheDirectory: IS_DEV,
  presets: pkg.babelConfig.presets.map(
    key =>
      (key === '@babel/preset-env'
        ? [
          '@babel/preset-env',
          {
            targets: {
              browsers
            },
            modules: false
          }
        ]
        : key)
  )
});

const commonConfig = merge([
  {
    mode: IS_DEV ? 'development' : 'production',
  },
  {
    output: {
      publicPath: PUBLIC_PATH
    }
  },
  {
    resolve: {
      extensions: ['.js', '.json', '.jsx']
    }
  },
  parts.loadJavaScript({
    include: PATHS.app,
    exclude: /node_modules/,
    options: babelConfig
  }),
  parts.loadFonts(),
  parts.loadImage(),
]);

const developmentConfig = merge([
  {
    output: {
      filename: '[name].js',
      chunkFilename: '[chunkhash].js'
    }
  },
  parts.loadCSS({
    include: PATHS.app,
    exclude: /node_modules/,
    path: PATHS.postcss
  }),
  parts.generateSourceMaps,
  parts.setFreeVariable('__DEVELOPMENT__', 'true'),
]);


const productionConfig = merge([
  {
    performance: {
      hints: 'warning',
      maxEntrypointSize: 150000,
      maxAssetSize: 450000
    }
  },
  {
    recordsPath: PATHS.recordsPath,
    output: {
      chunkFilename: '[name].[chunkhash:4].js',
      filename: '[name].[chunkhash:4].js',
      globalObject: 'this'
    }
  },
  parts.clean(PATHS.build),
  parts.minifyJavaScript(),
  parts.minifyCSS(),
  parts.extractCSS({
    include: PATHS.app,
    exclude: /node_modules/,
    path: PATHS.postcss
  }),
  parts.loadPWA(),
  {
    optimization: {
      minimize: true,
      splitChunks: {
        cacheGroups: {
          vendors: {
            test: /node_modules/,
            name: 'vendors',
            enforce: true,
            chunks: 'initial'
          }
        }
      },
      runtimeChunk: {
        name: 'manifest'
      }
    }
  }
]);

const pages = [
  parts.page({
    entry: {
      // webpack-dev-server need Aarry entry
      app: [
        PATHS.app
      ]
    },
    title: 'Webpack demo',
    chunks: ['app', 'manifest', 'vendor'],
    inject: false,
    appMountId: 'app',
    favicon: './apple-icon-60x60.png',
    mobile: true,
    meta: [
      {
        name: 'apple-mobile-web-app-capable',
        content: 'yes'
      },
      {
        name: 'x5-fullscreen',
        content: true
      },
      {
        name: 'full-screen',
        content: 'yes'
      },
      {
        name: 'viewport',
        content:
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, minimal-ui'
      }
    ]
  }),
];
const config = IS_DEV ? developmentConfig : productionConfig;

module.exports = merge([commonConfig, config].concat(pages));
