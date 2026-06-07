import { cn } from "@images/utils/css-utils";
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
} from "lucide-react";
import { useState } from "react";
import Button from "../button";

interface TextEditorToolbarProps {
  onCommand: (command: string, value?: string) => void;
  className?: string;
}

const TextEditorToolbar = ({
  onCommand,
  className,
}: TextEditorToolbarProps) => {
  const [fontSize, setFontSize] = useState("16px");
  const [fontFamily, setFontFamily] = useState("Arial");

  return (
    <div className={cn("toolbar flex gap-2", className)}>
      <Button icon={BoldIcon} onClick={() => onCommand("bold")} />
      <Button icon={ItalicIcon} onClick={() => onCommand("italic")} />
      <Button icon={UnderlineIcon} onClick={() => onCommand("underline")} />
      <Button icon={AlignLeftIcon} onClick={() => onCommand("justifyLeft")} />
      <Button
        icon={AlignCenterIcon}
        onClick={() => onCommand("justifyCenter")}
      />
      <Button icon={AlignRightIcon} onClick={() => onCommand("justifyRight")} />
      <Button
        icon={AlignJustifyIcon}
        onClick={() => onCommand("justifyFull")}
      />
      <input
        type="color"
        onChange={(e) => onCommand("foreColor", e.target.value)}
        title="Text Color"
      />
      <input
        type="color"
        onChange={(e) => onCommand("hiliteColor", e.target.value)}
        title="Background Color"
      />
      <select
        value={fontSize}
        onChange={(e) => {
          setFontSize(e.target.value);
          onCommand("fontSize", e.target.value);
        }}
      >
        <option value="12px">12px</option>
        <option value="14px">14px</option>
        <option value="16px">16px</option>
        <option value="18px">18px</option>
        <option value="20px">20px</option>
      </select>
      <select
        value={fontFamily}
        onChange={(e) => {
          setFontFamily(e.target.value);
          onCommand("fontName", e.target.value);
        }}
      >
        <option value="Arial">Arial</option>
        <option value="Courier New">Courier New</option>
        <option value="Georgia">Georgia</option>
        <option value="Times New Roman">Times New Roman</option>
        <option value="Verdana">Verdana</option>
      </select>
    </div>
  );
};

export default TextEditorToolbar;
