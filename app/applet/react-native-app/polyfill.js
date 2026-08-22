// Polyfills for Firebase Web SDK in React Native
if (typeof global !== "undefined") {
  if (!global.self || typeof global.self !== "object") { global.self = global; }
  if (!global.window || typeof global.window !== "object") { global.window = global; }
  if (!global.document || typeof global.document !== "object") { global.document = { cookie: "" }; }
  if (!global.navigator || typeof global.navigator !== "object") { global.navigator = { product: "ReactNative" }; }
  if (!global.location || typeof global.location !== "object") { global.location = { href: "" }; }
}

if (typeof globalThis !== 'undefined') {
  if (!globalThis.crypto) {
    (globalThis as any).crypto = {};
  }
  if (typeof (globalThis as any).crypto.getRandomValues !== 'function') {
    (globalThis as any).crypto.getRandomValues = function (array: any) {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    };
  }
}
