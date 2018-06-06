import {
  createStore,
  applyMiddleware,
  compose
} from 'redux';

import thunk from 'redux-thunk';

import rootReducer from '../reducers';


const createStoreWithMiddleware = compose(
  applyMiddleware(
    thunk
  )
)(createStore);


export default function configureStore(initialState) {
  const store = createStoreWithMiddleware(rootReducer, initialState,
    typeof window === 'object' && typeof window.devToolsExtension !== 'undefined' ? window.devToolsExtension() : f => f);
  if (module.hot) {
    module.hot.accept('../reducers', () => {
      store.replaceReducer(require('../reducers'));// eslint-disable-line global-require
    });
  }
  return store;
}
