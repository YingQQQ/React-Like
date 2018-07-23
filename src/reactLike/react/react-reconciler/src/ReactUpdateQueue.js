/* eslint-disable no-param-reassign */
import { NoWork } from './ReactFiberExpirationTime';

export const UpdateState = 0;
export const CaptureUpdate = 3;

export function createUpdate(expirationTime) {
  return {
    expirationTime,
    tag: UpdateState,
    payload: null,
    callback: null,
    next: null,
    nextEffect: null
  };
}

export function createUpdateQueue(baseState) {
  return {
    expirationTime: NoWork,
    baseState,
    firstUpdate: null,
    lastUpdate: null,
    firstCapturedUpdate: null,
    lastCapturedUpdate: null,
    firstEffect: null,
    lastEffect: null,
    firstCapturedEffect: null,
    lastCapturedEffect: null
  };
}

function cloneUpdateQueue(currentQueue) {
  return {
    expirationTime: currentQueue.expirationTime,
    baseState: currentQueue.baseState,
    firstUpdate: currentQueue.firstUpdate,
    lastUpdate: currentQueue.lastUpdate,

    firstCapturedUpdate: null,
    lastCapturedUpdate: null,

    firstEffect: null,
    lastEffect: null,

    firstCapturedEffect: null,
    lastCapturedEffect: null,
  };
}

function appendUpdateToQueue(queue, update, expirationTime) {
  if (queue.lastUpdate === null) {
    queue.lastUpdate = update;
    queue.firstUpdate = update;
  } else {
    queue.lastUpdate.next = update;
    queue.lastUpdate = update;
  }
  if (queue.expirationTime === NoWork || queue.expirationTime > expirationTime) {
    queue.expirationTime = expirationTime;
  }
}

export function enqueueUpdate(fiber, update, expirationTime) {
  const alternate = fiber.alternate;
  let queue1;
  let queue2;
  // 如果只有一个Fiber
  if (alternate !== null) {
    queue1 = fiber.updateQueue;
    queue2 = null;
    if (queue1 === null) {
      fiber.updateQueue = createUpdateQueue(fiber.memoizedState);
      queue1 = fiber.updateQueue;
    }
  } else {
    // 如果有两个Fiber
    queue1 = fiber.updateQueue;
    queue2 = alternate.updateQueue;
    if (queue1 === null) {
      if (queue2 === null) {
        fiber.updateQueue = createUpdateQueue(fiber.memoizedState);
        queue1 = fiber.updateQueue;
        alternate.updateQueue = createUpdateQueue(alternate.memoizedState);
        queue2 = alternate.updateQueue;
      } else {
        // 如果只有一个队列,则创建一个新的同时赋值给queue1
        fiber.updateQueue = cloneUpdateQueue(queue2);
        queue1 = fiber.updateQueue;
      }
    } else if (queue1 !== null && queue2 === null) {
      alternate.updateQueue = cloneUpdateQueue(queue1);
      queue2 = alternate.updateQueue;
    }
  }

  if (queue2 === null || queue1 === queue2) {
    // 只有一个队列
    appendUpdateToQueue(queue1, update, expirationTime);
  } else if (queue1.lastUpdate === null || queue2.lastUpdate === null) {
    // 如果两个队列都存在, 那就需要分别把更新加入相应的队列,
    // 为了表链结构的清晰,不做重复添加,只要有一个lastUpdate存在,则都更新
    appendUpdateToQueue(queue1, update, expirationTime);
    appendUpdateToQueue(queue2, update, expirationTime);
  } else {
    // 如果两个队列的lastUpdate都可以存在
    appendUpdateToQueue(queue1, update, expirationTime);
    queue2.lastUpdate = update;
  }
}
