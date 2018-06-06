import historyFallback from 'koa2-history-api-fallback';
import Koa from 'koa';
import logger from 'koa-logger';
import middleware from 'koa-webpack';
import webpack from 'webpack';

import { hotPort } from './path-help';

import config from '../webpack.config';

const app = new Koa();
const compiler = webpack(config);

const dev = {
  noInfo: false,
  quiet: true,
  publicPath: config.output.publicPath,
  headers: {
    'Access-Control-Allow-Origin': '*'
  },
  stats: {
    colors: true
  }
};
app.use(historyFallback());
app.use(logger());
app.use(
  middleware({
    compiler,
    dev
  })
);

app.listen(hotPort, () => {
  console.info(
    `==> 🌎 Listening on port ${hotPort}. Open up http://localhost:${hotPort}/ in your browser.`
  );
});
