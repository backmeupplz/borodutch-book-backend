import { BigNumber, utils } from 'ethers'
import { Body, Controller, Ctx, Get, Params, Post } from 'amala'
import { Context } from 'koa'
import { badRequest } from '@hapi/boom'
import { createReadStream, readdirSync } from 'fs'
import { cwd } from 'process'
import { resolve } from 'path'
import Format from '@/validators/Format'
import Index from '@/validators/Index'
import Signature from '@/validators/Signature'
import balanceOf from '@/helpers/balanceOf'
import book from '@/helpers/book'
import report from '@/helpers/report'
import reportError from '@/helpers/reportError'

@Controller('/book')
export default class LoginController {
  @Get('/formats')
  formats() {
    const files = readdirSync(resolve(cwd(), 'book')).filter(
      (name) => name !== '.gitkeep'
    )
    return files.map((name) => name.split('.').slice(1).join('.'))
  }

  @Get('/chapters/:index')
  json(@Params() { index }: Index) {
    return book[index]
  }

  @Get('/toc')
  chapterNames() {
    return book.map((chapter) => ({
      title: chapter.title,
      slug: chapter.slug,
      subchapters: chapter.subchapters.map((subchapter) => ({
        title: subchapter.title,
        slug: subchapter.slug,
        subchapters: subchapter.subchapters?.map((subchapter) => ({
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
