import { AsyncMode } from './ReactTypeOfMode';
import { computeExpirationBucket } from './ReactFiberExpirationTime';
import { HostRoot } from '../../shared/ReactTypeOfWork';
import { msToExpirationTime, NoWork, Sync } from './ReactFiberExpirationTime';
import { now } from './ReactFiberHostConfig';
import { unwindInterruptedWork } from './ReactFiberUnwindWork';

let interruptedBy = null; // Fiber || null
// 正在处理队列中的下一个Fiber对象
let nextUnitOfWork = null; // Fiber | null 
let nextRoot = null;
let isUnbatchingUpdates = false;
let isBatchingUpdates = false;
let isBatchingInteractiveUpdates = false;
let lowestPendingInteractiveExpirationTime = NoWork;

export function unbatchedUpdates(fn, a) {
  if (isBatchingUpdates && !isUnbatchingUpdates) {
    isUnbatchingUpdates = true;
    try {
      return fn(a);
    } catch (error) {
      isUnbatchingUpdates = false;
    }
  }
  return fn(a);
}

const originalStartTimeMs = now();
let mostRecentCurrentTime = msToExpirationTime(0);
let mostRecentCurrentTimeMS = originalStartTimeMs;

export function recalculateCurrentTime() {
  mostRecentCurrentTimeMS = now() - originalStartTimeMs;
  mostRecentCurrentTime = msToExpirationTime(mostRecentCurrentTimeMS);
  return mostRecentCurrentTime;
}

let expirationContext = NoWork; // default 0
let isWorking = false;
let isCommitting = false;
// 下一个渲染级别
let nextRenderExpirationTime = NoWork;

/**
 * 计算获取正在更新渲染的时间
 * @param {number} currentTime当前消耗的时间
 */
function computeInteractiveExpiration(currentTime) {
  const expirationMs = 150;
  // 最大值
  const bucketSizeMs = 100;

  return computeExpirationBucket(currentTime, expirationMs, bucketSizeMs);
}
/**
 * 计算获取异步渲染的时间
 * @param {number} currentTime当前消耗的时间
 */
function computeAsyncExpiration(currentTime) {
  const expirationMs = 5000;
  const bucketSizeMs = 250;

  return computeExpirationBucket(currentTime, expirationMs, bucketSizeMs);
}

function resetStack() {
  if (nextUnitOfWork !== null) {
    let interruptedWork = nextUnitOfWork.return;
    while (interruptedWork !== null) {
      unwindInterruptedWork(interruptedWork);
      interruptedWork = interruptedWork.return;
    }
  }
}
// TODO: 完成markCommittedPriorityLevels,requestWork
export function scheduleWork(fiber, expirationTime) {
  let node = fiber;
  while (node !== null) {
    if (
      node.expirationTime === NoWork ||
      node.expirationTime > expirationTime
    ) {
      node.expirationTime = expirationTime;
    }
    if (
      node.alternate !== null &&
      (node.alternate.expirationTime === NoWork ||
        node.alternate.expirationTime > expirationTime)
    ) {
      node.alternate.expirationTime = expirationTime;
    }

    if (node.return === null) {
      if (node.tag === HostRoot) {
        const root = node.stateNode;
        if (
          !isWorking &&
          nextRenderExpirationTime !== NoWork &&
          expirationTime < nextRenderExpirationTime
        ) {
          interruptedBy = fiber;
          resetStack();
        }
        markPendingPriorityLevel(root, expirationTime);
        // 如果我们处在渲染阶段,我们则不安排根目录进行更新,因为我们会在渲染过程退出前处理
        if (!isWorking && isCommitting && nextRoot !== root) {
          const rootExpirtationTime = root.expirtationTime;
          requestWork(root, rootExpirtationTime);
        }
      } else {
        return;
      }
    }
    node = node.return;
  }
}

export function computeExpirationForFiber(currentTime, fiber) {
  let expirationTime;
  if (expirationContext !== NoWork) {
    // 渲染标识被明确设置
    expirationTime = expirationContext;
  } else if (isWorking) {
    if (isCommitting) {
      // 在提交阶段发生的更新应具有同步渲染
      expirationTime = Sync;
    } else {
      // 在渲染完成的时候更新也应该在同一阶段完成
      expirationTime = nextRenderExpirationTime;
    }
    // 如果没有明确的进入渲染的标识,则推算现在渲染所处的阶段
  } else if (fiber.mode && AsyncMode) {
    if (isBatchingInteractiveUpdates) {
      // 处在一个渲染替换更新的阶段
      expirationTime = computeInteractiveExpiration(currentTime);
    } else {
      // 处在异步更新阶段
      expirationTime = computeAsyncExpiration(currentTime);
    }
    // 如果我们正在渲染树中,在渲染完成之前不再更新进入阶段
    if (nextRoot !== null && expirationTime === nextRenderExpirationTime) {
      expirationTime += 1;
    }
  } else {
    // 更新是同步渲染
    expirationTime = Sync;
  }
  // 处在一个渲染替换更新的阶段
  if (
    (isBatchingInteractiveUpdates &&
      lowestPendingInteractiveExpirationTime === NoWork) ||
    expirationTime > lowestPendingInteractiveExpirationTime
  ) {
    // 当正处在更新的时候,可以允许同步更新所有我们需要更新的内容
    lowestPendingInteractiveExpirationTime = expirationTime;
  }
  return expirationTime;
}
