import Content from '@/models/Content'

export default interface Chapter {
  level: number
  title: string
  slug: string
  beginning: Content[]
  subchapters: Chapter[]
  content: Content[]
}
