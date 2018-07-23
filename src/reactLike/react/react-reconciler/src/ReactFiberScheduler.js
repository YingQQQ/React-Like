/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-bitwise */
import { AsyncMode } from './ReactTypeOfMode';
import { computeExpirationBucket } from './ReactFiberExpirationTime';
import { HostRoot, ClassComponent } from '../../shared/ReactTypeOfWork';
import { msToExpirationTime, NoWork, Sync } from './ReactFiberExpirationTime';
import { now } from './ReactFiberHostConfig';

import {
  unwindInterruptedWork,
  createClassErrorUpdate
} from './ReactFiberUnwindWork';
import {
  markPendingPriorityLevel,
  markCommittedPriorityLevels
} from './ReactFiberPendingPriority';
import ReactCurrentOwner from '../../react/src/ReactCurrentOwner';
import { PerformedWork, Snapshot } from '../../shared/ReactTypeOfSideEffect';
import { commitBeforeMutationLifeCycles } from './ReactFiberCommitWork';
import { prepareForCommit } from './ReactFiberHostConfig';
import { enqueueUpdate } from './ReactUpdateQueue';
import createCapturedValue from './ReactCapturedValue';

const timeHeuristicForUnitOfWork = 1;
// Linked-list of roots
let interruptedBy = null; // Fiber || null
// 正在处理队列中的下一个Fiber对象
let nextUnitOfWork = null; // Fiber | null
let nextRoot = null;
let isUnbatchingUpdates = false;
let isBatchingUpdates = false;
let isBatchingInteractiveUpdates = false;
let lowestPendingInteractiveExpirationTime = NoWork;

let nextFlushedRoot = null;
let nextFlushedExpirationTime = NoWork;

let isRendering = false;

let lastScheduledRoot = null;
let firstScheduledRoot = null;

let legacyErrorBoundariesThatAlreadyFailed = null;

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

let deadline = null;
let deadlineDidExpire = false;

let completedBatches = null;

// 异步标识
let nextEffect = null;

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
  nextRoot = null;
  nextRenderExpirationTime = NoWork;
  nextLatestTimeoutMs = -1;
  nextRenderDidError = false;
  nextUnitOfWork = null;
}
/**
 * 在异步任务的时候,调度器会查询渲染是否需要全部执行,如果是DOM对象,我们这调取requestIdleCallback去实现
 */
function shouldYield() {
  if (deadline === null || deadlineDidExpire) {
    return false;
  }

  if (deadline.timeRemaining() > timeHeuristicForUnitOfWork) {
    // 忽视 deadline.didTimeout, 只有已经过期的任务能被刷新在超时阶段, 仅针对未过期的任务
    return false;
  }
  deadlineDidExpire = true;
  return true;
}

function commitBeforeMutationLifecycles() {
  while (nextEffect !== null) {
    const effectTag = nextEffect.effectTag;
    if (effectTag & Snapshot) {
      const current = nextEffect.alternate;
      commitBeforeMutationLifeCycles(current, nextEffect);
    }
    nextEffect = nextEffect.nextEffect;
  }
}
/**
 *检查是否还有已经遗留的错误边界
 * @param {fiber} instance
 */
function isAlreadyFailedLegacyErrorBoundary(instance) {
  return (
    legacyErrorBoundariesThatAlreadyFailed !== null &&
    legacyErrorBoundariesThatAlreadyFailed.has(instance)
  );
}
/**
 * 标识错误边界, Set不重复的数组,存放的是发生错误的组件实例,
 * @param {component instance} instance
 */
export function markLegacyErrorBoundaryAsFailed(instance) {
  if (legacyErrorBoundariesThatAlreadyFailed === null) {
    legacyErrorBoundariesThatAlreadyFailed = new Set([instance]);
  } else {
    legacyErrorBoundariesThatAlreadyFailed.add(instance);
  }
}

function captureCommitPhaseError(fiber, error) {
  return dispatch(fiber, error, Sync);
}
/**
 *
 * @param {FiberRoot} root
 * @param {fiber} finishedWork
 */
