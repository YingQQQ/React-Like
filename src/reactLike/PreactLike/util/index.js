export const hasSymbol = typeof Symbol === 'function' && Symbol.for;
export const hasOwnProperty = Object.prototype.hasOwnProperty;
export const toString = Object.prototype.toString;
export const others = Object.prototype.hasOwnProperty;

export const REACT_ELEMENT_TYPE = hasSymbol
  ? Symbol.for('react.element')
  : 0xeac7;

const numberMap = {
  '[object Boolean]': 2,
  '[object Number]': 3,
  '[object String]': 4,
  '[object Function]': 5,
  '[object Symbol]': 6,
  '[object Array]': 7
};

// undefined: 0, null: 1, boolean:2, number: 3, string: 4, function: 5, symbol:6, array: 7, object:8
// 判断传入的type类型
export function typeNumber(data) {
  if (data === null) {
    return 1;
  }
  // eslint-disable-next-line no-void
  if (data === void 0) {
    return 0;
  }
  const type = numberMap[toString.call(data)];

  return type || 8;
}
