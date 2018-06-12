/* eslint-disable  no-plusplus */
/* eslint-disable  no-param-reassign */
/* eslint-disable  no-underscore-dangle */
/* eslint-disable  no-use-before-define */
import { ATTR_KEY } from '../constants';
import { removeNode } from '../dom/index';
import { unmountComponent, buildComponentFromVNode } from './component';

/**
 * 用来记录当前渲染的层数(递归的深度)，其实在代码中并没有在进入每层递归的时候都增加并且退出递归的时候减小。
 */
let difflevel = 0;
/**
 * 全局变量,用于判断是不是在SVG的容器内
 */
let isSvgMode = false;
/**
 * 全局变量,用于判断是否含有属性props的缓存
 */

let hydrating = false;

/**
 * 回收/卸载所有的子元素
 * 我们在这里使用了.lastChild而不是使用.firstChild，是因为访问节点的代价更低。
 */
export function removeChildren(node) {
  node = node.lastChild;
  while (node) {
    const next = node.previousSibling;
    recollectNodeTree(node, true);
    node = next;
  }
}

/**
 * 递归地回收(或者卸载)节点及其后代节点
 * @param node
 * @param unmountOnly 如果为`true`,仅仅触发卸载的生命周期，跳过删除
 */
export function recollectNodeTree(node, unmountOnly) {
  const component = node._component;
  if (component) {
    // 如果该节点属于某个组件，卸载该组件(最终在这里递归)
    // 主要包括组件的回收和相依卸载生命周期的调用
    unmountComponent(component);
  } else {
    // 如果节点含有ref函数，则执行ref函数，参数为null(这里是React的规范，用于取消设置引用)
    // 确实在React如果设置了ref的话，在卸载的时候，也会被回调，得到的参数是null
    if (node[ATTR_KEY] != null && node[ATTR_KEY].ref) {
      node[ATTR_KEY].ref(null);
    }
    if (unmountOnly === false || node[ATTR_KEY] == null) {
      // 要做的无非是从父节点将该子节点删除
      removeNode(node);
    }
    // 递归卸载组件
    removeChildren(node);
  }
}

function idiff(dom, vnode, context, mountAll, componentRoot) {
  let out;
  // 空的node 渲染空的文本节点
  if (vnode == null || typeof vnode === 'boolean') {
    vnode = '';
  }
  // String & Number 类型的节点 创建/更新 文本节点
  if (typeof vnode === 'string' || typeof vnode === 'number') {
    // 更新已经存在的文本节点
    // 如果节点值是文本类型，其父节点又是文本类型的节点，则直接更新
    if (
      dom &&
      dom.parentNode &&
      dom.splitText !== undefined &&
      (!dom._component || componentRoot) &&
      dom.nodeValue !== vnode
    ) {
      dom.nodeValue = vnode;
    } else {
      // 如果不是文本节点则直接替换掉原来的元素
      // 1. 创建一个新的文本节点
      out = document.createTextNode(vnode);
      if (dom) {
        // 2.1 如果dom存在父元素,则用新的文本替换掉原来的内容
        if (dom.parentNode) {
          dom.parentNode.replaceChild(out, dom);
        }
        // 递归卸载组件
        recollectNodeTree(dom, true);
      }
    }
    // 标记是Preact创建的元素
    out[ATTR_KEY] = true;

    return out;
  }
  // 如果是VNode代表的是一个组件，使用组件的diff
  let nodeName = vnode.nodeName;
  if (typeof nodeName === 'function') {
    return buildComponentFromVNode(dom, vnode, context, mountAll);
  }
}
/**
 *
 * @param {*} dom 需要合并比较的真实dom
 * @param {*} vnode 虚拟dom节点
 * @param {boolean} context
 * @param {*} mountAll
 * @param {dom} parent 就是要将虚拟dom挂载的父节点
 * @param {*} componentRoot
 */
export default function diff(
  dom,
  vnode,
  context,
  mountAll,
  parent,
  componentRoot
) {
  if (!difflevel) {
    difflevel++;
    isSvgMode = parent != null && parent.ownerSVGElement !== undefined;
    // hydrating 指示的是被diff的现存元素是否含有属性props的缓存
    // 属性props的缓存被存在dom节点的__preactattr_属性中
    // 只有当前的dom节点并不是由Preact所创建并渲染的才会使得hydrating为true。
    hydrating = dom != null && !(ATTR_KEY in dom);
  }
  let ret = idiff(dom, vnode, context, mountAll, componentRoot);
}
