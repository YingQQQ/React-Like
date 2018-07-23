/* eslint-disable  no-underscore-dangle */
import {
  ClassComponent,
  IndeterminateComponent,
  FunctionalComponent,
  HostComponent
} from './ReactTypeOfWork';
import getComponentName from './getComponentName';
import describeComponentFrame from './describeComponentFrame';

function describeFiber(fiber) {
  switch (fiber.tag) {
    case IndeterminateComponent:
    case FunctionalComponent:
    case ClassComponent:
    case HostComponent: {
      const owner = fiber._debugOwner;
      const soure = fiber._debugSource;
      const name = getComponentName(fiber);
      let ownerName = null;
      if (owner) {
        ownerName = getComponentName(owner);
      }
      return describeComponentFrame(name, soure, ownerName);
    }
    default:
      return '';
  }
}

export default function getStackAddendumByWorkInProgressFiber(workInProgress) {
  let info = '';
  let node = workInProgress;
  while (node) {
    info += describeFiber(node);
    node = node.return;
  }

  return info;
}
