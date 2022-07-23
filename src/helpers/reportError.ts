import report from '@/helpers/report'

export default async function (error: unknown) {
  const errorString = `Error: ${error instanceof Error ? error.message : error}`
  console.error(errorString)
  try {
    await report(errorString)
  } catch (errorSending) {
    console.error(
      `Error sending error to server: ${
        errorSending instanceof Error ? errorSending.message : errorSending
      }`
    )
  }
}
