import { AuthApiClient } from "./auth-api";
import { NotesApiClient } from "./notes-api";
import { LabelsApiClient } from "./labels-api";
import { ImagesApiClient } from "./images-api";
import { AIApiClient } from "./ai-api";
import { SubscriptionApiClient } from "./subscription-api";
import { SupportApiClient } from "./support-api";
import { UserApiClient } from "./user-api";

class ApiService extends UserApiClient {
  auth: AuthApiClient;
  notes: NotesApiClient;
  labels: LabelsApiClient;
  images: ImagesApiClient;
  ai: AIApiClient;
  subscription: SubscriptionApiClient;
  support: SupportApiClient;

  constructor() {
    super();
    this.auth = new AuthApiClient();
    this.notes = new NotesApiClient();
    this.labels = new LabelsApiClient();
    this.images = new ImagesApiClient();
    this.ai = new AIApiClient();
    this.subscription = new SubscriptionApiClient();
    this.support = new SupportApiClient();
  }
}

export const apiClient = new ApiService();

export type { ApiResponse } from "./client";
export type { LoginData, RegisterData } from "./auth-api";
export type {
  CreateNoteData,
  UpdateNoteData,
  FetchNotesParams,
  NotesVersionResponse,
} from "./notes-api";
export type { NoteHistoryEntry } from "../../types/note-types";
export type { ImageUploadData, ImageUploadResponse } from "./images-api";
export type {
  SummarizeNoteResponse,
  TranslateNoteResponse,
  GenerateNoteResponse,
  AIAssistantMessage,
  AIAssistantActionResult,
  AIAssistantResponse,
} from "./ai-api";
