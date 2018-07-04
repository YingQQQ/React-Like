import createElement from '../../ReactElement';
import ReactCurrentOwner from './ReactCurrentOwner';

const React = {
  createElement,
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
    ReactCurrentOwner,
  }
};

export default React;
