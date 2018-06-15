import { extend, hasOwnProperty } from '../util';

/**
 * 检查元素是否被指定NodeName, 不区分大小写
 * @param {import('../dom').PreactElement} node DOM元素
 * @param {*} nodeName 要比较的名称
 */
export function isNamedNode(node, nodeName) {
  return (
    node.normalizedNodeName === nodeName ||
    node.nodeName.toLowerCase() === nodeName.toLowerCase()
  );
}

/**
 * 将vnode的attributes和chidlren的属性赋值到props,
 * 然后如果存在组件中存在defaultProps的话，
 * 将defaultProps存在的属性并且对应props不存在的属性赋值进入了props中，
 * 并将props返回。
 * @param {import('../vnode').VNode} vnode 虚拟DOM组件
 * @returns {object} 挂载的props
 */
export function getNodeProps(vnode) {
  const props = extend({}, vnode.props);
  props.children = vnode.children;
  const defaultProps = vnode.nodeName.defaultProps;
  const defaultKeys = Object.keys(defaultProps);
  defaultKeys.forEach((defaultkey) => {
    if (hasOwnProperty.call(defaultProps, defaultkey)) {
      props[defaultkey] = defaultProps[defaultkey];
    }
  });
  return vnode;
}
