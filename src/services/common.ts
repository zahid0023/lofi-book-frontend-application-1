export interface MutationResponse {
  success: boolean;
  id: number;
}

export interface PageResponse<T> {
  data: T[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}
