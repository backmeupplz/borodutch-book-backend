import { IsString } from 'amala'
import Edition from '@/models/Edition'

export default class {
  @IsString()
  edition!: Edition
}
