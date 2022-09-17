import { BigNumber, utils } from 'ethers'
import { Body, Controller, Ctx, Get, Params, Post } from 'amala'
import { Context } from 'koa'
import { badRequest, notFound } from '@hapi/boom'
import { createReadStream, readdirSync } from 'fs'
import { cwd } from 'process'
import { resolve } from 'path'
import Format from '@/validators/Format'
import Index from '@/validators/Index'
import Signature from '@/validators/Signature'
import Slug from '@/validators/Slug'
import balanceOf from '@/helpers/balanceOf'
import book, { footnotes, version } from '@/helpers/book'
import extractSubchapters from '@/helpers/extractSubchapters'
import report from '@/helpers/report'
import reportError from '@/helpers/reportError'

@Controller('/book')
export default class LoginController {
  @Get('/version')
  version() {
    return { version }
  }

  @Get('/formats')
  formats() {
    const disallowedFormats = ['.gitkeep', 'html', 'json']
    const disallowedFormatsRegex = new RegExp(disallowedFormats.join('|'), 'i')
    const files = readdirSync(resolve(cwd(), 'book')).filter(
      (name) => !disallowedFormatsRegex.test(name)
    )
    return files.map((name) => name.split('.').slice(1).join('.'))
  }

  @Get('/chapter/:slug')
  json(@Ctx() ctx: Context, @Params() { slug }: Slug) {
    const allChapters = book
      .concat(extractSubchapters(book))
      .concat(extractSubchapters(extractSubchapters(book)))
    const chapter = allChapters.find((chapter) => chapter.slug === slug)
    if (!chapter) {
      return ctx.throw(notFound('No chapter found!'))
    }
    return {
      level: chapter.level,
      title: chapter.title,
      slug: chapter.slug,
      beginning: chapter.beginning,
      content: chapter.content,
    }
  }

  @Get('/footnotes')
  footnotes() {
    return { footnotes }
  }

  @Get('/footnote/:index')
  footnote(@Ctx() ctx: Context, @Params() { index }: Index) {
    const footnote = footnotes[index]
    if (!footnote) {
      return ctx.throw(notFound('No footnote found!'))
    }
    return { footnote }
  }

  @Get('/toc')
  chapterNames() {
    return book.map((chapter) => ({
      level: chapter.level,
      title: chapter.title,
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

  @Post('/:format')
  async epub(
    @Ctx() ctx: Context,
    @Body() { signature, message }: Signature,
    @Params() { format }: Format
  ) {
    // Check signature and get the owner
    let owner: string
    try {
      owner = utils.verifyMessage(message, signature)
    } catch (error) {
      await reportError(error)
      return ctx.throw(badRequest('Не получилось подтвердить подпись!'))
    }
    // Check the balance
    let balance: BigNumber
    try {
      balance = await balanceOf(owner)
    } catch (error) {
      await reportError(error)
      return ctx.throw(badRequest('Не получилось получить баланс!'))
    }
    if (balance.lte(0)) {
      await reportError(`${owner} без баланса пытается скачать книгу!`)
      return ctx.throw(
        badRequest('Вам необходимо купить NFT, чтобы скачать книгу!')
      )
    }
    // Check the format
    const files = readdirSync(resolve(cwd(), 'book')).filter(
      (name) => name !== '.gitkeep'
    )
    const extensions = files.map((name) => name.split('.').slice(1).join('.'))
    if (!extensions.includes(format)) {
      return ctx.throw(badRequest('Нет такого формата!'))
    }
    // Return book.pdf as a file
    const filePath = resolve(cwd(), 'book', `wdlaty.${format}`)
    const fileStream = createReadStream(filePath)
    ctx.attachment(`wdlaty.${format}`)
    await report(`${owner} грузит книгу в формате ${format}`)
    return fileStream
  }
}
