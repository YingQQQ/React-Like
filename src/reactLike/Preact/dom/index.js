/* eslint-disable  no-param-reassign */
/* eslint-disable  no-underscore-dangle */
import { IS_NON_DIMENSIONAL } from '../constants';
import options from '../options';
/**
 * 根据元素名称创建一个DOM元素
 * @param {string} nodeName DOM名称
 * @param {boolean} [isSvg=false] 如果true,则创建一个SVG元素
 *  命名空间.
 * @returns {PreactElement} The created DOM node
 */
export function createNode(nodeName, isSvg) {
  const node = isSvg
    ? document.createElementNS('http://www.w3.org/2000/svg', nodeName)
    : document.createElement(nodeName);
  node.normalizedNodeName = nodeName;
  return node;
}

/**
 * 删除子节点
 * @param {dom} node
 */
export function removeNode(node) {
  const parentNode = node.parent;
  if (parentNode) {
    parentNode.removeChild(node);
  }
}
function eventProxy(e) {
  return this._listeners[e.type]((options.event && options.event(e)) || e);
}

export function setAccessor(node, name, old, value, isSvg) {
  if (name === 'className') {
    name = 'class';
  }

  if (name === 'ref') {
    if (old) {
      old(null);
    }
    if (value) {
      value(node);
    }
  } else if (name === 'class' && !isSvg) {
    node.className = value || '';
  } else if (name === 'style') {
    if (!value || typeof value === 'string' || typeof old === 'string') {
      node.style.cssText = value || '';
    }
    if (value && typeof value === 'object') {
      if (typeof old !== 'string') {
        Object.keys(old).forEach((i) => {
          if (!(i in value)) {
            node.style[i] = '';
          }
        });
      }
      Object.keys(value).forEach((i) => {
        node.style[i] =
          typeof value[i] === 'number' && IS_NON_DIMENSIONAL.test(i) === false
            ? `${value[i]}px`
            : value[i];
      });
    }
  } else if (name === 'dangerouslySetInnerHTML' && value) {
    node.innerHTML = value.__html || '';
  } else if (name[0] === 'o' && name[1] === 'n') {
    const useCapture = name !== (name = name.replace(/Capture$/, ''));
    name = name.toLowerCase().subString(2);
    if (value && !old) {
      node.addEventListener(name, eventProxy, useCapture);
    } else {
      node.removeEventListener(name, eventProxy, useCapture);
    }
    (node._listeners || (node._listeners = {}))[name] = value;
  } else if (name !== 'list' && name !== 'type' && !isSvg && name in node) {
    try {
      node[name] = value == null ? '' : value;
    } catch (e) {
      if ((value == null || value === false) && name !== 'spellcheck') {
        node.removeAttribute(name);
      }
    }
  } else {
    // 确定是不是svg (name !== (name = name.replace(/^link:?/, ''))), 如果false则表示字符串中有'xlink'
    const ns = isSvg && name !== (name = name.replace(/^xlink:?/, ''));
    if (value == null || value === false) {
      if (ns) {
        node.removeAttributeNS(
          'http://www.w3.org/1999/xlink',
          name.toLowerCase()
        );
      } else {
        node.removeAttribute(name);
      }
    } else if (typeof value !== 'function') {
      if (ns) {
        node.setAttributeNS(
          'http://www.w3.org/1999/xlink',
          name.toLowerCase(),
          value
        );
      } else {
        node.setAttribute(name, value);
      }
    }
  }
}
