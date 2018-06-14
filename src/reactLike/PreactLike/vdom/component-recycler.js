/* eslint-disable  no-plusplus */
import { Component } from '../component';
/**
 * 组件池子,key是函数名, value是函数

 * @type {Object.<string, Component[]>}
 * @private
 */
const components = {};

export function collectComponent(component) {}

/** The `.render()` method for a PFC backing instance. */
function doRender(props, state, context) {
  return this.constructor(props, context);
}
/**
 * 创建一个组件
 * Components.
 * @param {function} Ctor Component构造函数
 * @param {object} props  component属性
 * @param {object} context The initial context of the component
 * @returns {import('../component').Component}
 */
export function createComponent(Ctor, props, context) {
  const list = components[Ctor.name];
  let inst;

  // 如果是继承的类则实例化类,并且改变this的指向
  if (Ctor.prototype && Ctor.prototype.render) {
    inst = new Ctor(props, context);
    Component.call(inst, props, context);
  } else {
    inst = new Component(props, context);
    inst.constructor = Ctor;
    inst.render = doRender;
  }

  if (list) {
    for (let i = list.length; i--;) {
      // 如果是实例化组件
      if (list[i].constructor === Ctor) {
        inst.nextBase = list[i].nextBase;
        list.splice(i, 1);
        break;
      }
    }
  }
  return inst;
}
