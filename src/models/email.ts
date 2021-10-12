import { getModelForClass, prop } from '@typegoose/typegoose'
import MongoDocument from '@/models/MongoDocument'

export class Email extends MongoDocument<Email> {
  @prop({ index: true, lowercase: true, required: true })
  email: string
}

export const EmailModel = getModelForClass(Email, {
  schemaOptions: { timestamps: true },
})
