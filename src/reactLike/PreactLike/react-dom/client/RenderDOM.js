/* eslint-disable  no-plusplus */
/* eslint-disable  no-param-reassign */
/* eslint-disable  no-underscore-dangle */
import { ROOT_ATTRIBUTE_NAME } from '../shared/DOMProperty';
const ELEMENT_NODE = 1;
// const TEXT_NODE = 3;
// const COMMENT_NODE = 8;
const DOCUMENT_NODE = 9;
// const DOCUMENT_FRAGMENT_NODE = 11;

/**
 * 如果DOM存在,则根据nodeType返回文档对象或第一个元素节点
 * @param {DOM} container 真实的DOM
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
 * @param {boolean} forceHydrate
 */
function legacyCreateRootFromDOMContainer(container, forceHydrate) {
  const shouldHydrate =
    forceHydrate || shouldHydrateDueToLegacyHeuristic(container);
}
/**
 *
 * @param {Component} parentComponent 组件实例
 * @param {Object} children 虚拟DOM元素
 * @param {DOM} container 真实的DOM
 * @param {boolean} forceHydrate
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
      forceHydrate
    );
    root = container._reactRootContainer;
  }
}

export default function renderDOM(element, container, callback) {
  return legacyRenderSubtreeIntoContainer(
    null,
    element,
    container,
    false,
    callback
  );
}
