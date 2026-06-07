export interface Label {
  id: number;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
  notes_count: number;
}

export interface LabelsResponse {
  labels: Label[];
}

export interface CreateLabelData {
  name: string;
  color: string;
}

export interface UpdateLabelData {
  name?: string;
  color?: string;
}