function commitRoot(root, finishedWork) {
  isWorking = true;
  isCommitting = true;
  const committedExpirationTime = root.pendingCommitExpirationTime;
  root.pendingCommitExpirationTime = NoWork;
  // 更新我提交任务中中等待执行任务的优先级, 这些发生在生命周期开始之前,因为
  // 可能会有其他需要更新的内容增加
  const earliestRemainingTime = finishedWork.expirationTime;
  markCommittedPriorityLevels(root, earliestRemainingTime);

  // 重新设置组件缓存标记为null
  ReactCurrentOwner.current = null;

  let firstEffect;
  if (finishedWork.effectTag > PerformedWork) {
    // 一个fiber对象的副作用列表只有child组成,所以如果根节点发生了副作用
    // 我们需要把根节点放到列表的最后,最后的列表是一个根节点的集合列表,如果
    // 有一个集合,那说明这是这个根节点所有的副作用(异步请求)
    if (finishedWork.lastEffect !== null) {
      finishedWork.lastEffect.nextEffect = finishedWork;
      firstEffect = finishedWork.firstEffect;
    } else {
      firstEffect = finishedWork;
    }
  } else {
    // 如果没有副作用(异步请求)
    firstEffect = finishedWork.firstEffect;
  }

  // 准备提交转化成真实的DOM,判断是否启动事件监听,是否是能获取焦点的元素
  prepareForCommit(root.containerInfo);

  nextEffect = firstEffect;

  // 在挂载之前调用getSnapshotBeforeUpdate
  while (nextEffect !== null) {
    let didError = false;
    let error;

    try {
      commitBeforeMutationLifecycles();
    } catch (e) {
      didError = true;
      error = e;
    }
    if (didError) {
      // 捕获提交碎片时的错误
      captureCommitPhaseError(nextEffect, error);

      if (nextEffect !== null) {
        nextEffect = nextEffect.nextEffect;
      }
    }
  }
}

function completeRoot(root, finishedWork, expirationTime) {
  // 检查此次所有任务是否有匹配的到期时间
  const firstBatch = root.firstBatch;
  if (firstBatch !== null && firstBatch.__expirationTime <= expirationTime) {
    if (completedBatches === null) {
      completedBatches = [firstBatch];
    } else {
      completedBatches.push(firstBatch);
    }
    if (firstBatch._defer) {
      // 暂停此项任务进入下一个阶段, 直到接到下个更新
      root.finishedWork = finishedWork;
      root.expirationTime = NoWork;
      return;
    }
  }
  // 提交进入下一个阶段
  root.finishedWork = null;
  commitRoot(root, finishedWork);
}
/**
 *
 * @param {FiberRoot} root ReactFiberRoot中createFiberRoot返回的实例
 * @param {number} expirationTime 优先级别
 * @param {boolean} isYieldy 是否是异步任务
 */
// TODO: 完成renderRoot
function performWorkOnRoot(root, expirationTime, isYieldy) {
  isRendering = true;
  // 检查是异步或者是同步/过期的任务
  if (!isYieldy) {
    // 刷新任务在没有需求产出的情况下
    let finishedWork = root.finishedWork;
    if (finishedWork !== null) {
      // 根节点的任务已经完成,我们就提交进入下一个阶段
      completeRoot(root, finishedWork, expirationTime);
    } else {
      renderRoot(root, false);
      finishedWork = root.finishedWork;
      if (finishedWork !== null) {
        // 根节点的任务已经完成,我们就提交进入下一个阶段
        completeRoot(root, finishedWork, expirationTime);
      }
    }
  } else {
    // 刷新异步任务
    let finishedWork = root.finishedWork;
    if (finishedWork !== null) {
      completeRoot(root, finishedWork, expirationTime);
    } else {
      renderRoot(root, true);
      finishedWork = root.finishedWork;
      // 检查完成之后是否还有时间多余
      if (finishedWork !== null) {
        if (!shouldYield()) {
          // 如果还有时间多余
          completeRoot(root, finishedWork, expirationTime);
        } else {
          // 如果没有时间多余,则标记root已经完成,然后再下一次在提交进入下一个阶段
          root.finishedWork = finishedWork;
        }
      }
    }
  }
}

