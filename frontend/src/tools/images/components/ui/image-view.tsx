import { cn } from "@images/utils/css-utils";
import { ImageIcon, PlusIcon, RefreshCw, SeparatorVertical } from "lucide-react";
import { MouseEvent, useEffect, useRef, useState } from "react";
import Card from "./card";

interface ImageViewProps {
  enableFilePicker?: boolean;
  className?: string;
  file?: File | null;
  onFileChange?: (file?: File | null) => void;
  isLoading?: boolean;
  onTogglePressed?: () => void;
}

export default function ImageView({
  enableFilePicker = false,
  className,
  file,
  onFileChange,
  isLoading = false,
  onTogglePressed,
}: ImageViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);

  const handleAdd = (event: MouseEvent<HTMLButtonElement> | MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemove = (event: MouseEvent<HTMLButtonElement> | MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onFileChange && onFileChange(undefined);
  };

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      const selectedFile = files[0];
      onFileChange && onFileChange(selectedFile);
    }
  };

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        if (e.target && typeof e.target.result === "string") {
          setImageData(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setImageData(null);
    }
  }, [file]);

  return (
    <Card className={cn("flex flex-col items-end gap-2 px-2 select-none", className)}>
      {enableFilePicker && (
        <div className="flex flex-row-reverse justify-between items-center w-full px-2 pt-1">
          <button
            className={cn(
              "h-6 w-6 rounded-full transition-transform",
              file
                ? "rotate-45 text-red-600 hover:text-red-800"
                : "text-green-600 hover:text-green-800"
            )}
            onClick={file ? handleRemove : handleAdd}
            title={file ? "remove file" : "add file"}
          >
            <PlusIcon className="inline h-5 w-5" />
          </button>
          <div className="w-6 h-6">
            {isLoading && <RefreshCw className="text-blue-600 w-5 h-5 mt-1 animate-spin" />}
          </div>
          <div className="w-6 h-6">
            {onTogglePressed && (
              <SeparatorVertical
                className="w-5 h-5 mt-1 text-black active:text-blue-600"
                onMouseDownCapture={onTogglePressed}
                onMouseUpCapture={onTogglePressed}
              />
            )}
          </div>
          <input
            accept={".jpg, .jpeg, .png"}
            className="hidden"
            onChange={event => handleFileChange(event.target.files)}
            ref={fileInputRef}
            type="file"
          />
        </div>
      )}

      <div
        className={cn(
          !file ? "hidden" : "",
          "relative aspect-square w-full flex-col items-center justify-center overflow-clip md:flex"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {file ? (
          <>
            <img
              alt={"user chosen image"}
              className={cn(
                "w-full h-full",
                isHovered
                  ? "h-[-webkit-fill-available] object-cover object-center"
                  : "h-[-webkit-fill-available] object-cover object-center"
              )}
              src={imageData ?? "/white-square.png"}
            />
            {/* {isHovered && (
              <div className="ltr absolute bottom-0 m-0 h-10 w-full truncate bg-[rgba(244,239,235)] p-2 text-center text-sm font-bold">
                {file.name}
              </div>
            )} */}
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-2">
            <div
              className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-md border-2 border-dashed border-gray-400 p-4 text-gray-400"
              onClick={file ? handleRemove : handleAdd}
              onDragOver={event => {
                event.preventDefault();
              }}
              onDrop={event => {
                event.preventDefault();
                const files = event.dataTransfer.files;
                handleFileChange(files);
              }}
            >
              <ImageIcon className="h-[8rem] w-[8rem]" />
            </div>
          </div>
        )}
        {isLoading && (
          <div className=" absolute w-full h-full left-0 top-0 bg-[rgba(0,0,0,0.1)] flex items-center justify-center"></div>
        )}
      </div>
    </Card>
  );
}
