// import App from './containers/app';
import React from './reactLike/PreactLike/React';
// import render from './reactLike/PreactLike/render.ts';

// const rootEl = window.document.getElementById('app');

const vdom = (
  <div id="foo">
    <p>
      Look, a simple JSX DOM renderer!
      <ul>
        <li>1</li>
        <li>2</li>
        <li>
          <a>3</a>
        </li>
      </ul>
    </p>
  </div>
);

const domV2 = <div id="foo">Hello!</div>;
console.log(domV2);
console.log(vdom);

// render(vdom, rootEl);

