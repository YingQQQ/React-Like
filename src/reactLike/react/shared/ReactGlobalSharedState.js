/* eslint-disable no-underscore-dangle */
import React from '../react/src/React';

// 内部使用的结构
const ReactInternals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

const ReactCurrentOwner = ReactInternals.ReactCurrentOwner;

export default ReactCurrentOwner;
