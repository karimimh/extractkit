import { Adjustment } from "@images/types/adjustment-types";
import { Filter } from "../../types/filter-types";
import { Rect } from "../../types/geometry-types";
import { ContentObject } from "../../types/layer-types";

export type HistoryItem =
  | {
      kind: "ADD_LAYER";
      layerId: string;
    }
  | {
      kind: "DELETE_LAYER";
      layerId: string;
    }
  | {
      kind: "SELECT_LAYER";
      layerId: string;
    }
  | {
      kind: "RENAME_LAYER";
      layerId: string;
      layerName: string;
    }
  | {
      kind: "SWAP_LAYERS";
      layerId1: string;
      layerId2: string;
    }
  | {
      kind: "ADD_OBJECT";
      objectId: string;
      layerId: string;
    }
  | {
      kind: "MODIFY_OBJECT";
      object: ContentObject;
    }
  | {
      kind: "REMOVE_OBJECT";
      objectId: string;
    }
  | {
      kind: "SET_CROP";
      crop: Rect;
    }
  | {
      kind: "ROTATE";
      angle: number;
    }
  | {
      kind: "MIRROR";
      mirrorAxis: "x" | "y";
    }
  | {
      kind: "ADJUST";
      adjustment: Adjustment;
    }
  | {
      kind: "FILTER";
      filter: Filter;
    }
  | {
      kind: "BRIGHTNESS" | "CONTRAST" | "EXPOSURE" | "SHADOWS" | "HIGHLIGHTS";
      value: number;
    }
  | {
      kind: "CROP";
      cropRect: Rect;
    };
