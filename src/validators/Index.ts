import { IsInt, Type } from 'amala'

export default class {
  @Type(() => Number)
  @IsInt()
  index!: number
}