/**
 * @param {FiberRoot} root ReactFiberRoot中createFiberRoot返回的实例
 * @param {number} expirationTime 优先级别
 */
function addRootToSchedule(root, expirationTime) {
  // 检查传入的对象是不是已经在链表中
  if (root.nextScheduledRoot === null) {
    // 如果不存在则加入表链
    root.expirationTime = expirationTime;
    if (lastScheduledRoot === null) {
      firstScheduledRoot = root;
      lastScheduledRoot = root;
      root.nextScheduledRoot = root;
    } else {
      lastScheduledRoot.nextScheduledRoot = root;
      lastScheduledRoot = root;
      firstScheduledRoot.nextScheduledRoot = firstScheduledRoot;
    }
  } else {
    // 如果传入的对象已经在链表中,则需要更新其优先级
    const remainingExpirationTime = root.expirationTime;
    if (
      remainingExpirationTime === NoWork ||
      remainingExpirationTime > expirationTime
    ) {
      root.expirationTime = expirationTime;
    }
  }
}

/**
 * 每当更新的时候都会调用requestWork,以便在之后的渲染中调用
 * @param {FiberRoot} root ReactFiberRoot中createFiberRoot返回的实例
 * @param {number} expirationTime 优先级别
 */
export function requestWork(root, expirationTime) {
  addRootToSchedule(root, expirationTime);

  if (isRendering) {
    // 防止重复注入, 在当前渲染任务的最后会调度剩余的任务
    return;
  }
  if (isBatchingUpdates) {
    // 在当前渲染完成后刷新队列
    if (isUnbatchingUpdates) {
      // 除非我们正处于isUnbatchingUpdatesd状态中,那我们立刻刷新队列
      nextFlushedRoot = root;
      nextFlushedExpirationTime = Sync;
      performWorkOnRoot(root, Sync, false);
    }
    return;
  }

  if (expirationTime === Sync) {
    performSyncWork();
  } else {
    scheduleCallbackWithExpirationTime(expirationTime);
  }
}

// TODO: requestWork
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
          // 如果队列级别紊乱,则重新调整
          interruptedBy = fiber;
          resetStack();
        }
        // 给需要进行渲染的虚拟DOM标记优先级
        markPendingPriorityLevel(root, expirationTime);
        // 如果我们处在渲染阶段,我们则不再安排根目录进行更新,因为我们会在渲染过程退出前处理
        if (!isWorking && isCommitting && nextRoot !== root) {
          const rootExpirationTime = root.expirationTime;
          requestWork(root, rootExpirationTime);
        }
      } else {
        return;
      }
    }
    node = node.return;
  }
}

/**
 *
 * @param {Fiber} sourceFiber
 * @param {error String} value
 * @param {number} expirationTime
 */
function dispatch(sourceFiber, value, expirationTime) {
  // 获取父元素
  let fiber = sourceFiber.return;
  while (fiber !== null) {
    if (fiber.tag === ClassComponent) {
      const ctor = fiber.type;
      const instance = fiber.stateNode;
      if (
        typeof ctor.getDerivedStateFromCatch === 'function' ||
        (typeof instance.componentDidCatch === 'function' &&
          !isAlreadyFailedLegacyErrorBoundary(instance))
      ) {
        const errorInfo = createCapturedValue(value, sourceFiber);
        const update = createClassErrorUpdate(fiber, errorInfo, expirationTime);
        enqueueUpdate(fiber, update, expirationTime);
        scheduleWork(fiber, expirationTime);
        return;
      }
    }
    // render时进入根目录
    if (fiber.tag === HostRoot) {
      const errorInfo = createCapturedValue(value, sourceFiber);
      const update = createRootErrorUpdate(fiber, errorInfo, expirationTime);
      enqueueUpdate(fiber, update, expirationTime);
      scheduleWork(fiber, expirationTime);
      return;
    }
    fiber = fiber.return;
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
