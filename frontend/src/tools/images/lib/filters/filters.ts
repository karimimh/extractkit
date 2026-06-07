import { Filter } from "@images/types/filter-types";
import { fileToDataUrl } from "@images/utils/image-utils";

export const applyFilter = (
  filter: Filter,
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number
) => {
  let imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  switch (filter.type) {
    case "hdr":
      imageData = applyHdr(imageData);
      break;
    case "sepia":
      imageData = applySepia(imageData);
      break;
    case "emboss":
      imageData = applyEmboss(imageData);
      break;
    case "pixelate":
      imageData = applyPixelate(imageData, filter.pixelSize);
      break;
    case "blur":
      imageData = applyBlur(imageData, filter.radius);
      break;
    case "edge-detection":
      imageData = applyEdgeDetection(imageData);
      break;
    case "posterize":
      imageData = applyPosterize(imageData, filter.levels);
      break;
    case "vignette":
      imageData = applyVignette(imageData, filter.radius, filter.strength);
      break;
    case "mosaic":
      imageData = applyMosaic(imageData, filter.blockSize);
      break;
    case "halftone":
      imageData = applyHalftone(imageData, filter.dotSize);
      break;
    case "glitch":
      imageData = applyGlitch(imageData, filter.intensity);
      break;
    case "kaleidoscope":
      imageData = applyKaleidoscope(imageData, filter.slices);
      break;
    case "CRT":
      imageData = applyCrt(imageData);
      break;
    case "rainbow-shift":
      imageData = applyRainbowShift(imageData, filter.frequency);
      break;
    case "swirl":
      imageData = applySwirl(
        imageData,
        filter.centerX,
        filter.centerY,
        filter.radius,
        filter.angle
      );
      break;
    default:
      break;
  }
  ctx.putImageData(imageData, 0, 0);
};

export const filterImageSrc = async (filter: Filter, imageSrc: string): Promise<string> => {
  const img = new Image();

  const filteredData = await new Promise<string>((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return reject("Could not get canvas context");
      }
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      applyFilter(filter, ctx, img.width, img.height);
      canvas.toBlob(async blob => {
        if (blob) {
          const convertedFile = new File([blob], filter.type, {
            type: "image/png",
          });
          const filteredData = await fileToDataUrl(convertedFile);
          resolve(filteredData);
        } else {
          reject("Blob creation failed");
        }
      }, "image/png");
    };

    img.onerror = () => {
      reject("Image loading failed");
    };

    img.src = imageSrc;
  });

  return filteredData;
};

const applyHdr = (imageData: ImageData) => {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    // Apply HDR effect by boosting contrast and details
    data[i] = Math.pow(data[i], 1.1); // Red
    data[i + 1] = Math.pow(data[i + 1], 1.1); // Green
    data[i + 2] = Math.pow(data[i + 2], 1.1); // Blue
  }
  return imageData;
};

const applySepia = (imageData: ImageData) => {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    data[i] = Math.min(0.393 * r + 0.769 * g + 0.189 * b, 255); // Red
    data[i + 1] = Math.min(0.349 * r + 0.686 * g + 0.168 * b, 255); // Green
    data[i + 2] = Math.min(0.272 * r + 0.534 * g + 0.131 * b, 255); // Blue
  }
  return imageData;
};

const applyEmboss = (imageData: ImageData) => {
  const width = imageData.width;
  const data = imageData.data;
  const output = new Uint8ClampedArray(data.length);

  for (let i = 0; i < data.length; i += 4) {
    const prevIndex = i - 4;
    const nextIndex = i + 4;
    const topIndex = i - width * 4;
    const bottomIndex = i + width * 4;

    if (prevIndex >= 0 && topIndex >= 0 && nextIndex < data.length && bottomIndex < data.length) {
      const r = data[i] - data[prevIndex];
      const g = data[i + 1] - data[topIndex + 1];
      const b = data[i + 2] - data[bottomIndex + 2];

      const gray = r + g + b;

      output[i] = 128 + gray; // Red
      output[i + 1] = 128 + gray; // Green
      output[i + 2] = 128 + gray; // Blue
      output[i + 3] = data[i + 3]; // Alpha
    } else {
      output[i] = data[i];
      output[i + 1] = data[i + 1];
      output[i + 2] = data[i + 2];
      output[i + 3] = data[i + 3];
    }
  }

  imageData.data.set(output);
  return imageData;
};

