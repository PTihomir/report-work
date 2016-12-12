import WebpackDevMiddleware from 'webpack-dev-middleware';
import applyExpressMiddleware from '../lib/apply-express-middleware';
import _debug from 'debug';
import config from '../../config';

const paths = config.utils_paths;
const debug = _debug('report:server:webpack-dev');

export default function (compiler, publicPath) {
  debug('Enable webpack dev middleware.');

  const middleware = WebpackDevMiddleware(compiler, {
    publicPath,
    contentBase: paths.base(config.dir_client),
    hot: true,
    quiet: false, // config.compiler_quiet,
    noInfo: false, // config.compiler_quiet,
    lazy: false,
    stats: config.compiler_stats,
    progress: true,
    colors: true,
  });

  return async function koaWebpackDevMiddleware(ctx, next) {
    let hasNext = await applyExpressMiddleware(middleware, ctx.req, {
      end: (content) => (ctx.body = content),
      setHeader: function () {
        ctx.set.apply(ctx, arguments);
      },
    });

    if (hasNext) {
      await next();
    }
  };
}