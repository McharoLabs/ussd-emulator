import { NextResponse } from "next/server"
import axios, { AxiosError } from "axios"
import { XMLParser } from "fast-xml-parser"
import { USSD_CONTINUE, type UssdApiResponse } from "@/lib/ussd-types"

export const dynamic = "force-dynamic"

const parser = new XMLParser({
  ignoreAttributes: true,
  parseTagValue: false,
  trimValues: true,
})

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function buildRequestXml(opts: {
  sessionid: string
  imsi: string
  type: number
  msisdn: string
  msg: string
}): string {
  return `<ussd>
<sessionid>${escapeXml(opts.sessionid)}</sessionid>
<imsi>${escapeXml(opts.imsi)}</imsi>
<type>${opts.type}</type>
<msisdn>${escapeXml(opts.msisdn)}</msisdn>
<msg>${escapeXml(opts.msg)}</msg>
</ussd>`
}

function parseResponseXml(xml: string): { type: string | null; msg: string } {
  try {
    const obj = parser.parse(xml)
    const ussd = obj?.ussd ?? {}
    const type = ussd.type !== undefined && ussd.type !== null ? String(ussd.type) : null
    const msg = ussd.msg !== undefined && ussd.msg !== null ? String(ussd.msg) : ""
    return { type, msg }
  } catch {
    return { type: null, msg: "" }
  }
}

export async function POST(request: Request) {
  const endpoint = process.env.USSD_ENDPOINT || "http://localhost:3000/ussd/vodacom/process"
  const defaultImsi = process.env.USSD_IMSI || "123123123"
  const defaultMsisdn = process.env.USSD_MSISDN || "255714585855"

  let payload: {
    sessionid?: string
    type?: number
    msg?: string
    imsi?: string
    msisdn?: string
  }

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const sessionid = payload.sessionid ?? ""
  const type = payload.type === 2 ? 2 : 1
  const msg = payload.msg ?? ""
  const imsi = payload.imsi || defaultImsi
  const msisdn = payload.msisdn || defaultMsisdn

  const requestXml = buildRequestXml({ sessionid, imsi, type, msisdn, msg })

  const startedAt = Date.now()

  try {
    const res = await axios.post(endpoint, requestXml, {
      headers: { "Content-Type": "application/xml" },
      responseType: "text",
      // don't throw on non-2xx so we can surface it in the debug panel
      validateStatus: () => true,
      timeout: 15000,
      transformResponse: [(d) => d],
    })

    const durationMs = Date.now() - startedAt
    const responseXml = typeof res.data === "string" ? res.data : String(res.data ?? "")
    const parsed = parseResponseXml(responseXml)

    const body: UssdApiResponse = {
      ok: res.status >= 200 && res.status < 300,
      status: res.status,
      statusText: res.statusText || "",
      durationMs,
      endpoint,
      requestXml,
      responseXml,
      parsed,
    }
    return NextResponse.json(body)
  } catch (err) {
    const durationMs = Date.now() - startedAt
    const axiosErr = err as AxiosError
    const message =
      axiosErr.code === "ECONNABORTED"
        ? "Request timed out while contacting the USSD gateway."
        : axiosErr.code === "ECONNREFUSED"
          ? `Connection refused. Is the USSD gateway running at ${endpoint}?`
          : axiosErr.message || "Unknown error contacting the USSD gateway."

    const body: UssdApiResponse = {
      ok: false,
      status: 0,
      statusText: "NETWORK_ERROR",
      durationMs,
      endpoint,
      requestXml,
      responseXml: "",
      parsed: { type: null, msg: "" },
      error: message,
    }
    return NextResponse.json(body, { status: 200 })
  }
}

// expose the continue sentinel so the client and server agree
export const CONTINUE = USSD_CONTINUE
