import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import Loadable from 'react-loadable';
import PropTypes from 'prop-types';


const MyLoadingComponent = ({ isLoading, error }) => {
  // Handle the loading state
  if (isLoading) {
    return <div>Loading...</div>;// Handle the error state <div>Loading...</div>;
  } else if (error) {
    return <div>Sorry, there was a problem loading the page.</div>;
  }
  return null;
};

MyLoadingComponent.propTypes = {
  isLoading: PropTypes.bool,
  error: PropTypes.string
};

const AsyncApp = Loadable({ // eslint-disable-line new-cap
  loader: () => import('./containers/App'),
  loading: MyLoadingComponent,
  delay: 300
});
const AsyncHome = Loadable({ // eslint-disable-line new-cap
  loader: () => import('./containers/Home'),
  loading: MyLoadingComponent
});
const AsyncPage1 = Loadable({ // eslint-disable-line new-cap
  loader: () => import('./containers/Page1'),
  loading: MyLoadingComponent
});
const AsyncNoMatch = Loadable({ // eslint-disable-line new-cap
  loader: () => import('./containers/NoMatch'),
  loading: MyLoadingComponent
});


export default () => (
  <Router>
    <Switch>
      <Route exact path="/" component={AsyncApp} />
      <Route path="/home" component={AsyncHome} />
      <Route path="/page1" component={AsyncPage1} />
      <Route component={AsyncNoMatch} />
    </Switch>
  </Router>
);
