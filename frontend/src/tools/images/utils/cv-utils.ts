export const arrayMin = (arr: number[]): number => {
  let min = arr[0];
  for (const val of arr) {
    if (val < min) {
      min = val;
    }
  }
  return min;
};

export const arrayMax = (arr: number[]): number => {
  let max = arr[0];
  for (const val of arr) {
    if (val > max) {
      max = val;
    }
  }
  return max;
};
