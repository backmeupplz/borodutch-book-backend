import { cwd } from 'process'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { slugify } from 'transliteration'
import Chapter from '@/models/Chapter'
import Content from '@/models/Content'
import parse, { HTMLElement, Node } from 'node-html-parser'

function getSlug(str: string) {
  return slugify(str, {
    allowedChars: 'a-zA-Z0-9-_',
  })
}

function extractContent(node: Node): Content {
  // Termintaion condition
  if (!node.childNodes?.length || !(node instanceof HTMLElement)) {
    return {
      text: node.rawText.replace(/\t/gi, '').replace(/\n/gi, ''),
    }
  }
  return {
    class: node.getAttribute('class'),
    tagName: node.tagName,
    children: node.childNodes.map(extractContent),
  }
}

function prepareBook() {
  const root = parse(
    readFileSync(resolve(cwd(), 'book', 'wdlaty.html'), 'utf8'),
    {
      blockTextElements: {
        script: false,
        noscript: false,
        style: false,
        pre: false,
      },
    }
  )
  const contentChildren = root
    .getElementById('_idContainer008')
    .childNodes.filter((c) => c instanceof HTMLElement) as HTMLElement[]
  const result = [] as Chapter[]
  let tempChapter = null as Chapter | null
  let tempSubChapter = null as Chapter | null
  let tempSubSubChapter = null as Chapter | null
  for (const child of contentChildren) {
    // new chapter
    if (child.attributes.class?.match(/heading-1/gi)) {
      tempChapter = {
        level: 0,
        title: child.rawText,
        slug: getSlug(child.rawText),
        beginning: [],
        subchapters: [],
        content: [],
      }
      tempSubChapter = null
      result.push(tempChapter)
      continue
    }
    // new subchapter
    if (child.attributes.class?.match(/heading-2/gi)) {
      tempSubChapter = {
        level: 1,
        title: child.rawText,
        slug: getSlug(child.rawText),
        beginning: [],
        subchapters: [],
        content: [],
      }
      tempChapter?.subchapters.push(tempSubChapter)
      continue
    }
    // new subsubchapter
    if (child.attributes.class?.match(/heading-3/gi)) {
      tempSubSubChapter = {
        level: 2,
        title: child.rawText,
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
  return result
}

export default prepareBook()
