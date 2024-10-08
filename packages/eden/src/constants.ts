export const GET_OR_HEAD_HTTP_METHODS = ['get', 'head', 'subscribe'] as const

export const HTTP_METHODS = [
  ...GET_OR_HEAD_HTTP_METHODS,
  'post',
  'put',
  'delete',
  'patch',
  'options',
  'connect',
] as const

export const LOOPBACK_ADDRESSES = ['localhost', '127.0.0.1', '0.0.0.0']

export const IS_SERVER = typeof FileList === 'undefined'

export const CLIENT_WARNING =
  'Elysia instance server found on client side, this is not recommended for security reason. Use generic type instead.'

export const DEMO_DOMAIN = 'http://e.ly'

export const ISO8601_REGEX =
  /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/

export const FORMAL_DATE_REGEX =
  /(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{2}\s\d{4}\s\d{2}:\d{2}:\d{2}\sGMT(?:\+|-)\d{4}\s\([^)]+\)/

export const SHORTENED_DATE_REGEX =
  /^(?:(?:(?:(?:0?[1-9]|[12][0-9]|3[01])[/\s-](?:0?[1-9]|1[0-2])[/\s-](?:19|20)\d{2})|(?:(?:19|20)\d{2}[/\s-](?:0?[1-9]|1[0-2])[/\s-](?:0?[1-9]|[12][0-9]|3[01]))))(?:\s(?:1[012]|0?[1-9]):[0-5][0-9](?::[0-5][0-9])?(?:\s[AP]M)?)?$/

export const BATCH_ENDPOINT = '/batch'
