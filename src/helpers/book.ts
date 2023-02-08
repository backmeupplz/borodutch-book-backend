import { cwd } from 'process'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { slugify } from 'transliteration'
import Chapter from '@/models/Chapter'
import Content from '@/models/Content'
import Edition from '@/models/Edition'
import flattenToc from '@/helpers/flattenToc'
import parse, { HTMLElement, Node } from 'node-html-parser'

function cleanRawText(str: string) {
  return str
    .replace(/\t/gi, '')
    .replace(/\n/gi, '')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
}

function getSlug(str: string) {
  return slugify(cleanRawText(str), {
    allowedChars: 'a-zA-Z0-9-_',
  })
}

function extractContent(node: Node): Content {
  // Termintaion condition
  if (!node.childNodes?.length || !(node instanceof HTMLElement)) {
    return {
      text: cleanRawText(node.rawText),
    }
  }
  return {
    class: node.getAttribute('class'),
    tagName: node.tagName,
    slug:
      node.getAttribute('class')?.includes('Heading-4') ||
      node.getAttribute('class')?.includes('Heading-5')
        ? getSlug(node.text || '')
        : undefined,
    children: node.childNodes.map(extractContent),
  }
}

export const versions = {} as Record<Edition, string>
export const footnotes = {} as Record<
  Edition,
  {
    title: string
    url?: string
  }[]
>
export const books = {} as Record<Edition, Chapter[]>
export const tocs = {} as Record<
  Edition,
  {
    level: number
    title: string
    slug: string
    subchapters: {
      level: number
      title: string
      slug: string
      subchapters: {
        level: number
        title: string
        slug: string
      }[]
    }[]
  }[]
>
export const slugEditionMap = {} as Record<string, Record<Edition, string>>

export function prepareBookEditions() {
  const editions = ['ru', 'en'] as Edition[]
  for (const edition of editions) {
    const root = parse(
      readFileSync(resolve(cwd(), 'book', `wdlaty-${edition}.html`), 'utf8'),
      {
        blockTextElements: {
          script: false,
          noscript: false,
          style: false,
          pre: false,
        },
      }
    )
    versions[edition] =
      root.getElementById(
        '_idContainer003'
      ).childNodes[1]?.childNodes[0]?.rawText
    const contentChildren = root
      .getElementById('_idContainer008')
      .childNodes.filter((c) => c instanceof HTMLElement) as HTMLElement[]
    const result = [] as Chapter[]
    let tempChapter = null as Chapter | null
    let tempSubChapter = null as Chapter | null
    let tempSubSubChapter = null as Chapter | null
    for (const child of contentChildren) {
      // new chapter
      if (child.attributes.class?.match(/heading-1/i)) {
        tempChapter = {
          level: 0,
          title: cleanRawText(child.rawText),
          slug: getSlug(child.rawText),
          beginning: [],
          subchapters: [],
          content: [],
        }
        tempSubChapter = null
        tempSubSubChapter = null
        result.push(tempChapter)
        continue
      }
      // new subchapter
      if (child.attributes.class?.match(/heading-2/i)) {
        tempSubChapter = {
          level: 1,
          title: cleanRawText(child.rawText),
          slug: getSlug(child.rawText),
          beginning: [],
          subchapters: [],
          content: [],
        }
        tempSubSubChapter = null
        tempChapter?.subchapters.push(tempSubChapter)
        continue
      }
      // new subsubchapter
      if (child.attributes.class?.match(/heading-3/i)) {
        tempSubSubChapter = {
          level: 2,
          title: cleanRawText(child.rawText),
          slug: getSlug(child.rawText),
          beginning: [],
          subchapters: [],
          content: [],
        }
        tempSubChapter?.subchapters.push(tempSubSubChapter)
        continue
      }
      // beginning of chapter
      if (!tempSubChapter) {
        tempChapter?.beginning.push(extractContent(child))
        continue
      }
      // beginning of subchapter
      if (!tempSubSubChapter) {
        tempSubChapter.beginning.push(extractContent(child))
        continue
      }
      // content
      const target = tempSubSubChapter || tempSubChapter
      target?.content.push(extractContent(child))
    }
    // Footnotes
    const footnotesContainer = root.getElementById('_idContainer009')
    for (const child of footnotesContainer.childNodes) {
      if (
        child instanceof HTMLElement &&
        child.getAttribute('class') === 'Endnote'
      ) {
        const lastChild = child.childNodes.pop()
        if (!lastChild || !(lastChild instanceof HTMLElement)) {
          continue
        }
        const title =
          child.text.match(/(«|")(.+)(»|")/i)?.[2] ||
          lastChild.text.match(/\d+\. (.+)/i)?.[1]
        if (!title) {
          continue
        }
        const url = lastChild.getAttribute('href')
        const footnote = {
          title: cleanRawText(title),
          url,
        }
        if (!footnotes[edition]) {
          footnotes[edition] = []
        }
        footnotes[edition].push(footnote)
      }
    }
    books[edition] = result
    tocs[edition] = result.map((chapter) => ({
      level: chapter.level,
      title: cleanRawText(chapter.title),
      slug: chapter.slug,
      subchapters: chapter.subchapters.map((subchapter) => ({
        level: subchapter.level,
        title: subchapter.title,
        slug: subchapter.slug,
        subchapters: subchapter.subchapters?.map((subchapter) => ({
          level: subchapter.level,
          title: subchapter.title,
          slug: subchapter.slug,
        })),
      })),
    }))
  }
  const flattenedSlugs = Object.keys(tocs).reduce(
    (prev, cur) => ({
      ...prev,
      [cur]: flattenToc(tocs[cur as Edition] || []),
    }),
    {} as Record<Edition, string[]>
  )
  for (const edition of editions) {
    const slugs = flattenedSlugs[edition]
    for (let i = 0; i < slugs.length; i++) {
      const slug = slugs[i]
      if (!slugEditionMap[slug])
        slugEditionMap[slug] = {} as Record<Edition, string>
      for (const innerEdition of editions) {
        slugEditionMap[slug][innerEdition] = flattenedSlugs[innerEdition][i]
      }
    }
  }
}
