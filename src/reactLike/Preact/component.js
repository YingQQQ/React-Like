/* eslint-disable  no-underscore-dangle */
import { FORCE_RENDER } from './constants';
import { extend } from './util';
import { renderComponent } from './vdom/component';
import { enqueueRender } from './render-queue';

/**
 *  Component构造函数.
 * 提供 `setState()` 和`forceUpdate()`来触发渲染
 * @typedef {object} Component
 * @param {object} props 组件初始化属性
 * @param {object} context 组件中的context属性
 * @public
 *
 * @example
 * class MyFoo extends Component {
 *   render(props, state) {
 *     return <div />;
 *   }
 * }
 */

export default function Component(props, context) {
  this._dirty = true;
  /**
   * @public
   * @type {object}
   */
  this.context = context;
  /**
   * @public
   * @type {object}
   */
  this.props = props;

  /**
   * @public
   * @type {object}
   */
  this.state = this.state || {};

  this._renderCallback = [];
}
// 给构造函数加入方法和属性
extend(Component.prototype, {
  /**
   * 更新组件状态,并且重新渲染
   * @param {object} state 需要更新的属性
   * @param {() => void} callback 回调函数
   */
  setState(state, callback) {
    const s = this.state;
    if (!this.prevState) {
      this.prevState = extend({}, s);
    }
    extend(s, typeof state === 'function' ? state(s, this.props) : state);

    if (callback) {
      this._renderCallback.push(callback);
    }
    enqueueRender(this);
  },
  /**
   * 立刻同步渲染组件
   * @param {() => void} callback 渲染完成后的回调函数
   * @private
   */
  forceUpdate(callback) {
    if (callback) {
      this._renderCallback.push(callback);
    }
    renderComponent(this, FORCE_RENDER);
  },

  /**
   * 接受 `props` 和 `state`, 然后返回一个虚拟DOM树
   * element/component
   * @param {object} state 当前组件的状态
   * @param {object} context 组件的context对象,类似react的context,通信参数用的
   * @returns {import('./vnode').VNode | void}
   */
  render() {}
});
