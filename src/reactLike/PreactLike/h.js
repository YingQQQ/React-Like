/* eslint-disable  no-plusplus */
/* eslint-disable  prefer-rest-params */
/* eslint-disable  no-param-reassign */

import VNode from './vnode';
import options from './options';

/**
 *
 * Note: 导出`h()` and `createElement()`只是为了兼容性考虑
 *
 * 创造一个VNode作为虚拟DOM. 一个VNodes可以构建轻量级的DOM树来使用,这个DOM树可以通过和当前阶段的
 * current _actual_ DOM比较从而发现区别.
 * `h()`/`createElement()` 接受一个标签元素, 一组属性,
 * 还有可选的子代添加到元素.
 *
 * @例如1
 *
 * `<div id="foo" name="bar">Hello!</div>`
 *
 * 能被函数接受成:
 *
 * `h('div', { id: 'foo', name : 'bar' }, 'Hello!');`
 * @例如2
 *  <div id="foo">Hello Preact!</div>
 *
 *  h('div', { id: 'foo' }, 'Hello', null, ['Preact!']);
 * @例如3
 *  <div id="foo"><span>Hello!</span></div>
 *
 *  h( 'div', { id: 'foo' }, h('span', null, 'Hello!'));
 * @例如4
 * jsx
 * class App extends Component{ **** }
 * class Child extends Component{ **** }
 * const Element = <App><Child>Hello World!</Child></App>
 * 
 * js
 * const Element = h(
 *  App,
 *  null,
 *  h(
 *    Child,
 *    null,
 *    "Hello World!"
 *  )
 * );
 * @returns
 *{
 *   nodeName: ƒ App(argument), 
 *   children: [
 *       {
 *           nodeName: ƒ Child(argument),
 *           children: ["Hello World!"],
 *           attributes: undefined,
 *           key: undefined
 *       }
 *   ], 
 *   attributes: undefined,
 *   key: undefined
 *}
 * @param {string | function} nodeName 一个元素名称. Ex: `div`, `a`, `span`, etc.
 * @param {object | null} attributes 任何元素能够创建的属性.
 * @param {VNode[]} [rest] 额外能被添加的子组件. 可以被无限的嵌套.
 *
 * @public
 */

const stack = [];
const EMPTY_CHILDREN = [];

export default function h(nodeName, attributes) {
  let children = EMPTY_CHILDREN;
  let i;
  let child;
  let simple;
  let lastSimple;
  // i--: 先比较大小之后再--,和--i不同的是--i是先运行--再比较
  // 当参数大于2时,则是把多余的参数推入stack
  for (i = arguments.length; i-- > 2;) {
    stack.push(arguments[i]);
  }
  // 如果属性中有子组件的存在则继续推入栈(stack)
  if (attributes && attributes.children != null) {
    if (!stack.length) {
      stack.push(attributes.children);
    }
    delete attributes.children;
  }
  while (stack.length) {
    // 获取stack的元素,例2中的['Preact!'],并判断是不是数组
    child = stack.pop();
    if (child.pop !== undefined) {
      for (i = child.length; i--;) {
        stack.push(child[i]);
      }
    } else {
      if (typeof child === 'boolean') {
        child = null;
      }
      // 嵌套的组件 nodeName是func
      simple = typeof nodeName !== 'function';
      // 如果nodeName是不是函数, nodeName = 'div'
      if (simple) {
        if (child == null) {
          child = '';
        } else if (typeof child === 'number') {
          // 数字则转成字符串10 ===>'10'
          child = String(child);
        } else if (typeof child !== 'string') {
          // 例如 child:Undefined
          simple = false;
        }
      }
      if (simple && lastSimple) {
        // 拼接字符串,例2中的 Hello Preact!
        children[children.length - 1] += child;
      } else if (children === EMPTY_CHILDREN) {
        children = [child];
      } else {
        children.push(child);
      }
    }
    lastSimple = simple;
  }
  const p = new VNode();
  p.nodeName = nodeName;
  p.children = children;
  p.attributes = attributes == null ? undefined : attributes;
  p.key = attributes == null ? undefined : attributes.key;

  if (options.vnode !== undefined) {
    options.vnode(p);
  }
  return p;
}
