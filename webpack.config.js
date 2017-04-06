const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const SriPlugin = require('webpack-subresource-integrity');
const debug = require('debug')('report:webpack');
const webpack = require('webpack');
const { getIfUtils, removeEmpty } = require('webpack-config-utils');
const { resolve } = require('path');

/**
 * Webpack configuration factory.
 *
 * Builds the Webpack configuration based on the given options. The options can
 * be provided using the Webpack CLI --env parameter. The following options are
 * currently supported.
 *
 * --env.dev / --env.prod
 *   Selects the configuration mode.
 *
 * --env.basename BASENAME
 *   Sets the basename for the URLs.
 *
 * --env.devtools
 *   Enables the Redux DevTools extension (if installed in browser).
 *
 * @param  {Object} env Configuration options.
 * @return {Object}     Webpack configuration.
 */
module.exports = (env) => {
  const { ifProd, ifNotProd, ifTest, ifDev } = getIfUtils(env);
  const NODE_ENV = ifProd('production', ifTest('test', 'development'));

  // Set the Node environment explicitly based on the --env parameter
  // rather than letting it pass through the calling environment.
  process.env.NODE_ENV = NODE_ENV;
  debug(`Configuring Webpack for environment: ${process.env.NODE_ENV}`);

  const GLOBALS = {
    'process.env': {
      NODE_ENV: JSON.stringify(NODE_ENV),
      REBEM_MOD_DELIM: JSON.stringify('--'),
      REBEM_ELEM_DELIM: JSON.stringify('__'),
    },
    'report': {
      // API_ROOT: JSON.stringify(env.apiroot),
      // UPDATE_POLLING_INTERVAL: env.poll_interval || 60000,
      // APP_ID: JSON.stringify(env.appid || '77hxTrwHQ3yaEd5AY6IwdA'),
    },
    'NODE_ENV': JSON.stringify(NODE_ENV),
    '__DEV__': ifDev(),
    '__PROD__': ifProd(),
    '__TEST__': ifTest(),
    '__DEBUG__': env.devtools,
    '__BASENAME__': JSON.stringify(env.basename || '/'),
  };
  const LOADER_OPTIONS = {
    minimize: ifProd(),
    debug: false,
    sassLoader: {
      includePaths: resolve('./app_front/css'),
    },
  };

  const config = {
    context: resolve('app_front'),
    entry: {
      app: './main.js',
    },
    output: {
      filename: ifProd('bundle.[name].[chunkhash].js', 'bundle.[name].js'),
      path: resolve('app_front_dist'),
      pathinfo: ifNotProd(),
      publicPath: env.basename || '/',
      crossOriginLoading: 'anonymous',
    },
    stats: ifProd({
      // Add asset Information
      assets: true,
      // Add information about cached (not built) modules
      cached: true,
      // Add children information
      children: false,
      // Add chunk information (setting this to `false` allows for a less verbose output)
      chunks: true,
      // Add built modules information to chunk information
      chunkModules: true,
      // Add the origins of chunks and chunk merging info
      chunkOrigins: true,
      // Add errors
      errors: true,
      // Add details to errors (like resolving log)
      errorDetails: true,
      // Add the hash of the compilation
      hash: true,
      // Add built modules information
      modules: true,
      // Add information about the reasons why modules are included
      reasons: true,
      // Add the source code of modules
      source: true,
      // Add timing information
      timings: true,
      // Add webpack version information
      version: true,
      // Add warnings
      warnings: true,
    }, 'minimal'),
    devtool: ifProd('source-map', ifDev('eval-source-map', false)),
    module: {
      strictExportPresence: true,
      noParse: [
        /moment\.js/,
      ],
      rules: removeEmpty([
        ifProd({
          test: /\.js$/,
          exclude: /node_modules/,
          enforce: 'pre',
          use: [
            {
              loader: 'eslint-loader',
              options: {
                failOnWarning: true,
                failOnError: true,
              },
            },
          ],
        }),
        {
          test: /\.otf$/,
          use: [
            {
              loader: 'url-loader',
              options: {
                prefix: 'fonts/',
                name: '[path][name].[ext]',
                limit: 10000,
                mimetype: 'font/opentype',
              },
            },
          ],
        },
        {
          test: /\.svg(\?.*)?$/,
          exclude: /src\/icons/,
          use: [
            {
              loader: 'url-loader',
              options: {
                prefix: 'fonts/',
                name: '[path][name].[ext]',
                limit: 10000,
                mimetype: 'image/svg+xml',
              },
            },
          ],
        },
        {
          test: /\.(png|jpg|gif)$/,
          use: [
            {
              loader: 'url-loader',
              options: {
                limit: 1024,
              },
            },
          ],
        },
        {
          test: /\.scss$/,
          loader: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            // loader: ['css-loader', 'sass-loader'],
            use: [
              {
                loader: 'css-loader',
              },
              {
                loader: 'sass-loader',
              },
            ],
          }),
        },
        {
          test: /\.css$/,
          loader: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: [
              {
                loader: 'css-loader',
              },
            ],
          }),
        },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                cacheDirectory: false,
              },
            },
          ],
        },
      ]),
    },
    plugins: removeEmpty([
      new ProgressBarPlugin(),
      new webpack.DefinePlugin(GLOBALS),
      new webpack.LoaderOptionsPlugin(LOADER_OPTIONS),
      new ExtractTextPlugin({
        filename: 'styles.[name].[chunkhash].css',
        disable: ifDev() || ifTest(),
        allChunks: true,
      }),
      // Strip out parts of lodash we don't need in our application. If we need
      // to use additional lodash functionality in the future the corresponding
      // section must be enabled here. See
      // https://github.com/lodash/lodash-webpack-plugin#feature-sets for the
      // list of available sections.
      new LodashModuleReplacementPlugin({
        cloning: true,
        coercions: true,
        collections: true,
        paths: true,
        shorthands: true,
      }),
      ifProd(new webpack.optimize.UglifyJsPlugin({
        compress: {
          booleans: true,
          collapse_vars: true,
          conditionals: true,
          dead_code: true,
          drop_debugger: true,
          if_return: true,
          loops: true,
          properties: true,
          screw_ie8: true,
          sequences: true,
          unsafe: true,
          unused: true,
          warnings: false,
        },
      })),
      ifProd(new webpack.optimize.CommonsChunkPlugin({
        name: 'vendor',
        // Bundle everything in node_modules to vendor.
        minChunks: (module) => module.context && module.context.indexOf('node_modules') !== -1,
      })),
      ifProd(new webpack.optimize.CommonsChunkPlugin({
        name: 'manifest',
        minChunks: Infinity,
      })),
      ifProd(new SriPlugin({
        hashFuncNames: ['sha256', 'sha384'],
      })),
      new HtmlWebpackPlugin({
        template: './index.html',
        inject: 'body',
      }),
      ifProd(new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        reportFilename: 'bundle-size.html',
        generateStatsFile: true,
        statsFilename: 'bundle-size.json',
        logLevel: 'info',
        openAnalyzer: false,
      })),
    ]),
    resolve: {
      modules: [
        resolve('src'),
        resolve('node_modules'),
      ],
    },
    resolveLoader: {
      modules: [
        resolve('src'),
        resolve('node_modules'),
      ],
    },
    externals: ifTest({
      'react/addons': 'react',
      'react/lib/ExecutionEnvironment': 'react',
      'react/lib/ReactContext': 'react',
    }, {}),
    performance: ifProd({
      hints: 'warning',
    }, false),
    devServer: {
      historyApiFallback: true,
      // with webpack-dev-server@2.2.0-rc.0 enabling the hot reload here
      // does not seem to work and we get a "[HMR] Hot Module Replacement is disabled."
      // exception. Enabling it on the command line with the --hot parameter
      // does work.
      // hot: true,
      noInfo: true,
      port: 8000,
    },
  };

  // Use the `yarn run debug:*` scripts to enter the remote debugger in a browser.
  if (env.debug) {
    console.log(config);
    debugger; // eslint-disable-line
  }

  return config;
};
