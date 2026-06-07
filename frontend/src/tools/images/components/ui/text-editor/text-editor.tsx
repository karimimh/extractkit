
import { Rect } from "@images/types/geometry-types";
import { cn } from "@images/utils/css-utils";
import { useEffect, useRef, useState } from "react";
import EditableDiv from "../editable-div";
import TextEditorToolbar from "./text-editor-toolbar";

interface TextEditorProps {
  className?: string;
  onContentChange?: (content: string) => void;
  frame: Rect;
  onFrameChange?: (frame: Rect) => void;
}

const TextEditor = ({
  className,
  onContentChange,
  frame: initialFrame,
  onFrameChange,
}: TextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  useEffect(() => {
    setFrame(initialFrame);
  }, [initialFrame]);

  useEffect(() => {
    const handleInput = () => {
      if (editorRef.current && onContentChange) {
        onContentChange(editorRef.current.innerHTML);
      }
    };

    const editor = editorRef.current;
    if (editor) {
      editor.addEventListener("input", handleInput);
    }

    return () => {
      if (editor) {
        editor.removeEventListener("input", handleInput);
      }
    };
  }, [onContentChange]);

  const handleCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  return (
    <EditableDiv
      boundingFrame={{
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      }}
      initialFrame={frame}
      onChange={(frame) => {
        setFrame(frame);
        onFrameChange?.(frame);
      }}
      className={cn("border border-dashed border-gray-500", className)}
    >
      <div
        ref={editorRef}
        contentEditable
        className="overflow-auto absolute left-0 top-0 w-full h-full focus:outline-none"
        suppressContentEditableWarning={true}
      >
        Type your text here...
      </div>
    </EditableDiv>
  );
};

export default TextEditor;
