import { typeNumber } from './util/index';


// undefined: 0, null: 1, boolean:2, number: 3, string: 4, function: 5, symbol:6, array: 7, object:8
export default function render(vnode, container) {
  const vnodeType = typeNumber(vnode.type);
  let node;
  if (typeof vnode === 'string') {
    node = document.createTextNode(vnode);
  }
  if (vnodeType === 4) {
    node = document.createElement(vnode.type);
    const props = Object.keys(vnode.props || {});
    const childType = typeNumber(vnode.props.children);
    if (props.length) {
      props.forEach((prop) => {
        if (prop !== 'children') {
          node.setAttribute(prop, vnode.props[prop]);
        }
      });
    }
    if (childType === 7) {
      vnode.props.children.forEach((child) => {
        node.appendChild(render(child, null));
      });
    }
    if (childType === 4 || childType === 8) {
      node.appendChild(render(vnode.props.children, null));
    }
  } else if (vnodeType === 5) {
    const rendered = (vnode.type)();
    return render(rendered, container);
  }
  return (container || document.body).appendChild(node);
}
