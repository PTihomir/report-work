/* eslint key-spacing:0 */
import webpack from 'webpack';
import _debug from 'debug';

import ExtractTextPlugin from 'extract-text-webpack-plugin';

import webpackCommon from './common.js';

const debug = _debug('report:webpack:production');
debug('Create configuration.');
debug('Enable plugins for production (OccurenceOrder, Dedupe & UglifyJS).');
debug('Apply ExtractTextPlugin to CSS loaders.');

const webpackDevelopment = {
  ...webpackCommon,
  module: {
    ...webpackCommon.module,
    loaders: [...webpackCommon.module.loaders,
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract('style', [ 'css?sourceMap', 'postcss', 'sass?sourceMap' ].join('!')),
      }, {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract('style', [ 'css?sourceMap', 'postcss' ].join('!')),
      },
    ],
  },
  plugins: [
    ...webpackCommon.plugins,
    new webpack.optimize.CommonsChunkPlugin({
      names: ['vendor'],
    }),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        unused: true,
        dead_code: true,
        warnings: false,
      },
    }),
    new ExtractTextPlugin('[name].[contenthash].css', {
      allChunks: true,
    }),
  ],
  eslint: {
    ...webpackCommon.eslint,
    failOnWarning: true,
    failOnError: true,
  },
};

export default webpackDevelopment;
