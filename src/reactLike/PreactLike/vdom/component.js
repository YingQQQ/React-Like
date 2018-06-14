/* eslint-disable  no-plusplus */
/* eslint-disable  no-param-reassign */
/* eslint-disable  no-underscore-dangle */
/* eslint-disable  no-use-before-define */
import options from '../options';

import {
  ATTR_KEY,
  ASYNC_RENDER,
  SYNC_RENDER,
  NO_RENDER,
  FORCE_RENDER
} from '../constants';
import { removeNode } from '../dom/index';
import { collectComponent, removeChildren } from './diff';
import { getNodeProps } from './index';
import { extend } from '../util';
import { createComponent } from './component-recycler';


export function renderComponent(component, renderMode, mountAll, isChild) {
  if (component._disable) {
    return;
  }

  const props = component.props;
  const state = component.state;
  const previousProps = component.prevProps || props;
  let context = component.context;
  const previousContext = component.prevContext || context;
  const isUpdate = component.base;
  const nextBase = component.nextBase;
  const initialBase = isUpdate || nextBase;
  // 组件实例中的_component属性表示的组件的子组件，
  // 仅仅只有当组件返回的是组件时(也就是当前组件为高阶组件)，才会存在。
  const initialChildComponent = component._component;
  // 变量skip用来标志是否需要跳过更新的过程(例如: 生命周期函数shouldComponentUpdate返回false)
  let snapshot = previousContext;
  let previousState = component.prevState || state;
  let skip = false;
  let rendered;
  let inst;
  let cbase;
  let base;
  let toUnmount;

  if (component.constructor.getDerivedStateFromProps) {
    previousState = extend({}, previousState);
    component.state = extend(
      state,
      component.constructor.getDerivedStateFromProps(props, state)
    );
  }
  // 如果存在component.base存在，说明该组件之前对应的真实dom元素，说明组件处于更新的过程
  if (isUpdate) {
    // 要将props、state、context替换成之前的previousProps、previousState、previousContext，
    // 这是因为在生命周期函数shouldComponentUpdate、componentWillUpdate中的this.props、
    // this.state、this.context仍然是更新前的状态。
    component.props = previousProps;
    component.state = previousState;
    component.context = previousContext;
    // 如果不是强制刷新(FORCE_RENDER)并存在生命周期函数shouldComponentUpdate，
    // 则以最新的props、state、context作为参数执行shouldComponentUpdate，
    // 如果返回的结果为false表明要跳过此次的刷新过程，即置标志位skip为true。
    if (
      renderMode !== FORCE_RENDER &&
      component.shouldComponentUpdate &&
      component.shouldComponentUpdate(props, state, context) === false
    ) {
      skip = true;
      // 则如果生命周期shouldComponentUpdate返回的不是false(说明如果不返回值或者其他非false的值，都会执行更新),
      // 则查看生命周期函数componentWillUpdate是否存在，存在则执行。
    } else if (component.componentWillUpdate) {
      component.componentWillUpdate(props, state, context);
    }
    component.props = props;
    component.state = state;
    component.context = context;
  }
  // 需要注意的是只有_dirty为false才会被放入更新队列，
  // 然后_dirty会被置为true，这样组件实例就不会被多次放入更新队列

  component.previousContext = null;
  component.previousProps = null;
  component.previousState = null;
  component._dirty = false;
  // 如果没有跳过更新的过程(即skip为false)，则进入代码。
  // 首先执行组件实例的render函数(相比于React中的render函数，
  // Preact中的render函数执行时传入了参数props、state、context)，
  // 执行render函数的返回值rendered则是组件实例对应的虚拟dom元素(VNode)。
  // 如果组件存在函数getChildContext，则生成当前需要传递给子组件的context。
  // 并且覆盖父组件中的context
  if (!skip) {
    // 组件实例render函数返回的虚拟dom的类型
    rendered = component.render(props, state, context);
    if (component.getChildContext) {
      context = extend(extend({}, context), component.getChildContext());
    }

    if (isUpdate && component.getSnapshotBeforeUpdate) {
      snapshot = component.getSnapshotBeforeUpdate(
        previousProps,
        previousState
      );
    }

    // childComponent是组件实例render函数返回的虚拟dom的类型
    const childComponent = rendered && rendered.nodeName;
    // 如果childComponent的类型为函数，说明该组件为高阶组件
    if (typeof childComponent === 'function') {
      const childProps = getNodeProps(rendered);
      inst = initialChildComponent;
      // 如果组件存在子组件的实例并且子组件实例的构造函数与当前组件返回的子组件虚拟dom类型相同(inst.constructor===childComponent)
      // 而且前后的key值相同时(childProps.key==inst.__key)，仅需要以同步渲染(SYNC_RENDER)
      // 的模式递归调用函数setComponentProps来更新子组件的属性props。之所以这样是因为如果满足前面的条件说明，
      // 前后两次渲染的子组件对应的实例不发生改变，仅改变传入子组件的参数(props)。
      // 这时子组件仅需要根据当前最新的props对应渲染真实dom即可。
      if (
        inst &&
        inst.constructor === childComponent &&
        childProps.key === inst.__key
      ) {
        setComponentProps(inst, childProps, SYNC_RENDER, context, false);
        // 否则如果之前的子组件实例的构造函数与当前组件返回的子组件虚拟dom类型不相同时
        // 或者根据key值标定两个组件实例不相同时，则需要渲染的新的子组件
      } else {
        toUnmount = inst;
        component._component = createComponent(
          childComponent,
          childProps,
          context
        );
        inst = createComponent(childComponent, childProps, context);
        inst.nextBase = inst.nextBase || nextBase;
        inst._parentComponent = component;
        // 需要注意的是这里的调用模式是NO_RENDER，不会进行渲染。
        // 而在下一句调用renderComponent(inst, SYNC_RENDER, mountAll, true)去同步地渲染子组件。
        // 所以我们就要注意为什么在调用函数setComponentProps时没有采用SYNC_RENDER模式，
        // SYNC_RENDER模式也本身就会触发renderComponent去渲染组件，
        // 其原因就是为了在调用renerComponent赋予isChild值为true，这个标志量的作用我们后面可以看到。
        // 调用完renderComponent之后，inst.base中已经是我们子组件渲染的真实dom节点
        setComponentProps(inst, childProps, NO_RENDER, context, false);
        renderComponent(inst, SYNC_RENDER, mountAll, true);
      }
      base = inst.base;
    }
  }
}

