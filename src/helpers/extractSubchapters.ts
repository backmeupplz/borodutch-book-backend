import Chapter from '@/models/Chapter'

export default function (chapters: Chapter[]) {
  return chapters.reduce(
    (acc, chapter) => acc.concat(chapter.subchapters || []),
    [] as Chapter[]
  )
}
