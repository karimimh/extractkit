import { getColorFormats } from "@images/utils/color-conversion-utils";
import { generateColorWithOpacity } from "@images/utils/color-utils";
import { cn } from "@images/utils/css-utils";
import { Ban, Bookmark, Grid3X3, LifeBuoy, Pipette } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Button from "../button";
import Slider from "../slider/slider";
import BookmarkedCokors from "./bookmarked-colors";
import ColorInput from "./color-input";
import EyedropColorPicker from "./eyedrop-color-picker";
import HSBColorPicker from "./hsb-color-picker";
import NamedWebColors from "./named-web-colors";

interface ColorPickerProps {
  value?: string;
  onChange?: (color?: string) => void;
}

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [selectedTab, setSelectedTab] = useState<
    "favorites" | "web-colors" | "hsl-wheel" | "eyedrop"
  >("favorites");
  const [color, setColor] = useState(getColorFormats(value).hex);
  const [opacity, setOpacity] = useState(100);
  const [leadingOption, setLeadingOption] = useState<"hex" | "rgb" | "hsl">(
    "hex"
  );
  const handleColorChange = (newColor?: string) => {
    setColor(newColor);
    onChange?.(generateColorWithOpacity(newColor, opacity));
  };
  const [colorFormats, setColorFormats] = useState(
    getColorFormats(color, opacity)
  );
  const [bookmarkedColors, setBookmarkedColors] = useState<string[]>(() => {
    const colors = localStorage.getItem("bookmarkedColors");
    if (!colors) return [];
    const typedColors: string[] = JSON.parse(colors);
    return typedColors;
  });

  const saveBookmarkedColors = useCallback((colors: string[]) => {
    localStorage.setItem("bookmarkedColors", JSON.stringify(colors));
    setBookmarkedColors(colors);
  }, []);

  useEffect(() => {
    setColorFormats(getColorFormats(color, opacity));
  }, [color, opacity]);

  return (
    <div className="relative flex flex-row rounded w-80 h-80 bg-white">
      <div className="h-full w-8 border-r rounded-l-md flex flex-col items-center justify-normal">
        <Button
          className={cn(
            "p-1 border-b w-full aspect-square flex items-center justify-center rounded-tl",
            selectedTab === "favorites" && "bg-slate-100"
          )}
          icon={Bookmark}
          iconSize="4"
          onClick={() => setSelectedTab("favorites")}
        />
        <Button
          className={cn(
            "p-1 border-b w-full aspect-square flex items-center justify-center",
            selectedTab === "web-colors" && "bg-slate-100"
          )}
          icon={Grid3X3}
          iconSize="4"
          onClick={() => setSelectedTab("web-colors")}
        />
        <Button
          className={cn(
            "p-1 border-b w-full aspect-square flex items-center justify-center",
            selectedTab === "hsl-wheel" && "bg-slate-100"
          )}
          icon={LifeBuoy}
          iconSize="4"
          onClick={() => setSelectedTab("hsl-wheel")}
        />
        <Button
          className={cn(
            "p-1 border-b w-full aspect-square flex items-center justify-center",
            selectedTab === "eyedrop" && "bg-slate-100"
          )}
          icon={Pipette}
          iconSize="4"
          onClick={() => setSelectedTab("eyedrop")}
        />
      </div>
      {selectedTab === "web-colors" && (
        <div className="flex-1 p-2">
          <NamedWebColors
            className=""
            onColorClick={handleColorChange}
            currentColor={colorFormats.hex}
          />
        </div>
      )}

      {selectedTab === "hsl-wheel" && (
        <div className="flex-1 p-2 flex flex-col items-center justify-stretch px-8">
          <div className="w-full">
            <HSBColorPicker
              className="w-full h-full"
              onChange={handleColorChange}
              currentColor={colorFormats.hsl}
            />
          </div>
        </div>
      )}
      {selectedTab === "eyedrop" && (
        <EyedropColorPicker
          onChange={handleColorChange}
          onCancel={() => setSelectedTab("favorites")}
        />
      )}
      {selectedTab === "favorites" && (
        <div className="flex-1 p-2">
          <BookmarkedCokors
            className=""
            bookmarkedColors={bookmarkedColors}
            onColorClick={(c) => {
              const withoutOpacity = c?.slice(0, 7);
              const op = c?.slice(7);
              if (op === undefined) return;
              handleColorChange(withoutOpacity);
              setOpacity(Math.round(parseInt(op, 16) / 2.55));
            }}
            currentColor={colorFormats.hex}
          />
        </div>
      )}
      <div className="absolute bottom-0 left-8 right-0 h-16 border-t bg-white rounded-b shadow-[0_-1px_1px_#aaa2] p-1 gap-1 flex flex-row items-center justify-between">
        <div className="h-full w-14 flex flex-col items-center justify-center relative py-1">
          <div
            className="size-8 border rounded-full flex justify-center items-center"
            style={{
              backgroundColor: colorFormats.hex_with_alpha,
            }}
          >
            {color === undefined ? (
              <Ban className="size-6 text-gray-400 " />
            ) : null}
          </div>
          {color !== undefined ? (
            <Bookmark
              className="absolute left-0 top-0 size-4 cursor-pointer"
              fill={
                bookmarkedColors.map((item) => item.slice(0, 7)).includes(color)
                  ? "black"
                  : "white"
              }
              onClick={() => {
                const color = colorFormats.hex_with_alpha;
                if (color === undefined) return;
                if (bookmarkedColors.includes(color)) {
                  saveBookmarkedColors(
                    bookmarkedColors.filter((c) => c !== color)
                  );
                } else {
                  saveBookmarkedColors([...bookmarkedColors, color]);
                }
              }}
            />
          ) : null}
        </div>
        <div className="h-full flex-1 flex flex-col gap-2">
          <div className="w-full flex items-center gap-2">
            <h3 className="text-xs">Opacity</h3>
            <Slider value={opacity} onChange={setOpacity} className="flex-1" />
            <div className="text-xs w-5">{opacity}</div>
          </div>
          <ColorInput
            className="w-full h-7"
            colorFormats={colorFormats}
            onChange={handleColorChange}
            inputType={leadingOption as "hex" | "rgb" | "hsl"}
            onInputTypeChange={setLeadingOption}
          />
        </div>
      </div>
    </div>
  );
}
