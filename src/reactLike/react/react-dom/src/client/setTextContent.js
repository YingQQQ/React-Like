/* eslint-disable no-param-reassign */
import { TEXT_NODE } from '../shared/HTMLNodeType';

/**
 * 利用textContent属性快速设置node元素的文本节点,这比使用nodeValue会快的多
 * 但是这会移除已存在的node元素,创建一个新的node
 * @param {Element} node DOM元素
 * @param {string} text 文本字符串
 */
export default function setTextContent(node, text) {
  if (text) {
    const firstChild = node.firstChild;
    if (firstChild && firstChild === node.lastChild && firstChild.nodeType === TEXT_NODE) {
      firstChild.nodeValue = text;
    }
  }
  node.textContent = text;
}
