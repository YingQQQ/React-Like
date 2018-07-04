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

function commitResetTextContent() {}

export { commitBeforeMutationLifeCycles, commitResetTextContent };
