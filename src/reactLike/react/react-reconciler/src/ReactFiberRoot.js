import { NoWork } from './ReactFiberExpirationTime';
import createHostRootFiber from '../src/ReactFiber';
/**
 * 构建虚拟DOM对象
 * @param {Element | Document} containerInfo  真实的DOM
 * @param {boolean} isAsync 是否进行异步渲染 
 * @param {boolean} hydrate 是否缓存属性 
 */
export function createFiberRoot(containerInfo, isAsync, hydrate) {
  const uninitializedFiber = createHostRootFiber(isAsync);
  const root = {
    // fiber算法产生的虚拟DOM树
    current: uninitializedFiber,
    // 真实DOM的信息
    containerInfo,
    // 是否进行更新
    pendingChildren: null,
    // 暂停执行的最新和最早的优先级
    earliestSuspendedTime: NoWork,
    latestSuspendedTime: NoWork,
    // 等待暂停执行的最新和最早的优先级
    earliestPendingTime: NoWork,
    latestPendingTime: NoWork,
    // 最新的优先级级已被解决的可以触发，并且可以重试
    latestPingedTime: NoWork,
    pendingCommitExpirationTime: NoWork,
    // 完成构建工作
    finishedWork: null,
    // 对应context,可以在整个DOM虚拟树中使用
    context: null,
    pendingContext: null,
    // 是否在初始化挂载的时候注入props
    hydrate,
    // 剩余的工作阶段
    remainingExpirationTime: NoWork,
    // 是否第一次进行调度
    firstBatch: null,
    // 下次计划渲染的元素的链表
    nextScheduledRoot: null,
  };
  uninitializedFiber.stateNode = root;
  return root;
}
