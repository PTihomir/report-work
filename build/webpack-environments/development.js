/* eslint key-spacing:0 */
import webpack from 'webpack';
import _debug from 'debug';

import config from '../../config';
import webpackCommon from './common.js';

const debug = _debug('report:webpack:development');
debug('Create configuration.');
debug('Enable plugins for live development (HMR, NoErrors).');

const webpackDevelopment = {
  ...webpackCommon,
  entry: {
    ...webpackCommon.entry,
    app: [
      ...webpackCommon.entry.app,
      `webpack-hot-middleware/client?path=${config.compiler_public_path}__webpack_hmr`,
    ],
  },
  output: {
    ...webpackCommon.output,
    // Show in comments the real path to the modules
    pathinfo: true,
  },
  module: {
    ...webpackCommon.module,
    loaders: [
      ...webpackCommon.module.loaders,
      {
        test: /\.scss$/,
        loaders: [ 'style', 'css?sourceMap', 'postcss', 'sass?sourceMap' ],
      }, {
        test: /\.css$/,
        loaders: [ 'style', 'css?sourceMap', 'postcss' ],
      },
    ],
  },
  // Override devtool with "cheap-module-eval-source-map".
  // devtool: 'cheap-module-eval-source-map',
  plugins: [
    ...webpackCommon.plugins,
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
    new webpack.optimize.CommonsChunkPlugin({
      names: ['vendor'],
    }),
  ],
  eslint: {
    ...webpackCommon.eslint,
    emitWarning: true,
  },
};

export default webpackDevelopment;
