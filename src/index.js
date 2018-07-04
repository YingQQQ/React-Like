import React from 'react';
import { render } from 'react-dom';

// import App from './containers/app';
// import render from './reactLike/react/render';
// import React from './reactLike/react/React';
// import { render } from './reactLike/react/react-dom/src/client/RenderDOM';

const rootEl = window.document.getElementById('app');

const vdom = (
  <div id="foo">
    {/* <App /> */}
    <p>
      Look, a simple JSX DOM renderer!!
    </p>
    <ul>
      <li id="123" key="a" >1</li>
      <li key="b">2</li>
      <li key="c">
        <a>3</a>
      </li>
    </ul>
  </div>
);


console.log(vdom);

render(vdom, rootEl);