const applyPixelate = (imageData: ImageData, pixelSize: number = 10) => {
  const { width, height } = imageData;
  const data = imageData.data;

  for (let y = 0; y < height; y += pixelSize) {
    for (let x = 0; x < width; x += pixelSize) {
      const i = (y * width + x) * 4;
      const color = [0, 0, 0];

      for (let dy = 0; dy < pixelSize; dy++) {
        for (let dx = 0; dx < pixelSize; dx++) {
          const j = ((y + dy) * width + (x + dx)) * 4;
          if (j < data.length) {
            color[0] += data[j];
            color[1] += data[j + 1];
            color[2] += data[j + 2];
          }
        }
      }

      const pixelCount = pixelSize * pixelSize;
      color[0] = color[0] / pixelCount;
      color[1] = color[1] / pixelCount;
      color[2] = color[2] / pixelCount;

      for (let dy = 0; dy < pixelSize; dy++) {
        for (let dx = 0; dx < pixelSize; dx++) {
          const j = ((y + dy) * width + (x + dx)) * 4;
          if (j < data.length) {
            data[j] = color[0];
            data[j + 1] = color[1];
            data[j + 2] = color[2];
          }
        }
      }
    }
  }

  return imageData;
};

const applyBlur = (imageData: ImageData, radius: number = 2) => {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const output = new Uint8ClampedArray(data.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0,
        count = 0;

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;

          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const i = (ny * width + nx) * 4;
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
          }
        }
      }

      const i = (y * width + x) * 4;
      output[i] = r / count; // Red
      output[i + 1] = g / count; // Green
      output[i + 2] = b / count; // Blue
      output[i + 3] = data[i + 3]; // Alpha
    }
  }

  imageData.data.set(output);
  return imageData;
};

const applyEdgeDetection = (imageData: ImageData) => {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const output = new Uint8ClampedArray(data.length);

  const getGrayValue = (i: number) => {
    return 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;

      if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
        const gx = getGrayValue(i + 4) - getGrayValue(i - 4);
        const gy = getGrayValue(i + width * 4) - getGrayValue(i - width * 4);

        const magnitude = Math.sqrt(gx * gx + gy * gy);

        output[i] = output[i + 1] = output[i + 2] = magnitude > 128 ? 255 : 0;
        output[i + 3] = data[i + 3];
      } else {
        output[i] = data[i];
        output[i + 1] = data[i + 1];
        output[i + 2] = data[i + 2];
        output[i + 3] = data[i + 3];
      }
    }
  }

  imageData.data.set(output);
  return imageData;
};

const applyPosterize = (imageData: ImageData, levels: number = 5) => {
  const data = imageData.data;
  const factor = 255 / (levels - 1);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(data[i] / factor) * factor; // Red
    data[i + 1] = Math.round(data[i + 1] / factor) * factor; // Green
    data[i + 2] = Math.round(data[i + 2] / factor) * factor; // Blue
  }

  return imageData;
};

const applyVignette = (imageData: ImageData, _radius: number = 0.5, strength: number = 0.5) => {
  const { width, height } = imageData;
  const radius = (_radius * Math.sqrt(width * width + height * height)) / 2;
  const data = imageData.data;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      const factor = 1 - Math.pow(distance / maxDistance, radius) * strength;

      data[i] *= factor; // Red
      data[i + 1] *= factor; // Green
      data[i + 2] *= factor; // Blue
    }
  }

  return imageData;
};

const applyMosaic = (imageData: ImageData, blockSize: number = 10) => {
  const { width, height } = imageData;
  const data = imageData.data;

  for (let y = 0; y < height; y += blockSize) {
    for (let x = 0; x < width; x += blockSize) {
      const i = (y * width + x) * 4;
      const color = [0, 0, 0, 0];

      for (let dy = 0; dy < blockSize; dy++) {
        for (let dx = 0; dx < blockSize; dx++) {
          const j = ((y + dy) * width + (x + dx)) * 4;
          if (j < data.length) {
            color[0] += data[j];
            color[1] += data[j + 1];
            color[2] += data[j + 2];
            color[3] += data[j + 3];
          }
        }
      }

      const pixelCount = blockSize * blockSize;
      color[0] /= pixelCount;
      color[1] /= pixelCount;
      color[2] /= pixelCount;
      color[3] /= pixelCount;

      for (let dy = 0; dy < blockSize; dy++) {
        for (let dx = 0; dx < blockSize; dx++) {
          const j = ((y + dy) * width + (x + dx)) * 4;
          if (j < data.length) {
            data[j] = color[0];
            data[j + 1] = color[1];
            data[j + 2] = color[2];
            data[j + 3] = color[3];
          }
        }
      }
    }
  }

  return imageData;
};

