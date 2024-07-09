import {BskyAgent, jsonToLex, stringifyLex} from '@atproto/api'

const GET_TIMEOUT = 15e3 // 15s
const POST_TIMEOUT = 60e3 // 60s

export function doPolyfill() {
  BskyAgent.configure({fetch: fetchHandler})
}

interface FetchHandlerResponse {
  status: number
  headers: Record<string, string>
  body: any
}

async function fetchHandler(
  reqUri: string,
  reqMethod: string,
  reqHeaders: Record<string, string>,
  reqBody: any,
): Promise<FetchHandlerResponse> {
  const reqMimeType = reqHeaders['Content-Type'] || reqHeaders['content-type']
  if (reqMimeType && reqMimeType.startsWith('application/json')) {
    reqBody = stringifyLex(reqBody)
  }

  const controller = new AbortController()
  const to = setTimeout(
    () => controller.abort(),
    reqMethod === 'post' ? POST_TIMEOUT : GET_TIMEOUT,
  )

  const res = await fetch(reqUri, {
    method: reqMethod,
    headers: {
      ...reqHeaders,
      'x-bsky-entryway': 'short-session'
    },
    body: reqBody,
    signal: controller.signal,
  })

  const resStatus = res.status
  const resHeaders: Record<string, string> = {}
  res.headers.forEach((value: string, key: string) => {
    resHeaders[key] = value
  })
  const resMimeType = resHeaders['Content-Type'] || resHeaders['content-type']
  let resBody
  if (resMimeType) {
    if (resMimeType.startsWith('application/json')) {
      resBody = jsonToLex(await res.json())
    } else if (resMimeType.startsWith('text/')) {
      resBody = await res.text()
    } else if (resMimeType === 'application/vnd.ipld.car') {
      resBody = await res.arrayBuffer()
    } else {
      throw new Error('Non-supported mime type')
    }
  }

  clearTimeout(to)

  return {
    status: resStatus,
    headers: resHeaders,
    body: resBody,
  }
}
