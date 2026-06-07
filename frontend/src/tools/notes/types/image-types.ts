export interface UserUploadedImage {
  id: number;
  note_id: number;
  note_title: string | null;
  image: string;
  size_bytes: number;
  uploaded_at: string;
}

export interface UserImagesResponse {
  total_images: number;
  total_size_bytes: number;
  images: UserUploadedImage[];
}
