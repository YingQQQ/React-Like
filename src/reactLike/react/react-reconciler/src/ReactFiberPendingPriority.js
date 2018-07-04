/* eslint-disable no-param-reassign */

/**
 * React Fiber 等待的优先级
*/

import { NoWork, Sync } from './ReactFiberExpirationTime';

/**
 * @param {FiberRoot import ./ReactFiberRoot } createFiberRoot函数返回的对象
 */
function findNextPendingPriorityLevel(root) {
  const earliestSuspendedTime = root.earliestSuspendedTime;
  const earliestPendingTime = root.earliestPendingTime;
  let nextExpirationTimeToWorkOn;
  let expirationTime;
  if (earliestSuspendedTime === NoWork) {
    // 说明没有需要被暂停的任务
    expirationTime = earliestPendingTime;
    nextExpirationTimeToWorkOn = earliestPendingTime;
  } else if (earliestPendingTime !== NoWork) {
    // 检查是否有未知的任务
    nextExpirationTimeToWorkOn = earliestPendingTime;
    expirationTime =
      earliestSuspendedTime < earliestPendingTime
        ? earliestSuspendedTime
        : earliestPendingTime;
  } else {
    // 如果有一个需要暂停处理的任务,那就先处理,否则那就继续下一个任务
    nextExpirationTimeToWorkOn = root.latestPendingTime;
    expirationTime = root.latestPendingTime;
  }

  if (root.didError) {
    // 如果有错误,则改为同步渲染
    expirationTime = Sync;
  }
  // 改变虚拟节点所处的任务阶段
  root.nextExpirationTimeToWorkOn = nextExpirationTimeToWorkOn;
  root.expirationTime = expirationTime;
}
/**
 * 给等待的子代标记优先级
 * @param {Vnode} root 虚拟DOM对象
 * @param {number} expirationTime 阶段等级
 */
export function markPendingPriorityLevel(root, expirationTime) {
  // 在渲染根节点失败之后和重新启动之前有空闲时间,则安排其他的更新,清除didError防止更新有充足的时间来进行
  root.didError = false;
  const earliestPendingTime = root.earliestPendingTime;

  // 更新最早的和最新的处理时间
  if (earliestPendingTime === NoWork) {
    // 没有其他等待处理的更新
    root.earliestPendingTime = expirationTime;
    root.latestPendingTime = expirationTime;
  } else if (earliestPendingTime > expirationTime) {
    // 最早需要被更新的级别
    root.earliestPendingTime = expirationTime;
  } else {
    const latestPendingTime = root.latestPendingTime;
    if (latestPendingTime < expirationTime) {
      // 最新需要被处理的级别
      root.latestPendingTime = expirationTime;
    }
  }
  findNextPendingPriorityLevel(root);
}

export function markCommittedPriorityLevels(root, earliestRemainingTime) {
  root.didError = false;
  if (earliestRemainingTime === NoWork) {
    // 没有剩余任务,则清除所有的状态回归NoWork
    root.earliestPendingTime = NoWork;
    root.latestPendingTime = NoWork;
    root.earliestSuspendedTime = NoWork;
    root.latestSuspendedTime = NoWork;
    root.latestPingedTime = NoWork;
    findNextPendingPriorityLevel(root);
    return;
  }

  const latestPendingTime = root.latestPendingTime;

  // 如果之前最新已知等待处理的等级刚刚被刷新
  if (latestPendingTime !== NoWork) {
    if (latestPendingTime < earliestRemainingTime) {
      // 刷新所以已知的等待执行任务
      root.earliestPendingTime = NoWork;
      root.latestPendingTime = NoWork;
    } else {
      const earliestPendingTime = root.earliestPendingTime;
      if (earliestPendingTime < earliestRemainingTime) {
        // 刷新最早的等待执行的任务,把他替换成最新等待执行任务
        root.earliestPendingTime = root.latestPendingTime;
      }
    }
  }
  // 接着处理整个虚拟线程剩下的未完成的任务,我们需要判断哪些是需要等待执行哪些是
  // 需要被暂停的.检查这些任务哪些处在暂停执行的范围内
  const earliestSuspendedTime = root.earliestSuspendedTime;
  if (earliestSuspendedTime === NoWork) {
    // 没有暂停的任务,则我们把剩余的任务级别都设定为待执行的
    markPendingPriorityLevel(root, earliestRemainingTime);
    findNextPendingPriorityLevel(root);
    return;
  }

  const latestSuspendedTime = root.latestSuspendedTime;

  if (earliestRemainingTime > latestSuspendedTime) {
    // 如果最早的任务剩余时间大于最后暂停的任务,则说明需要刷新所有的暂停任务
    root.earliestSuspendedTime = NoWork;
    root.latestSuspendedTime = NoWork;
    root.latestPingedTime = NoWork;

    markPendingPriorityLevel(root, earliestRemainingTime);
    findNextPendingPriorityLevel(root);
    return;
  }
  if (earliestRemainingTime < latestSuspendedTime) {
    // 如果最早的任务剩余时间<最后暂停的任务,则说明还有等待更新的任务

    markPendingPriorityLevel(root, earliestRemainingTime);
    findNextPendingPriorityLevel(root);
    return;
  }
  // 如果剩余的时间在暂停时间范围内,则处理这些暂停任务
  findNextPendingPriorityLevel(root);
}
