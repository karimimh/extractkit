export type Param = { name: string; label?: string } & (
  | {
      type: "none";
    }
  | {
      type: "slider";
      min?: number;
      max?: number;
      step?: number;
      defaultValue?: number | null;
    }
  | {
      type: "color";
    }
  | {
      type: "real-number"; // an input with all real numbers possible between min and max, no step
      min?: number;
      max?: number;
      defaultValue?: number | null;
    }
  | {
      type: "integer-number"; // an input with chevrons to increment/decrement by step, only allows values that are step increments between min and max
      min?: number;
      max?: number;
      step?: number;
      defaultValue?: number | null;
    }
  | {
      type: "select";
      options: { label: string; value: string }[];
      defaultValue?: string;
    }
  | {
      type: "boolean";
      defaultValue?: boolean;
    }
);

export type Control = {
  title?: string;
  applyLabel?: string;
  params: Param[];
};

export type ControlGroup = {
  title: string;
  controls: Control[];
};
