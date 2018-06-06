import { hot } from 'react-hot-loader';
import { Link } from 'react-router-dom';
import React from 'react';

import '../app.scss';

const App = () => (
  <div>
    <p>Hello world</p>
    <ul>
      <li>
        <Link to="/home">Link Home!</Link>
      </li>
      <li>
        <Link to="/page1">Link Page</Link>
      </li>
      <li>
        <Link to="/page3">Link NoMatch</Link>
      </li>
    </ul>
  </div>
);

export default hot(module)(App);
