import { ConnectedRouter } from 'react-router-redux';
import { Provider } from 'react-redux';
import { render } from 'react-dom';
import createHistory from 'history/createBrowserHistory';
import injectTapEventPlugin from 'react-tap-event-plugin';
import React from 'react';

import configureStore from './store/configuerStore';
import Routes from './routes';

injectTapEventPlugin();
const rootEl = window.document.getElementById('app');
const store = configureStore();
const history = createHistory();

render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <Routes />
    </ConnectedRouter>
  </Provider>,
  rootEl
);
