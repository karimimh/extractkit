import { clamp } from "@images/utils/math-utils";

export const addImages = (
  img1: number[][][],
  img2: number[][][],
  minIntensity = 0,
  maxIntensity = 255
): number[][][] => {
  const result = img1.map((row, i) =>
    row.map((col, j) =>
      col.map((channel, k) =>
        clamp(channel + img2[i][j][k], minIntensity, maxIntensity)
      )
    )
  );
  return result;
};

export const subtractImages = (
  img1: number[][][],
  img2: number[][][],
  minIntensity = 0,
  maxIntensity = 255
): number[][][] => {
  const result = img1.map((row, i) =>
    row.map((col, j) =>
      col.map((channel, k) =>
        clamp(channel - img2[i][j][k], minIntensity, maxIntensity)
      )
    )
  );
  return result;
};

export const multiplyImage = (
  img: number[][][],
  factor: number,
  minIntensity = 0,
  maxIntensity = 255
): number[][][] => {
  const result = img.map((row) =>
    row.map((col) =>
      col.map((channel) => clamp(channel * factor, minIntensity, maxIntensity))
    )
  );
  return result;
};

export const multiplyImages = (
  img1: number[][][],
  img2: number[][][],
  minIntensity = 0,
  maxIntensity = 255
): number[][][] => {
  const result = img1.map((row, i) =>
    row.map((col, j) =>
      col.map((channel, k) =>
        clamp(channel * img2[i][j][k], minIntensity, maxIntensity)
      )
    )
  );
  return result;
};

export const divideImages = (
  img1: number[][][],
  img2: number[][][],
  minIntensity = 0,
  maxIntensity = 255
): number[][][] => {
  const result = img1.map((row, i) =>
    row.map((col, j) =>
      col.map((channel, k) => {
        if (img2[i][j][k] === 0) return minIntensity;
        return clamp(
          Math.round(channel / img2[i][j][k]),
          minIntensity,
          maxIntensity
        );
      })
    )
  );
  return result;
};
