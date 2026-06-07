// Empty canvas stub for browser environment (native .node module can't be bundled)
export const createCanvas = () => ({
  getContext: () => ({}),
  toBuffer: () => Buffer.alloc(0),
  toDataURL: () => '',
});
export const createImageData = () => ({});
export const loadImage = () => Promise.resolve({});
export const registerFont = () => {};
export const deregisterAllFonts = () => {};
export default { createCanvas, createImageData, loadImage, registerFont, deregisterAllFonts };
