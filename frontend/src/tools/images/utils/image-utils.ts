import { Rect } from "@images/types/geometry-types";

export function createImagePreview(
  src: string,
  maxWidth: number,
  maxHeight: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Calculate the new dimensions while maintaining the aspect ratio
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Convert the canvas to a data URL
      const dataUrl = canvas.toDataURL("image/png");
      canvas.remove();
      resolve(dataUrl);
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };
  });
}

export function dataUrlToFile(dataUrl: string, filename: string): File {
  // Extract the base64 encoded string from the data URL
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  // Convert the binary string into a Uint8Array
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  // Create a File object from the Uint8Array
  return new File([u8arr], filename, { type: mime });
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result as string);
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsDataURL(file);
  });
}

export const fetchFile = async () => {
  const response = await fetch("/example.txt"); // Fetching from public folder
  const blob = await response.blob();
  const file = new File([blob], "example.txt", { type: blob.type });
  return file;
};

export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

export const detectObjects = (
  dataUrl: string
): Promise<
  {
    label: string;
    score: number;
    box: Rect;
  }[]
> => {
  return new Promise(async (resolve, reject) => {
    const blob = await (await fetch(dataUrl)).blob();
    const formData = new FormData();
    formData.append("image", blob, "image.jpg");

    try {
      const apiBase =
        (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(
          /\/$/,
          ""
        ) || "http://127.0.0.1:8000";
      const response = await fetch(`${apiBase}/api/images/detect/`, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      resolve(result.objects);
    } catch (error) {
      // reject(`Error detecting objects: ${error}`);
      resolve([]);
    }
  });
};
