/* eslint-disable  no-bitwise */
import { HostRoot } from '../../shared/ReactTypeOfWork';
import { AsyncMode, StrictMode, NoContext } from './ReactTypeOfMode';
import { NoWork } from './ReactFiberExpirationTime';
import { NoEffect } from '../../shared/ReactTypeOfSideEffect';

/**
 * 创建虚拟DOM的类
 * @param {number} tag DOM类型标记
 * @param {boolean} pendingProps 等待注入props 
 * @param {null | string} key 唯一key 
 * @param {number} mode 渲染模式
 */
function FiberNode(tag, pendingProps, key, mode) {
  this.tag = tag;
  this.key = key;
  this.type = null;
  this.stateNode = null;

  // 表链结构
  this.return = null;
  this.child = null;
  this.sibling = null;
  this.index = 0;

  this.ref = null;

  this.pendingProps = pendingProps;
  // 被记录的属性
  this.memoizedProps = null;
  this.memoizedState = null;
  this.updateQueue = null;

  this.mode = mode;

  // 副作用
  this.effectTag = NoEffect;
  this.nextEffect = null;

  this.firstEffect = null;
  this.lastEffect = null;

  // 到期阶段标识
  this.expirationTime = NoWork;
  // 备用,在fiber更新时克隆出的镜像fiber，对fiber的修改会标记在这个fiber上
  this.alternate = null;
}

/**
 * 创建虚拟DOM实例
 * @param {number} tag DOM类型标记
 * @param {boolean} pendingProps 等待注入props 
 * @param {null | string} key 唯一key 
 * @param {number} mode 渲染模式
 * @returns {Instance FiberNode}
 */
const createFiber = function createFiber(tag, pendingProps, key, mode) {
  return new FiberNode(tag, pendingProps, key, mode);
};

export default function createHostRootFiber(isAsync) {
  const mode = isAsync ? (AsyncMode | StrictMode) : NoContext;
  return createFiber(HostRoot, null, null, mode);
}
