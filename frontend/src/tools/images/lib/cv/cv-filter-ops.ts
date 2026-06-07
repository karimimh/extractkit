import { clamp } from "@images/utils/math-utils";

export const convolveImage = (
  img: number[][][],
  kernel: number[][],
  minIntensity = 0,
  maxIntensity = 255
): number[][][] => {
  const result = img.map((row, i) =>
    row.map((col, j) =>
      col.map((channel, k) => {
        let sum = 0;
        for (let m = 0; m < kernel.length; m++) {
          for (let n = 0; n < kernel[m].length; n++) {
            const ii = i + m - Math.floor(kernel.length / 2);
            const jj = j + n - Math.floor(kernel[m].length / 2);
            if (ii >= 0 && ii < img.length && jj >= 0 && jj < row.length) {
              sum += img[ii][jj][k] * kernel[m][n];
            }
          }
        }
        return clamp(sum, minIntensity, maxIntensity);
      })
    )
  );
  return result;
};

export const correlateImage = (
  img: number[][][],
  kernel: number[][],
  minIntensity = 0,
  maxIntensity = 255
): number[][][] => {
  const result = img.map((row, i) =>
    row.map((col, j) =>
      col.map((channel, k) => {
        let sum = 0;
        for (let m = 0; m < kernel.length; m++) {
          for (let n = 0; n < kernel[m].length; n++) {
            const ii = i + m - Math.floor(kernel.length / 2);
            const jj = j + n - Math.floor(kernel[m].length / 2);
            if (ii >= 0 && ii < img.length && jj >= 0 && jj < row.length) {
              sum += img[ii][jj][k] * kernel[m][n];
            }
          }
        }
        return clamp(sum, minIntensity, maxIntensity);
      })
    )
  );
  return result;
};

export const applyMeanFilter = (
  img: number[][][],
  size: number,
  minIntensity = 0,
  maxIntensity = 255
): number[][][] => {
  const kernel = Array(size)
    .fill(0)
    .map(() => Array(size).fill(1 / (size * size)));
  return convolveImage(img, kernel, minIntensity, maxIntensity);
};

export const applyGaussianFilter = (
  img: number[][][],
  size: number,
  sigma: number,
  minIntensity = 0,
  maxIntensity = 255
): number[][][] => {
  const kernel = Array(size)
    .fill(0)
    .map((_, i) =>
      Array(size)
        .fill(0)
        .map((_, j) => {
          const x = i - Math.floor(size / 2);
          const y = j - Math.floor(size / 2);
          return (
            (1 / (2 * Math.PI * sigma * sigma)) *
            Math.exp(-(x * x + y * y) / (2 * sigma * sigma))
          );
        })
    );
  return convolveImage(img, kernel, minIntensity, maxIntensity);
};
