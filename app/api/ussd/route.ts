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

interface ParsedUssdMessage {
  data?: string
}

interface ParsedUssd {
  type?: string | number
  msg?: string | ParsedUssdMessage
}

interface ParsedUssdXml {
  ussd?: ParsedUssd
}

interface UssdRequestPayload {
  sessionid?: string
  type?: number
  msg?: string
  imsi?: string
  msisdn?: string
}

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

/**
 * Parses both supported USSD response formats:
 *
 * Format 1:
 * <msg>Hello</msg>
 *
 * Format 2:
 * <msg>
 *   <data>Hello</data>
 * </msg>
 */
function parseResponseXml(xml: string): {
  type: string | null
  msg: string
} {
  try {
    const obj = parser.parse(xml) as ParsedUssdXml
    const ussd = obj.ussd

    const type =
      ussd?.type !== undefined && ussd.type !== null
        ? String(ussd.type)
        : null

    let msg = ""

    if (typeof ussd?.msg === "string") {
      // <msg>Hello</msg>
      msg = ussd.msg
    } else if (
      ussd?.msg &&
      typeof ussd.msg === "object" &&
      typeof ussd.msg.data === "string"
    ) {
      // <msg><data>Hello</data></msg>
      msg = ussd.msg.data
    }

    return {
      type,
      msg,
    }
  } catch {
    return {
      type: null,
      msg: "",
    }
  }
}

export async function POST(request: Request) {
  const endpoint =
    process.env.USSD_ENDPOINT ||
    "http://localhost:3000/ussd/vodacom/process"

  const defaultImsi = process.env.USSD_IMSI || "123123123"
  const defaultMsisdn = process.env.USSD_MSISDN || "255714585855"

  let payload: UssdRequestPayload

  try {
    payload = (await request.json()) as UssdRequestPayload
  } catch {
    return NextResponse.json(
      {
        error: "Invalid JSON body",
      },
      {
        status: 400,
      },
    )
  }

  const sessionid = payload.sessionid ?? ""
  const type = payload.type === 2 ? 2 : 1
  const msg = payload.msg ?? ""
  const imsi = payload.imsi || defaultImsi
  const msisdn = payload.msisdn || defaultMsisdn

  const requestXml = buildRequestXml({
    sessionid,
    imsi,
    type,
    msisdn,
    msg,
  })

  const startedAt = Date.now()

  try {
    const res = await axios.post(endpoint, requestXml, {
      headers: {
        "Content-Type": "application/xml",
        Authorization: `Bearer ${process.env.USSD_AUTH_TOKEN ?? ""}`,
      },
      responseType: "text",

      // Don't throw on non-2xx responses.
      // We want to expose the response in the debug panel.
      validateStatus: () => true,

      timeout: 15_000,

      // Prevent Axios from trying to parse the XML.
      transformResponse: [(data: unknown) => data],
    })

    const durationMs = Date.now() - startedAt

    const responseXml =
      typeof res.data === "string"
        ? res.data
        : String(res.data ?? "")

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
          : axiosErr.message ||
            "Unknown error contacting the USSD gateway."

    const body: UssdApiResponse = {
      ok: false,
      status: 0,
      statusText: "NETWORK_ERROR",
      durationMs,
      endpoint,
      requestXml,
      responseXml: "",
      parsed: {
        type: null,
        msg: "",
      },
      error: message,
    }

    return NextResponse.json(body, {
      status: 200,
    })
  }
}

// Expose the continue sentinel so the client and server agree.
export const CONTINUE = USSD_CONTINUE