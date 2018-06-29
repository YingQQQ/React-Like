import { msToExpirationTime, NoWork, Sync } from './ReactFiberExpirationTime';
import { now } from './ReactFiberHostConfig';
import { AsyncMode } from './ReactTypeOfMode';
import { computeExpirationBucket } from './ReactFiberExpirationTime';

let isUnbatchingUpdates = false;
let isBatchingUpdates = false;
let isBatchingInteractiveUpdates = false;
// 最低的交互级别
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
