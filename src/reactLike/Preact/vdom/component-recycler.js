/* eslint-disable  no-plusplus */
import { Component } from '../component';
/**
 * 组件池子,key是函数名, value是函数

 * @type {Object.<string, Component[]>}
 * @private
 */
const components = {};

/**
 * 在函数collectComponent中通过组件名(component.constructor.name)分类将可重用的组件缓存在缓存池中
 * @param {Component} component 
 */
export function collectComponent(component) {
  const name = component.constructor.name;
  (components[name] || (components[name] = [])).push(component);
}

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

  // 如果组件继承了Preact中的Component的话，
  // 在原型中一定存在render方法，这时候通过new创建Ctor的实例inst(实例中已经含有了你自定义的render函数)，
  // 但是如果没有给父级构造函数super传入props和context，那么inst中的props和context的属性为undefined,
  // 通过强制调用Component.call(inst, props, context)可以给inst中props、context进行初始化赋值。
  if (Ctor.prototype && Ctor.prototype.render) {
    inst = new Ctor(props, context);
    Component.call(inst, props, context);
  } else {
    // 如果组件中不存在render函数，说明该函数是PFC(Pure Function Component)类型，即是纯函数组件。
    // 这时直接调用函数Component创建实例，实例的constructor属性设置为传入的函数。
    // 由于实例中不存在render函数，则将doRender函数作为实例的render属性，
    // doRender函数会将Ctor的返回的虚拟dom作为结果返回。
    inst = new Component(props, context);
    inst.constructor = Ctor;
    inst.render = doRender;
  }

  // 然后我们从组件回收的共享池中那拿到同类型组件的实例，从其中取出该实例之前渲染的实例(nextBase)，
  // 然后将其赋值到我们的新创建组件实例的nextBase属性上，
  // 其目的就是为了能基于此DOM元素进行渲染，以更少的代价进行相关的渲染。
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
