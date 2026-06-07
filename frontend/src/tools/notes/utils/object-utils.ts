export function getValueByKey<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

export function setObjectProperty<T, K extends keyof T>(obj: T, key: K, newValue: T[K]): T {
  obj[key] = newValue;
  return obj;
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastCallTime: number | null = null;

  return (...args: Parameters<T>): void => {
    const now = Date.now();

    if (lastCallTime && now - lastCallTime < wait) {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        lastCallTime = now;
        func(...args);
      }, wait - (now - lastCallTime));
    } else {
      if (timeout) clearTimeout(timeout);
      lastCallTime = now;
      func(...args);
    }
  };
}

export function generateId(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export function deepCopy(x: object) {
  return JSON.parse(JSON.stringify(x));
}
