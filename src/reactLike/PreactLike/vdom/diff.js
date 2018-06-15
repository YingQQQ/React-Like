/* eslint-disable  no-plusplus */
/* eslint-disable  no-param-reassign */
/* eslint-disable  no-underscore-dangle */
/* eslint-disable  no-use-before-define */
/* eslint-disable  import/no-mutable-exports */
/* eslint-disable  no-nested-ternary */
import { ATTR_KEY } from '../constants';
import { removeNode, isNamedNode } from '../dom/index';
import { unmountComponent, buildComponentFromVNode } from './component';
import options from '../options';

/**
 * 组件队列,已经被挂载的组件或者等待被挂载的组件
 */
export const mounts = [];

/**
 * 用来记录当前渲染的层数(递归的深度)，其实在代码中并没有在进入每层递归的时候都增加并且退出递归的时候减小。
 */
export let diffLevel = 0;
/**
 * 全局变量,用于判断是不是在SVG的容器内
 */
let isSvgMode = false;
/**
 * 全局变量,用于判断是否含有属性props的缓存
 */

let hydrating = false;

/**
 * 就是将队列mounts中取出组件实例，然后如果存在生命周期函数componentDidMount，则对应执行
 * 上面有两处调用函数flushMounts，一个是在renderComponent内部，一个是在diff函数。
 * 那么在什么情况下触发上下两段代码呢？
 * 首先componentRoot表示的是当前diff是不是以组件中渲染内容的形式调用
 * (比如组件中render函数返回HTML类型的VNode)，
 * 那么preact.render函数调用时肯定componentRoot是false，
 * diffLevel表示渲染的层次，diffLevel回减到0说明已经要结束diff的调用，
 * 所以在使用preact.render渲染的最后肯定会使用上面的代码去调用函数flushMounts。
 * 但是如果其中某个已经渲染的组件通过setState或者forceUpdate的方式导致了重新渲染
 * 并且致使子组件创建了新的实例(比如前后两次返回了不同的组件类型)
 * 这时，就会采用第一种方式在调用flushMounts函数
 */
export function flushMounts() {
  let c = mounts.pop();
  while (c) {
    if (options.afterMount) {
      options.afterMount(c);
    }
    if (c.componentDidMount) {
      c.componentDidMount();
    }
    c = mounts.pop();
  }
}

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
  // 如果是VNode代表的是一个嵌套组件，使用组件的diff
  let vnodeName = vnode.nodeName;
  if (typeof vnodeName === 'function') {
    return buildComponentFromVNode(dom, vnode, context, mountAll);
  }

  // 沿着树向下时记录记录存在的SVG命名空间

  isSvgMode =
    vnodeName === 'svg'
      ? true
      : (vnodeName === 'foreignObject'
        ? false
        : isSvgMode);
  // 如果不是一个已经存在的元素或者类型有问题，则重新创建一个
  vnodeName = String(vnodeName);
  if (!dom || !isNamedNode(dom, vnodeName)) {
    out = createNode(vnodeName, isSvgMode);
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
  if (!diffLevel) {
    diffLevel++;
    isSvgMode = parent != null && parent.ownerSVGElement !== undefined;
    // hydrating 指示的是被diff的现存元素是否含有属性props的缓存
    // 属性props的缓存被存在dom节点的__preactattr_属性中
    // 只有当前的dom节点并不是由Preact所创建并渲染的才会使得hydrating为true。
    hydrating = dom != null && !(ATTR_KEY in dom);
  }
  let ret = idiff(dom, vnode, context, mountAll, componentRoot);
}
