import getActiveElement from './getActiveElement';
import * as ReactDOMSelection from './ReactDOMSelection';

/**
 * 判断是不是能获取焦点的元素
 * @param {string} elem 元素标签名
 */
export function hasSelectionCapabilities(elem) {
  const nodeName = elem && elem.nodeName && elem.nodeName.toLowerCase();
  return (
    (nodeName === 'input' &&
      (elem.type === 'text' ||
        elem.type === 'password' ||
        elem.type === 'tel' ||
        elem.type === 'url' ||
        elem.type === 'search')) ||
    nodeName === 'textarea' ||
    elem.contentEditable === 'true'
  );
}

/**
 * 获取焦点的元素value长度
 * @param {string} elem 元素标签名
 */
function getSelection(input) {
  let selection;
  if ('selectionStart' in input) {
    // 谷歌火狐浏览器支持的属性
    selection = {
      start: input.selectionStart,
      end: input.selectionEnd
    };
  } else {
    // 兼容IE
    selection = ReactDOMSelection.getOffsets(input);
  }

  return (
    selection || {
      start: 0,
      end: 0
    }
  );
}

/**
 * 检查要渲染元素得是否有必要获取焦点input, textarea
 * @returns {DOM, getSelection}
 */
export function getSelectionInformation() {
  const focusedElem = getActiveElement();
  return {
    focusedElem,
    selectionRange: hasSelectionCapabilities(focusedElem)
      ? getSelection(focusedElem)
      : null
  };
}
