import type { Elysia } from 'elysia'

export type GenericElysiaPlugin<T extends Elysia = Elysia> = (app: T) => T
