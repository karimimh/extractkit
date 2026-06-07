interface ColorControlsProps {
  textColor: string;
  bgColor: string;
  onColorChange: (textColor: string, bgColor: string) => void;
}

export const NOTE_COLORS = [
  {
    textColor: "#000000",
    bgColor: "#ffffff",
    darkTextColor: "#ffffff",
    darkBgColor: "#1F2937",
    label: "Default",
  },
  {
    textColor: "#374151",
    bgColor: "#F9FAFB",
    darkTextColor: "#E5E7EB",
    darkBgColor: "#374151",
    label: "Gray",
  },
  {
    textColor: "#991B1B",
    bgColor: "#FEE2E2",
    darkTextColor: "#FCA5A5",
    darkBgColor: "#7F1D1D",
    label: "Red",
  },
  {
    textColor: "#C2410C",
    bgColor: "#FFEDD5",
    darkTextColor: "#FDBA74",
    darkBgColor: "#9A3412",
    label: "Orange",
  },
  {
    textColor: "#92400E",
    bgColor: "#FEF3C7",
    darkTextColor: "#FCD34D",
    darkBgColor: "#78350F",
    label: "Yellow",
  },
  {
    textColor: "#14532D",
    bgColor: "#DCFCE7",
    darkTextColor: "#86EFAC",
    darkBgColor: "#14532D",
    label: "Green",
  },
  {
    textColor: "#1E3A8A",
    bgColor: "#DBEAFE",
    darkTextColor: "#93C5FD",
    darkBgColor: "#1E3A8A",
    label: "Blue",
  },
  {
    textColor: "#581C87",
    bgColor: "#F3E8FF",
    darkTextColor: "#D8B4FE",
    darkBgColor: "#581C87",
    label: "Purple",
  },
  {
    textColor: "#831843",
    bgColor: "#FCE7F3",
    darkTextColor: "#F9A8D4",
    darkBgColor: "#831843",
    label: "Pink",
  },
  {
    textColor: "#E5E7EB",
    bgColor: "#374151",
    darkTextColor: "#1F2937",
    darkBgColor: "#E5E7EB",
    label: "Dark",
  },
];

export default function ColorControls({ textColor, bgColor, onColorChange }: ColorControlsProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">Note Color</label>
      <div className="flex flex-wrap gap-2">
        {NOTE_COLORS.map(color => {
          const isSelected = textColor === color.textColor && bgColor === color.bgColor;
          return (
            <button
              key={`${color.textColor}-${color.bgColor}`}
              type="button"
              onClick={() => onColorChange(color.textColor, color.bgColor)}
              className={`size-8 rounded-full border-2 transition-all overflow-hidden ${
                isSelected
                  ? "border-blue-500 ring-2 ring-blue-200"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              title={`${color.label} (Light / Dark)`}
              aria-label={`Select ${color.label} color scheme`}
            >
              <div className="flex h-full">
                {/* Light Mode - Left Half */}
                <div
                  className="flex-1 flex items-center justify-center"
                  style={{ backgroundColor: color.bgColor, color: color.textColor }}
                >
                  <span className="text-xs font-bold">L</span>
                </div>
                {/* Dark Mode - Right Half */}
                <div
                  className="flex-1 flex items-center justify-center"
                  style={{ backgroundColor: color.darkBgColor, color: color.darkTextColor }}
                >
                  <span className="text-xs font-bold">D</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
