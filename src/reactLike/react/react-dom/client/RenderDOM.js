/* eslint-disable  no-plusplus */
/* eslint-disable  no-param-reassign */
/* eslint-disable  no-underscore-dangle */
import { ROOT_ATTRIBUTE_NAME } from '../shared/DOMProperty';
import * as DOMRenderer from '../../react-reconciler/inline.dom';

const ELEMENT_NODE = 1;
// const TEXT_NODE = 3;
// const COMMENT_NODE = 8;
const DOCUMENT_NODE = 9;
// const DOCUMENT_FRAGMENT_NODE = 11;

/**
 * 独新建个对象存放各种信息
 * @param {Element | Document} container  真实的DOM
 * @param {boolean} isAsync 是否进行异步渲染 
 * @param {boolean} hydrate 是否缓存属性 
 */
// TODO: 给原型加上方法render, unmount...等等
function ReactRoot(container, isAsync, hydrate) {
  const root = DOMRenderer.createContainer(container, isAsync, hydrate);
  this._internalRoot = root;
}
ReactRoot.prototype.render = function reactRootrender(children, callback) {
  const root = this._internalRoot;
  const work = new ReactWork();
  callback = callback === undefined ? null : callback;
  if (callback != null) {
    work.then(callback);
  }
  DOMRenderer.updateContainer(children, root, null, work._onCommit);
};

/**
 * 获取传入DOM的根元素
 * @param {DOM} container 真实的DOM
 * @returns {DOM} firstChild
 */
function getReactRootElementInContainer(container) {
  if (!container) {
    return null;
  }
  if (container.nodeType === DOCUMENT_NODE) {
    return container.documentElement;
  }

  return container.firstChild;
}

/**
 * 判断DOM节点上是否有data-reactroot缓存对象
 * @param {DOM} container 真实的DOM
 */
function shouldHydrateDueToLegacyHeuristic(container) {
  const rootElement = getReactRootElementInContainer(container);
  return !!(
    rootElement &&
    rootElement.nodeType === ELEMENT_NODE &&
    rootElement.hasAttribute(ROOT_ATTRIBUTE_NAME)
  );
}

/**
 * 如果没有container则自动创建一个
 * @param {DOM} container 真实的DOM
 * @param {boolean} 是否强制缓存属性props, render的时候默认传入false
 */
function legacyCreateRootFromDOMContainer(container, forceHydrate) {
  const shouldHydrate =
    forceHydrate || shouldHydrateDueToLegacyHeuristic(container);
  if (!shouldHydrate) {
    let rootSibling = container.lastChild;
    while (rootSibling) {
      container.removeChild(rootSibling);
      rootSibling = container.lastChild;
    }
  }

  // 不是异步渲染
  const isAsync = false;
  return new ReactRoot(container, isAsync, shouldHydrate);
}
/**
 *
 * @param {Component} parentComponent 组件实例, render函数中是默认null
 * @param {Object} children 虚拟DOM元素
 * @param {DOM} container 真实的DOM
 * @param {boolean} forceHydrate 是否强制缓存属性props
 * @param {func} callback
 */
function legacyRenderSubtreeIntoContainer(
  parentComponent,
  children,
  container,
  forceHydrate,
  callback
) {
  let root = container._reactRootContainer;
  if (!root) {
    container._reactRootContainer = legacyCreateRootFromDOMContainer(
      container,
      forceHydrate // 默认传入false
    );
    root = container._reactRootContainer;
    console.log(root);
    if (typeof callback === 'function') {
      const orginalCallback = callback;
      callback = function newCallback() {
        // 获取根节点的实例虚拟DOM树
        const instance = DOMRenderer.getPublicRootInstance(root._internalRoot);
        orginalCallback.call(instance);
      };
    }
    // 初始化加载的时候不能被调度
    DOMRenderer.unbatchedUpdates(() => {
      if (parentComponent != null) {
        root.legacy_renderSubtreeIntoContainer(
          parentComponent,
          children,
          callback,
        );
      } else {
        root.render(children, callback);
      }
    });
  } else {
    if (typeof callback === 'function') {
      const orginalCallback = callback;
      callback = function newCallback() {
        // 获取根节点的实例虚拟DOM树
        const instance = DOMRenderer.getPublicRootInstance(root._internalRoot);
        orginalCallback.call(instance);
      };
    }
    // 如果有root说明是组件的更新
    if (parentComponent != null) {
      root.legacy_renderSubtreeIntoContainer(
        parentComponent,
        children,
        callback,
      );
    } else {
      root.render(children, callback);
    }
  }
  return DOMRenderer.getPublicRootInstance(root._internalRoot);
}

export function render(element, container, callback) {
  return legacyRenderSubtreeIntoContainer(
    null,
    element,
    container,
    false,
    callback
  );
}

const ReactDOM = {
  render
};

export default ReactDOM;
