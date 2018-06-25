const ELEMENT_NODE = 1;
// const TEXT_NODE = 3;
// const COMMENT_NODE = 8;
const DOCUMENT_NODE = 9;
const DOCUMENT_FRAGMENT_NODE = 11;

export default function renderA(vnode, container) {
  let n;
  if (typeof vnode === 'string') {
    return document.createTextNode(vnode);
  }
  if (typeof vnode !== 'function') {
    n = document.createElement(vnode.nodeName);
    const attributes = Object.keys(vnode.attributes || {});
    if (attributes.length) {
      attributes.forEach(k => n.setAttribute(k, vnode.attributes[k]));
    }
    (vnode.children || []).forEach(c => n.appendChild(render(c, null)));

    if (container) {
      container.appendChild(n);
    } else {
      document.body.appendChild(n);
    }
  }
  return n;
}

function isValidContainer(node) {
  const nodeType = node.nodeType;
  return !!(
    nodeType === ELEMENT_NODE ||
    nodeType === DOCUMENT_NODE ||
    nodeType === DOCUMENT_FRAGMENT_NODE
  );
}

function legacyRenderSubtreeIntoContainer(parentComponent, children, container, forceHydrate, callback) {
  if (!isValidContainer(container)) {
    console.warn('Target container is not a DOM element.');
  }
}

export function render(vnode, container, callback) {
  return legacyRenderSubtreeIntoContainer(null, vnode, container, false, callback);
}
