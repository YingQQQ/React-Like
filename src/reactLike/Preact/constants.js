// 不渲染
export const NO_RENDER = 0;
// 同步渲染标记
export const SYNC_RENDER = 1;
// 强制渲染标记
export const FORCE_RENDER = 2;
// 异步渲染标记
export const ASYNC_RENDER = 3;

export const ATTR_KEY = '__precact__';

/** DOM不应该有"px",当有数字的时候 */
export const IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|ows|mnc|ntw|ine[ch]|zoo|^ord/i;
