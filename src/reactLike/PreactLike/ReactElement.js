/* eslint-disable  no-param-reassign */
/* eslint-disable  no-underscore-dangle */
import { hasOwnProperty, REACT_ELEMENT_TYPE, typeNumber } from './util/index';
import Renderer from './Renderer';

// 预存的属性
const RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true
};

function hasVaildRef(config) {
  return config.ref !== undefined;
}
function hasVaildKey(config) {
  return config.key !== undefined;
}

function propsFactory(type, config, props, children, childrenLen) {
  const attributes = Object.keys(config);
  const propsKey = Object.keys(props);
  let defaultProps;

  // 先把属性赋值给props,但必须不是预设的属性值;
  // 例如key,ref等等
  attributes.forEach((attr) => {
    if (
      hasOwnProperty.call(config, attr) &&
      !hasOwnProperty.call(RESERVED_PROPS, attr)
    ) {
      props[attr] = config[attr];
    }
  });
  // 如果传入的type可能是组件的实例有defaultProps则覆盖给props
  if (type && type.defaultProps) {
    defaultProps = type.defaultProps;
    propsKey.forEach((key) => {
      if (props[key] === undefined) {
        props[key] = defaultProps[key];
      }
    });
  }

  if (childrenLen === 1) {
    props.children = children[0];
  } else if (childrenLen > 1) {
    props.children = children;
  }
  return props;
}

function reactElement(type, tag, props, key, ref, owner) {
  const ret = {
    type,
    tag,
    props
  };

  // 如果tag不是6的话,我们判定它需要是一个react生成的虚拟DOM
  if (tag !== 6) {
    ret.$$typeof = REACT_ELEMENT_TYPE;
    ret.key = key || null;
    const refType = typeNumber(ref);
    if (refType === 2 || refType === 3 || refType === 4 || refType === 5 || refType === 8) {
      // boolean number, string, 
      if (refType < 4) {
        ref += '';
      }
      ret.ref = ref;
    } else {
      ret.ref = null;
    }
    ret._owner = owner;
  }

  return ret;
}

export default function createElement(type, config, ...children) {
  const childrenLen = children.length;
  let props = {};
  let tag = 5;
  let key = null;
  let ref = null;

  if (type) {
    tag = 1;
  }

  if (config != null) {
    if (hasVaildRef(config)) {
      ref = config.ref;
    }
    if (hasVaildKey(config)) {
      key = config.key;
    }
  }

  props = propsFactory(type, config || {}, props, children, childrenLen);

  return reactElement(type, tag, props, key, ref, Renderer.currentOwner);
}
