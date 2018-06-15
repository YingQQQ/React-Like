/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
import options from './options';
import { defer } from './util';
import { renderComponent } from './vdom/component';

// 需要异步渲染的队列
const items = [];
/**
 * rerender函数就是将items中待更新的组件，逐个取出，并对其执行renderComponent。
 * 其实renderComponent的opt参数不传入ASYNC_RENDER,而是传入undefined两者之间并无区别。
 * if (initialBase || opts===SYNC_RENDER) { base = diff(//...;}
 */
export function rerender() {
  const list = items;
  let p = list.pop();
  while (p) {
    if (p._dirty) {
      renderComponent(p);
    }
    p = list.pop();
  }
}

export function enqueueRender(component) {
  if (!component._dirty && items.push(component) === 1) {
    component._dirty = true;
    (options.debounceRendering || defer)(rerender);
  }
}
