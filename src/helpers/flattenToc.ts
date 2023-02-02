export default function (
  toc: {
    slug: string
    subchapters: {
      slug: string
      subchapters: {
        slug: string
      }[]
    }[]
  }[]
) {
  return toc.reduce(
    (acc, item) => [
      ...acc,
      item.slug,
      ...(item.subchapters.reduce(
        (acc, item) => [
          ...acc,
          item.slug,
          ...(item.subchapters.map((s) => s.slug) || []),
        ],
        [] as string[]
      ) || []),
    ],
    [] as string[]
  )
}
