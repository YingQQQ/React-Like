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
import {
  collectComponent,
  removeChildren,
  diff,
  recollectNodeTree,
  mounts,
  diffLevel,
  flushMounts
} from './diff';
import { getNodeProps } from './index';
import { extend } from '../util';
import { createComponent } from './component-recycler';
import { enqueueRender } from '../render-queue';

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
      // 处理的是当前组件需要渲染的虚拟dom类型是非组件类型(即普通的DOM元素)
    } else {
      // initialBase来自于initialBase = isUpdate || nextBase，
      // 也就是说如果当前是更新的模式，则initialBase等于isUpdate，即为上次组件渲染的内容。
      cbase = initialBase;
      // 如果之前的组件渲染的是函数类型的元素(即组件)，但现在却渲染的是非函数类型的，
      // 赋值toUnmount = initialChildComponent，用来存储之后需要卸载的组件，
      // 并且由于cbase对应的是之前的组件的dom节点，因此就无法使用了，
      // 需要赋值cbase = null以使得重新渲染。而component._component = null
      // 目的就是切断之前组件间的父子关系，毕竟现在返回的都不是组件。
      toUnmount = initialChildComponent;
      if (toUnmount) {
        component._component = null;
        cbase = null;
      }
      // 如果是同步渲染(SYNC_RENDER),则会通过调用idiff函数去渲染组件返回的虚拟dom
      if (initialBase || renderMode === SYNC_RENDER) {
        if (cbase) {
          cbase._component = null;
        }
        // 1. cbase对应的是diff的dom参数，表示用来渲染的VNode之前的真实dom。
        // 可以看到如果之前是组件类型，那么cbase值为undefined，我们就需要重新开始渲染。
        // 否则我们就可以在之前的渲染基础上更新以寻求最小的更新代价。
        // 2. rendered对应diff中的vnode参数，表示需要渲染的虚拟dom节点。
        // 3. context对应diff中的context参数，表示组件的context属性。
        // 4. mountAll || !isUpdate对应的是diff中的mountAll参数，
        // 表示是否是重新渲染DOM节点而不是基于之前的DOM修改，!isUpdate表示的就是非更新状态。
        // 5. initialBase && initialBase.parentNode对应的是diff中的parent参数，表示的是当前渲染节点的父级节点。
        // 6. diff函数的第六个参数为componentRoot,
        // 实参为true表示的是当前diff是以组件中render函数的渲染内容的形式调用，也可以说当前的渲染内容是属于组件类型的
        // 变量base存储的就是本次组件渲染的真实DOM元素。
        base = diff(
          cbase,
          rendered,
          context,
          mountAll || !isUpdate,
          initialBase && initialBase.parentNode,
          true
        );
      }
    }
    // 如果组件前后返回的虚拟dom节点对应的真实DOM节点不相同，
    // 或者前后返回的虚拟DOM节点对应的前后组件实例不一致时，
    // 则在父级的DOM元素中将之前的DOM节点替换成当前对应渲染的DOM节点(baseParent.replaceChild(base, initialBase))，
    // 如果没有需要卸载的组件实例，则调用函数recollectNodeTree回收该DOM节点。
    if (initialBase && base !== initialBase && inst !== initialChildComponent) {
      const baseParent = initialBase.parentNode;
      if (base && base !== baseParent) {
        baseParent.replaceChild(base, initialBase);
        if (!toUnmount) {
          initialBase._component = null;
          recollectNodeTree(initialBase, false);
        }
      }
    }
    // 否则如果之前组件渲染的是函数类型的元素，但需要废弃，
    // 则调用函数unmountComponent进行卸载(调用相关的生命周期函数)。
    if (toUnmount) {
      unmountComponent(toUnmount);
    }
    // 将当前的组件渲染的dom元素存储在组件实例的base属性中
    component.base = base;
    // 假如有如下的结构: HOC1 => HOC2 => component => DOM元素
    // 其中HOC代表高阶组件，component代表自定义组件。
    // 你会发现HOC1、HOC2与compoent的base属性都指向最后的DOM元素，
    // 而DOM元素的中的_component是指向HOC1的组价实例的。
    // 其目的就是为了给父组件赋值正确的base属性以及为DOM节点的_component属性赋值正确的组件实例
    if (base && !isChild) {
      let componentRef = component;
      let t = component;
      while (t) {
        t = t._parentComponent;
        componentRef = t;
        componentRef.base = base;
      }
      base._component = componentRef;
      base._componentConstructor = componentRef.constructor;
    }
  }
  // 如果是非更新模式，则需要将当前组件存入mounts(unshift方法存入，pop方法取出，
  // 实质上是相当于队列的方式，并且子组件先于父组件存储队列mounts，因此可以保证正确的调用顺序)，
  // 方便在后期调用组件对应类似于componentDidMount生命周期函数和其他的操作。

  if (!isUpdate || mountAll) {
    mounts.unshift(component);
    // 如果没有跳过更新过程(skip === false)，则在此时调用组件对应的生命周期函数componentDidUpdate。
  } else if (!skip) {
    if (component.componentDidUpdate) {
      component.componentDidUpdate(previousProps, previousState, snapshot);
    }
    if (options.afterUpdate) {
      options.afterUpdate(component);
    }
  }
  // 然后如果存在组件存在_renderCallbacks属性(存储对应的setState的回调函数，因为setState函数实质也是通过renderComponent实现的)，
  // 则在此处将其弹出并执行。
  while (component._renderCallbacks.length) {
    component._renderCallbacks.pop().call(component);
  }
  if (!diffLevel && !isChild) {
    flushMounts();
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
  let oldDom = dom;
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
  } else {
    // 如果之前的dom节点对应存在组件，并且虚拟dom对应的组件类型与其不相同时，
    // 则卸载之前的组件(unmountComponent)。
    // 接着我们通过调用函数createComponent创建当前虚拟dom对应的组件实例，
    // 然后调用函数setComponentProps去创建组件实例的dom节点,
    // 最后如果当前的dom与之前的dom元素不相同时，
    // 将之前的dom回收(recollectNodeTree函数)。
    if (originalComponent && !isDirectOwner) {
      unmountComponent(originalComponent);
    }
    c = createComponent(vnode.nodeName, props, context);
    if (dom && !c.nextBase) {
      c.nextBase = dom;
      oldDom = null;
    }
    setComponentProps(c, props, SYNC_RENDER, context, mountAll);

    dom = c.base;
    if (oldDom && dom !== oldDom) {
      oldDom._component = null;
      recollectNodeTree(oldDom, false);
    }
  }
  return dom;
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
