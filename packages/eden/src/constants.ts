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
