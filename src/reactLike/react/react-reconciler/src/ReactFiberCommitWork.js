/* eslint-disable no-bitwise */
/* eslint-disable no-underscore-dangle */
import {
  ClassComponent,
  HostPortal,
  HostComponent,
  HostText,
  HostRoot
} from '../../shared/ReactTypeOfWork';
import { Snapshot } from '../../shared/ReactTypeOfSideEffect';
import getStackAddendumByWorkInProgressFiber from '../../shared/ReactFiberComponentTreeHook';
import getComponentName from '../../shared/getComponentName';
import logCapturedError from './ReactFiberErrorLogger';
import { supportsMutation, resetTextContent } from './ReactFiberHostConfig';

function commitBeforeMutationLifeCycles(current, finishedWork) {
  switch (finishedWork.tag) {
    case ClassComponent:
      if (finishedWork.effectTag & Snapshot) {
        if (current !== null) {
          const prveProps = current.memoizedProps;
          const prveState = current.memoizedState;
          const instance = finishedWork.stateNode;
          instance.props = finishedWork.memoizedProps;
          instance.state = finishedWork.memoizedState;
          const snapshot = instance.getSnapshotBeforeUpdate(
            prveProps,
            prveState
          );
          instance.__reactInternalSnapshotBeforeUpdate = snapshot;
        }
      }
      break;
    case HostPortal:
    case HostComponent:
    case HostText:
    case HostRoot:
      break;
    default:
      break;
  }
}

/**
 *
 * @param {Fiber} boundary Fiber对象
 * @param {object} errorInfo 捕获的错误信息
 */
function logError(boundary, errorInfo) {
  const source = errorInfo.source;
  let stack = errorInfo.stack;
  if (source !== null && stack !== null) {
    stack = getStackAddendumByWorkInProgressFiber(source);
  }
  const capturedError = {
    componentName: source !== null ? getComponentName(source) : null,
    componentStack: stack !== null ? stack : '',
    error: errorInfo.value,
    errorBoundary: null,
    errorBoundaryName: null,
    errorBoundaryFound: false,
    willRetry: false
  };
  if (boundary !== null && boundary.tag === ClassComponent) {
    capturedError.errorBoundary = boundary.stateNode;
    capturedError.errorBoundaryName = getComponentName(boundary);
    capturedError.errorBoundaryFound = true;
    capturedError.willRetry = true;
  }
  try {
    logCapturedError(capturedError);
  } catch (e) {
    const suppresslogging = e && e.suppressReactErrorLogging;
    if (!suppresslogging) {
      console.error(e);
    }
  }
}
/**
 * 提交调度之前确保清空文本内容
 * @param {Fiber} current
 */
function commitResetTextContent(current) {
  if (!supportsMutation) {
    return;
  }
  resetTextContent(current);
}

/**
 * 清除ref
 * @param {fiber} current 
 */
function commitDetachRef(current) {
  const currentRef = current.ref;
  if (currentRef !== null) {
    if (typeof currentRef === 'function') {
      currentRef(null);
    } else {
      currentRef.current = null;
    }
  }
}
/**
 * 进行代替工作
 * @param {fiber} finishedWork 
 */
// TODO: 未完成
function commitPlacement(finishedWork) {
  
}

export { commitBeforeMutationLifeCycles, commitResetTextContent, logError, commitDetachRef };
