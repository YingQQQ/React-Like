/* eslint-disable  no-plusplus */
/* eslint-disable  no-param-reassign */
/* eslint-disable  no-underscore-dangle */
import options from '../options';
import { ATTR_KEY, ASYNC_RENDER } from '../constants';
import { removeNode } from '../dom/index';
import { collectComponent, removeChildren } from './diff';
import { getNodeProps } from './index';

/**
 * 将表示组件的虚拟dom(VNode)转化成真实dom
 * @param {import('../dom').PreactElement} dom 真实DOM节点
 * @param {import('../vnode').VNode} vnode 组件中的虚拟DOM节点
 * @param {object} context 组件中的context属性
 * @param {import('../dom').PreactElement} 表示组件的内容需要重新渲染而不是基于上一次渲染内容进行修改。 
 */
export function buildComponentFromVNode(dom, vnode, context, mountAll) {
  // dom是组件对应的真实dom节点(如果未渲染，则为undefined)，
  // 在dom节点中的_component属性是组件实例的缓存
  let c = dom && dom._component;
  const originalComponent = c;
  // 缓存dom
  const oldDom = dom;
  // 用来指示用来标识原dom节点对应的组件类型是否与当前虚拟dom的组件类型相同
  const isDirectOwner = c && dom._componentConstructor === vnode.nodeName;
  const props = getNodeProps(vnode);
  let isOwner = isDirectOwner;

  // 如果当前的dom节点对应的组件类型与当前虚拟dom对应的组件类型不一致时，
  // 会向上在父组件中查找到与虚拟dom节点类型相同的组件实例(但也有可能不存在)。
  // 其实这个只是针对于高阶组件，假设有高阶组件的顺序: HOC  => component => DOM元素
  while (c && !isOwner && c._parentComponent) {
    c = c._parentComponent;
    isOwner = c.constructor === vnode.nodeName;
  }
  // 如果存在当前虚拟dom对应的组件实例存在，
  // 则直接调用函数setComponentProps，相当于基于组件的实例进行修改渲染,
  // 然后组件实例中的base属性即为最新的dom节点
  if (c && isOwner && (!mountAll || c.component)) {
    setComponentProps(c, props, ASYNC_RENDER, context, mountAll);
    dom = c.base;
  }
}


/**
 * 从DOM和生命周期中卸载组件
 * @param {import('../component').Component} component 一个组件实例
 * @private
 */
export default function unmountComponent(component) {
  // 如果有beforeUnmount,则先运行此方法
  if (options.beforeUnmount) {
    options.beforeUnmount(component);
  }
  const base = component.base;
  component._disable = true;

  if (component.componentWillUnmount) {
    component.componentWillUnmount();
  }
  component.base = null;
  // 如果组件中还有组件则尾调
  const inner = component._component;
  if (inner) {
    unmountComponent(inner);
  } else if (base) {
    if (base[ATTR_KEY] && base[ATTR_KEY].ref) {
      base[ATTR_KEY].ref(null);
    }
    component.nextBase = base;
    removeNode(base);
    collectComponent(component);
    removeChildren(base);
  }
  if (component.__ref) {
    component.__ref(null);
  }
}
