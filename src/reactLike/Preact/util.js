/* eslint-disable  no-param-reassign */
export const hasOwnProperty = Object.hasOwnProperty;

export function extend(obj, props) {
  const keys = Object.keys(props);
  keys.forEach((key) => {
    if (hasOwnProperty.call(props, key)) {
      obj[key] = props[key];
    }
  });

  return obj;
}

export const defer =
  typeof Promise === 'function'
    ? Promise.resolve().then.bind(Promise.resolve())
    : setTimeout;
