export interface ContentQueryParams {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: "recent" | "title" | "artist" | "updated"
  useCache?: boolean
  filters?: {
    contentType?: string[]
    difficulty?: string[]
    key?: string[]
    favorite?: boolean
  }
}