/**
 * 为组件实例设置属性(props)，其中props通常来源于JSX中的属性(attributes)
 * @param {import('../component').Component} component 需要挂载属性的组件
 * @param {object} props props属性
 * @param {number} renderMode 渲染模式:异步/同步等等
 * @param {object} context 组件中的context属性
 * @param {boolean} mountAll 是否立即挂载所有组件
 */
export function setComponentProps(
  component,
  props,
  renderMode,
  context,
  mountAll
) {
  // 首先如果组件component中_disable属性为true时则直接退出，
  // 否则将属性_disable置为true，其目的相当于一个锁，保证修改过程的原子性。
  if (component._disable) {
    return;
  }
  component._disable = true;

  // 如果传入组件的属性props中存在ref与key，则将其分别缓存在组件的__ref与__key，并将其从props将其删除
  if (props.key) {
    component.__key = props.key;
    delete props.key;
  }
  if (props.ref) {
    component.__ref = props.ref;
    delete props.ref;
  }
  if (typeof component.constructor.getDerivedStateFromProps === 'undefined') {
    // 组件实例中的base中存放的是之前组件实例对应的真实dom节点，
    // 如果不存在该属性，说明是该组件的初次渲染，如果组件中定义了生命周期函数(钩子函数)componentWillMount,
    // 则在此处执行。
    if ((!component.base || mountAll) && component.componentWillMount) {
      component.componentWillMount();
      // 如果不是首次执行，如果存在生命周期函数componentWillReceiveProps，
      // 则需要将最新的props与context作为参数调用componentWillReceiveProps。
    } else if (component.componentWillReceiveProps) {
      component.componentWillReceiveProps(props, context);
    }
  }
  // 分别将当前的属性context与props缓存在组件的preContext与prevProps属性中，
  // 并将context与props属性更新为最新的context与props。
  if (context && context !== component.context) {
    if (!component.prevContext) {
      component.prevContext = component.context;
    }
    component.context = context;
  }

  component._disable = false;
  // 如果组件更新的模式为NO_RENDER，则不需要进行渲染。
  if (renderMode !== NO_RENDER) {
    // 如果是同步渲染(SYNC_RENDER)或者是首次渲染(base属性为空)，则执行函数renderComponent
    if (
      renderMode === SYNC_RENDER ||
      !component.base ||
      !options.syncComponentUpdates !== false
    ) {
      renderComponent(component, SYNC_RENDER, mountAll);
      // 其余情况下(例如setState触发的异步渲染ASYNC_RENDER)均执行函数enqueueRender(enqueueRender函数将在setState处分析)。
    } else {
      enqueueRender(component);
    }
  }

  // 如果存在ref函数，则将组件实例作为参数调用ref函数。
  if (component.__ref) {
    component.__ref(component);
  }
}

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
  // 用来标识原dom节点对应的组件类型是否与当前虚拟dom的组件类型相同
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
