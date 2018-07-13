/* eslint-disable no-unused-expressions */
/* eslint-disable no-unused-labels */
/* eslint-disable no-labels */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-constant-condition */
/* eslint-disable no-plusplus */
import { TEXT_NODE } from '../shared/HTMLNodeType.JS';

/**
 * https://developer.mozilla.org/zh-CN/docs/Web/API/Selection
 */
export function getModernOffsetsFromPoints(
  outerNode,
  anchorNode,
  anchorOffset,
  focusNode,
  focusOffset
) {
  let length = 0;
  let start = -1;
  let end = -1;
  let node = outerNode;
  let indexWithinAnchor = 0;
  let indexWithinFocus = 0;
  let parentNode = null;
  outer: while (true) {
    let next = null;
    while (true) {
      if (
        node === anchorNode &&
        (anchorOffset === 0 || node.nodeType === TEXT_NODE)
      ) {
        start = length + anchorOffset;
      }
      if (
        node === focusNode &&
        (focusOffset === 0 || node.nodeType === TEXT_NODE)
      ) {
        end = length + focusOffset;
      }
      if (node.nodeType === TEXT_NODE) {
        length += node.nodeValue.length;
      }
      next = node.firstChild;
      if (next === null) {
        break;
      }
      parentNode = node;
      node = next;
    }
    while (true) {
      if (node === outerNode) {
        break outer;
      }
      if (parentNode === anchorNode && ++indexWithinAnchor === anchorOffset) {
        start = length;
      }
      if (parentNode === focusNode && ++indexWithinFocus === focusOffset) {
        end = length;
      }
      next = node.nextSibling;
      if (next !== null) {
        break;
      }
      node = parentNode;
      parentNode = node.parentNode;
    }
    node = next;
  }

  if (start === -1 || end === -1) {
    return null;
  }

  return {
    start,
    end
  };
}

/**
 * 获取焦点在输入框内的位置
 * @param {string} outerNode Element
 */
export function getOffsets(outerNode) {
  const selection = window.getSelection && window.getSelection();

  // 在网页使用者点击一个加载完毕的新打开的页面之前，rangeCount的值是0。
  // 在使用者点击页面之后，rangeCount的值变为1，即使并没有可视的选区(selection)。
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;
  // 因为在火狐浏览器中档input type = 'number'不能正确的获取位置
  try {
    anchorNode.nodeType;
    focusNode.nodeType;
  } catch (e) {
    return null;
  }
  return getModernOffsetsFromPoints(
    outerNode,
    anchorNode,
    anchorOffset,
    focusNode,
    focusOffset
  );
}
