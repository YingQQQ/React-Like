import App from './containers/app';
import React from './reactLike/PreactLike/React';
// import React from 'react';
// import { render } from 'react-dom';
import render from './reactLike/PreactLike/render';

const rootEl = window.document.getElementById('app');

const vdom = (
  <div id="foo">
    <App />
    <p>
      Look, a simple JSX DOM renderer!
      <ul>
        <li id="123">1</li>
        <li>2</li>
        <li>
          <a>3</a>
        </li>
      </ul>
    </p>
  </div>
);


console.log(vdom);

render(vdom, rootEl);
