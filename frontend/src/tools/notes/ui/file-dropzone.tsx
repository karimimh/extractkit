"use client";

import { cn } from "@notes/utils/css-utils";
import { type MouseEvent, type ReactNode, useRef, forwardRef, useImperativeHandle } from "react";

interface FileDropzoneProps {
  className?: string;
  disabled?: boolean;
  onFileSelected?: (f: File) => void;
  children?: ReactNode;
}

export interface FileDropzoneHandle {
  handleClick: () => void;
}

const FileDropzone = forwardRef<FileDropzoneHandle, FileDropzoneProps>(
  ({ className = "", disabled = false, onFileSelected, children }, ref) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClick = (event?: MouseEvent<HTMLButtonElement> | MouseEvent<HTMLDivElement>) => {
      if (event) {
        event.preventDefault();
      }
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    };

    useImperativeHandle(ref, () => ({
      handleClick,
    }));

    const handleFileChange = (files: FileList | null) => {
      if (files && files.length > 0) {
        const selectedFile = files[0];
        onFileSelected?.(selectedFile);
      }
    };

    return (
      <div className={cn("flex flex-col items-center justify-center", className)}>
        <input
          accept={".jpg, .jpeg, .png"}
          className="hidden"
          disabled={disabled}
          onChange={event => handleFileChange(event.target.files)}
          ref={fileInputRef}
          type="file"
        />
        <div
          className="flex h-full w-full cursor-pointer flex-col items-center justify-center"
          onClick={handleClick}
          onDragOver={event => {
            event.preventDefault();
          }}
          onDrop={event => {
            event.preventDefault();
            const files = event.dataTransfer.files;
            handleFileChange(files);
          }}
        >
          {children}
        </div>
      </div>
    );
  }
);

FileDropzone.displayName = "FileDropzone";

export default FileDropzone;
