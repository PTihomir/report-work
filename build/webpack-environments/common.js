import webpack from 'webpack';
import cssnano from 'cssnano';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import _debug from 'debug';
import path from 'path';

import config from '../../config';

const debug = _debug('report:webpack:common');
const paths = config.utils_paths;

debug('Create configuration.');

export default {
  // cache: true,
  // name: 'client',
  // target: 'web', // default
  entry: {
    // Entry point.
    app: [paths.base(config.dir_client) + '/main.js'],
    // Get list of vendor files from config.
    vendor: config.compiler_vendor,
  },
  output: {
    filename: `js/[name].[${config.compiler_hash_type}].js`,
    path: paths.dist(),
    publicPath: config.compiler_public_path,
  },
  module: {
    // See: https://github.com/webpack/webpack/issues/198
    noParse: [/moment.js/],
    loaders: [
      {
        test: /\.json$/,
        loaders: ['json'],
      }, {
        test: /\.svg(\?.*)?$/,
        loader: 'url?prefix=fonts/&name=[path][name].[ext]&limit=10000&mimetype=image/svg+xml',
      }, {
        test: /\.(png|jpg)$/,
        loader: 'url?limit=8192',
      },
      {
        test: /\.js$/,
        loader: 'rebem-layers',
        exclude: /node_modules/,
        query: {
          layers: [
            // app components
            require(paths.client('components')),
            require(paths.client('theme')),
            // container components
            // {
            //   path: path.resolve('src/containers'),
            //   files: {
            //     main: 'index.js',
            //     styles: 'styles.scss',
            //   },
            // },
          ],
          // app source
          consumers: [
            path.resolve('app_front/layouts'),
          ],
          importFactory: false,
        },
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        // query: {
        //   presets: ['es2015'],
          // plugins: ['transform-rebem-jsx', 'transform-runtime'],
          // env: {
            // development: {
            //   presets: [ 'react-hmre' ],
            //   plugins: [
            //     ['react-transform', {
            //       transforms: [{
            //         transform: 'react-transform-hmr',
            //         imports: ['react'],
            //         locals: ['module'],
            //       }, {
            //         transform: 'react-transform-catch-errors',
            //         imports: ['react', 'redbox-react'],
            //       }],
            //     }],
            //   ],
            // },
          //   production: {
          //     presets: ['es2015', 'react', 'stage-0'],
          //     plugins: [
          //       'transform-react-remove-prop-types',
          //       'transform-react-constant-elements',
          //     ],
          //   },
          // },
        // },
      },
      {
        test: /\.js$/,
        loader: 'eslint-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    root: [
      paths.client(),
    ],
    extensions: ['', '.js', '.json'],
  },
  plugins: [
    new webpack.DefinePlugin(config.globals),
    new HtmlWebpackPlugin({
      template: paths.client('index.html'),
      hash: false,
      // favicon: paths.client('static/favicon.ico'),
      filename: 'index.html',
      inject: 'body',
      minify: {
        collapseWhitespace: true,
      },
    }),
  ],
  sassLoader: {
    includePaths: paths.client('css'),
  },
  postcss: [
    cssnano({
      sourcemap: true,
      safe: true,
      autoprefixer: {
        add: true,
        remove: true,
        browsers: ['last 2 versions'],
      },
      discardComments: {
        removeAll: true,
      },
    }),
  ],
  devtool: config.compiler_devtool,
  eslint: {
    configFile: paths.base('.eslintrc'),
  },
};
