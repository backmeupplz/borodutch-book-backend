import { BigNumber, utils } from 'ethers'
import { Body, Controller, Ctx, Get, Params, Post, Query } from 'amala'
import { Context } from 'koa'
import { badRequest, notFound } from '@hapi/boom'
import { books, footnotes, versions } from '@/helpers/book'
import { createReadStream, readdirSync } from 'fs'
import { cwd } from 'process'
import { resolve } from 'path'
import Edition from '@/validators/Edition'
import Format from '@/validators/Format'
import Index from '@/validators/Index'
import OptionalSignature from '@/validators/OptionalSignature'
import Signature from '@/validators/Signature'
import Slug from '@/validators/Slug'
import balanceOf from '@/helpers/balanceOf'
import extractSubchapters from '@/helpers/extractSubchapters'
import freeSlugs from '@/helpers/freeSlugs'
import report from '@/helpers/report'
import reportError from '@/helpers/reportError'

@Controller('/book')
export default class LoginController {
  @Get('/free-slugs')
  freeSlugs() {
    return freeSlugs
  }

  @Get('/versions')
  version() {
    return versions
  }

  @Get('/formats')
  formats() {
    const disallowedFormats = ['.gitkeep', 'html', 'DS_Store']
    const disallowedFormatsRegex = new RegExp(disallowedFormats.join('|'), 'i')
    const files = readdirSync(resolve(cwd(), 'book')).filter(
      (name) => !disallowedFormatsRegex.test(name)
    )
    const formatNames = files.map((name) => name.split('.').slice(1).join('.'))
    return formatNames.filter(
      (name, index) => formatNames.indexOf(name) === index
    )
  }

  @Get('/chapter/:slug')
  async chapter(
    @Ctx() ctx: Context,
    @Params() { slug }: Slug,
    @Query() { signature, message, edition }: OptionalSignature & Edition
  ) {
    const book = books[edition]
    const allChapters = book
      .concat(extractSubchapters(book))
      .concat(extractSubchapters(extractSubchapters(book)))
    const chapter = allChapters.find((chapter) => chapter.slug === slug)
    if (!chapter) {
      return ctx.throw(notFound('No chapter found!'))
    }
    if (!freeSlugs[edition].includes(slug)) {
      if (!signature || !message) {
        return ctx.throw(badRequest('No signature provided!'))
      } else {
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
          await reportError(`💸 ${owner} без баланса пытается получить главу`)
          return ctx.throw(
            badRequest('Вам необходимо купить NFT, чтобы скачать книгу!')
          )
        }
      }
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
  footnotes(@Query() { edition }: Edition) {
    return footnotes[edition]
  }

  @Get('/footnote/:index')
  footnote(
    @Ctx() ctx: Context,
    @Params() { index }: Index,
    @Query() { edition }: Edition
  ) {
    const footnote = footnotes[edition][index]
    if (!footnote) {
      return ctx.throw(notFound('No footnote found!'))
    }
    return footnote
  }

  @Get('/toc')
  chapterNames(@Query() { edition }: Edition) {
    const book = books[edition]
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
  async downloadFormat(
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
      await reportError(`💸 ${owner} без баланса пытается скачать книгу`)
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
