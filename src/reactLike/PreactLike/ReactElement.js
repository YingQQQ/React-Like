export default function createElement(nodeName, attributes, ...args) {
  console.log(...args);
  const children = args.length ? [].concat(...args) : null;
  return { nodeName, attributes, children };
}
