import { IsOptional, IsString } from 'amala'

export default class {
  @IsOptional()
  @IsString()
  signature?: string
  @IsOptional()
  @IsString()
  message?: string
}
