/* eslint-disable  no-plusplus */
/* eslint-disable  no-param-reassign */
/* eslint-disable  no-underscore-dangle */
import options from '../options';
import { ATTR_KEY } from '../constants';
import { removeNode } from '../dom/index';
import { collectComponent, removeChildren } from './diff';

/**
 * 将表示组件的虚拟dom(VNode)转化成真实dom
 * @param {import('../dom').PreactElement} dom 真实DOM节点
 * @param {import('../vnode').VNode} vnode 组件中的虚拟DOM节点
 * @param {object} context 组件中的context属性
 * @param {import('../dom').PreactElement} 表示组件的内容需要重新渲染而不是基于上一次渲染内容进行修改。 
 */
export function buildComponentFromVNode(dom, vnode, context, mountAll) {
  
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
