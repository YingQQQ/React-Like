/* eslint-disable  no-param-reassign */
import { createFiberRoot } from './ReactFiberRoot';
import { getPublicInstance } from './ReactFiberHostConfig';
import { HostComponent } from '../../shared/ReactTypeOfWork';

import {
  unbatchedUpdates,
  recalculateCurrentTime,
  computeExpirationForFiber
} from './ReactFiberScheduler';
import emptyObject from '../../lib/emptyObject';
import * as ReactInstanceMap from '../../shared/ReactInstanceMap';

/**
 * 进入fiber算法
 * @param {Element | Document} containerInfo  真实的DOM
 * @param {boolean} isAsync 是否进行异步渲染
 * @param {boolean} hydrate 是否缓存属性
 */
export function createContainer(containerInfo, isAsync, hydrate) {
  return createFiberRoot(containerInfo, isAsync, hydrate);
}

export function getPublicRootInstance(container) {
  const containerFiber = container.current;
  if (!containerFiber.child) {
    return null;
  }
  switch (containerFiber.child.tag) {
    case HostComponent:
      return getPublicInstance(containerFiber.child.stateNode);
    default:
      return containerFiber.child.stateNode;
  }
}

function getContextForSubtree(parentComponent) {
  if (!parentComponent) {
    return emptyObject;
  }

  // 从Map集合中获取parentComponent对象存储的副本
  const fiber = ReactInstanceMap.get(parentComponent);
  // 查询没有被标记的context
  const parentContext = findCurrentUnmaskedContext(fiber);
  // 验证是否是有效的context
  return isContextProvider(fiber) ? processChildContext(fiber, parentContext) : parentContext;
}

/**
 *
 * @param {ReactNodeList} element 嵌套的子元素
 * @param {Fiber} container 被序列化之后的根源素
 * @param {ReactComponent} parentComponent 组件的实例
 * @param {number} expirationTime 渲染级别
 * @param {func} callback 回调函数的队列, ReactWork的实例
 */
function updateContainerAtExpirationTime(
  element,
  container,
  parentComponent,
  expirationTime,
  callback
) {
  const current = container.current;

  // 从父组件获取context对象注入子代组件
  const context = getContextForSubtree(parentComponent);
  if (container.context === null) {
    container.context = context;
  } else {
    container.pendingContext = context;
  }
  return scheduleRootUpdate(current, element, expirationTime, callback);
}

/**
 *
 * @param {ReactNodeList} element 嵌套的子元素
 * @param {Fiber} container 被序列化之后的根源素
 * @param {ReactComponent} parentComponent 组件的实例
 * @param {func} callback 回调函数的队列, ReactWork的实例
 */
export function updateContainer(element, container, parentComponent, callback) {
  const current = container.current;
  const currentTime = recalculateCurrentTime();
  // 进入虚拟DOM的时间
  const expirationTime = computeExpirationForFiber(currentTime, current);

  return updateContainerAtExpirationTime(
    element,
    container,
    parentComponent,
    expirationTime,
    callback
  );
}

export { unbatchedUpdates };
