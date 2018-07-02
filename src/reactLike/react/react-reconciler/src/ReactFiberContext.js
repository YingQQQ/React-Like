/* eslint-disable  no-underscore-dangle */
import { HostRoot, ClassComponent } from '../../shared/ReactTypeOfWork';
import emptyObject from '../../lib/emptyObject';
import { createCursor, pop } from './ReactFiberStack';

// 用boolean创建一个context是否改变的浮标
let didPerformWorkStackCursor = createCursor(false);
// 当前context对象合并到栈中对象的context的浮标
let contextStackCursor = createCursor(emptyObject);


// ClassComponent: 2
function isContextProvider(fiber) {
  return fiber.tag === ClassComponent && fiber.type.childContextTypes !== null;
}

function popContextProvider(fiber) {
  if (!isContextProvider(fiber)) {
    return;
  }
  // 去掉DEV
  pop(didPerformWorkStackCursor);
  pop(contextStackCursor);
}
/**
 * 返回父组件的context
 * @param {import { Fiber } from "./ReactFiber.js";} fiber 虚拟DOM对象
 */
function findCurrentUnmaskedContext(fiber) {
  let node = fiber;
  while (node.tag !== HostRoot) {
    if (isContextProvider(node)) {
      return node.stateNode.__reactInternalMemoizedMergedChildContext;
    }

    const parent = node.return;
    node = parent;
  }

  return node.stateNode.context;
}

function processChildContext(fiber, parentContext) {
  const instance = fiber.stateNode;

  if (typeof instance.getChildContext !== 'function') {
    return parentContext;
  }

  const childContext = instance.getChildContext();

  return {
    ...parentContext,
    ...childContext
  };
}

function popTopLevelContextObject() {
  pop(didPerformWorkStackCursor);
  pop(contextStackCursor);
}
export {
  findCurrentUnmaskedContext,
  isContextProvider,
  processChildContext,
  popContextProvider,
  popTopLevelContextObject
};