const applyHalftone = (imageData: ImageData, dotSize: number = 5) => {
  const { width, height } = imageData;
  const data = imageData.data;

  for (let y = 0; y < height; y += dotSize) {
    for (let x = 0; x < width; x += dotSize) {
      const i = (y * width + x) * 4;
      const gray = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
      const radius = (gray / 255) * (dotSize / 2);

      for (let dy = 0; dy < dotSize; dy++) {
        for (let dx = 0; dx < dotSize; dx++) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          const j = ((y + dy) * width + (x + dx)) * 4;

          if (distance <= radius) {
            data[j] = 0;
            data[j + 1] = 0;
            data[j + 2] = 0;
          } else {
            data[j] = 255;
            data[j + 1] = 255;
            data[j + 2] = 255;
          }
        }
      }
    }
  }

  return imageData;
};

const applyGlitch = (imageData: ImageData, intensity: number = 5) => {
  const { width, height } = imageData;
  const data = imageData.data;

  for (let y = 0; y < height; y++) {
    const offset = Math.floor(Math.random() * intensity) * 4;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const j = ((y * width + (x + offset)) % (width * height)) * 4;

      data[i] = data[j];
      data[i + 1] = data[j + 1];
      data[i + 2] = data[j + 2];
    }
  }

  return imageData;
};

const applyKaleidoscope = (imageData: ImageData, slices: number = 6) => {
  const { width, height } = imageData;
  const data = imageData.data;
  const output = new Uint8ClampedArray(data.length);
  const centerX = width / 2;
  const centerY = height / 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const angle = Math.atan2(y - centerY, x - centerX);
      const radius = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));

      const mirrorAngle =
        Math.floor(angle / ((Math.PI * 2) / slices)) % 2 === 0 ? angle : Math.PI - angle;

      const nx = centerX + Math.cos(mirrorAngle) * radius;
      const ny = centerY + Math.sin(mirrorAngle) * radius;

      const srcX = Math.floor(nx);
      const srcY = Math.floor(ny);

      if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
        const srcIndex = (srcY * width + srcX) * 4;
        const destIndex = (y * width + x) * 4;

        output[destIndex] = data[srcIndex];
        output[destIndex + 1] = data[srcIndex + 1];
        output[destIndex + 2] = data[srcIndex + 2];
        output[destIndex + 3] = data[srcIndex + 3];
      }
    }
  }

  imageData.data.set(output);
  return imageData;
};

const applyCrt = (imageData: ImageData) => {
  const { width, height } = imageData;
  const data = imageData.data;
  const lineHeight = 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (y % lineHeight === 0) {
        data[i] *= 0.7; // Red
        data[i + 1] *= 0.7; // Green
        data[i + 2] *= 0.7; // Blue
      }

      if (x % 3 === 0) {
        data[i] *= 1.2; // Red (slight chromatic aberration)
      } else if (x % 3 === 1) {
        data[i + 1] *= 1.2; // Green
      } else {
        data[i + 2] *= 1.2; // Blue
      }
    }
  }

  return imageData;
};

const applyRainbowShift = (imageData: ImageData, frequency: number = 0.1) => {
  const { width, height } = imageData;
  const data = imageData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const shift = Math.sin((x + y) * frequency) * 127 + 128;

      data[i] = (data[i] + shift) % 256; // Red
      data[i + 1] = (data[i + 1] + shift) % 256; // Green
      data[i + 2] = (data[i + 2] + shift) % 256; // Blue
    }
  }

  return imageData;
};

const applySwirl = (
  imageData: ImageData,
  _centerX: number,
  _centerY: number,
  _radius: number,
  angle: number
) => {
  const { width, height } = imageData;
  const data = imageData.data;
  const output = new Uint8ClampedArray(data.length);
  const centerX = _centerX * width;
  const centerY = _centerY * height;
  const radius = _radius * Math.min(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < radius) {
        const theta = Math.atan2(dy, dx) + ((radius - distance) / radius) * angle;
        const nx = centerX + Math.cos(theta) * distance;
        const ny = centerY + Math.sin(theta) * distance;

        const srcX = Math.floor(nx);
        const srcY = Math.floor(ny);

        if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
          const srcIndex = (srcY * width + srcX) * 4;
          const destIndex = (y * width + x) * 4;

          output[destIndex] = data[srcIndex];
          output[destIndex + 1] = data[srcIndex + 1];
          output[destIndex + 2] = data[srcIndex + 2];
          output[destIndex + 3] = data[srcIndex + 3];
        }
      } else {
        const i = (y * width + x) * 4;
        output[i] = data[i];
        output[i + 1] = data[i + 1];
        output[i + 2] = data[i + 2];
        output[i + 3] = data[i + 3];
      }
    }
  }

  imageData.data.set(output);
  return imageData;
};
