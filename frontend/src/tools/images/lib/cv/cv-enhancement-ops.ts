import { round } from "@images/utils/math-utils";

export const histogramEqualization = (channel: number[]): number[] => {
  const histogram: number[] = new Array(256).fill(0);
  const N = channel.length;
  const equalized: number[] = new Array(256);

  channel.forEach((value) => {
    histogram[round(value)]++;
  });

  const cdf: number[] = new Array(256).fill(0);
  cdf[0] = histogram[0] / N;

  for (let i = 1; i < 256; i++) {
    cdf[i] = cdf[i - 1] + histogram[i] / N;
  }

  for (let i = 0; i < channel.length; i++) {
    equalized[i] = round(cdf[i] * 255);
  }

  return equalized;
};

export const matchHistogram = (
  channel: number[],
  target: number[],
  minIntensity = 0,
  maxIntensity = 255
): number[] => {
  const histogram: number[] = new Array(256).fill(0);
  const equalized: number[] = new Array(channel.length);

  channel.forEach((value) => {
    histogram[round(value)]++;
  });

  const cdf: number[] = new Array(256).fill(0);
  cdf[0] = histogram[0];

  let cdfMin = cdf[0];
  for (let i = 1; i < 256; i++) {
    cdf[i] = cdf[i - 1] + histogram[i];
    if (cdf[i] < cdfMin) cdfMin = cdf[i];
  }

  const scale = maxIntensity / (channel.length - cdfMin);

  for (let i = 0; i < channel.length; i++) {
    equalized[i] = round((cdf[round(channel[i])] - cdfMin) * scale);
  }

  const targetHistogram: number[] = new Array(256).fill(0);
  target.forEach((value) => {
    targetHistogram[round(value)]++;
  });

  const targetCdf: number[] = new Array(256).fill(0);
  targetCdf[0] = targetHistogram[0];

  let targetCdfMin = targetCdf[0];
  for (let i = 1; i < 256; i++) {
    targetCdf[i] = targetCdf[i - 1] + targetHistogram[i];
    if (targetCdf[i] < targetCdfMin) targetCdfMin = targetCdf[i];
  }

  const targetScale = maxIntensity / (target.length - targetCdfMin);

  const matched: number[] = new Array(channel.length);
  for (let i = 0; i < channel.length; i++) {
    matched[i] = round(
      (targetCdf[round(equalized[i])] - targetCdfMin) * targetScale
    );
  }

  return matched;
};
