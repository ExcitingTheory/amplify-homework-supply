/**
 * Stub for onnxruntime-node in browser bundles.
 * Turbopack resolves this instead of the real native addon
 * which cannot run in the browser.
 */
export const listSupportedBackends = () => [];
export const InferenceSession = {};
export const Tensor = {};
export default {};
