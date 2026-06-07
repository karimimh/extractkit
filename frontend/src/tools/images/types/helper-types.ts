export type KeyValuePairs<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T];
