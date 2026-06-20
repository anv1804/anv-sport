export type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  parentId: string | null
  isActive: boolean
  createdBy: string
  _count?: { posts: number }
}

export type CategoryFormData = {
  name: string
  slug: string
  description: string
  parentId: string
  isActive: boolean
}
