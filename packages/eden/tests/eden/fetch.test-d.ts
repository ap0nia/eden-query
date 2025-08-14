import { attest } from '@ark/attest'
import { Elysia } from 'elysia'
import { describe, test } from 'vitest'

import { edenFetch } from '../../src/eden/fetch'
import { useApp } from '../setup'

const domain = 'http://localhost:3000'

describe('edenFetch', () => {
  test('does not require second argument if GET endpoint exists', () => {
    const app = new Elysia().get('/', () => {})

    useApp(app)

    const fetch = edenFetch<typeof app>(domain, { fetcher: () => '' as any })

    fetch('')
  })

  test('allows second argument if GET endpoint exists', () => {
    const app = new Elysia().get('/', () => {})

    useApp(app)

    const fetch = edenFetch<typeof app>(domain, { fetcher: () => '' as any })

    fetch('', { method: 'GET' })
  })

  test('prohibits unregistered methods', () => {
    const app = new Elysia().get('/', () => {})

    useApp(app)

    const fetch = edenFetch<typeof app>(domain, { fetcher: () => '' as any })

    attest(() => {
      // @ts-expect-error Testing unregistered method.
      fetch('/index', { method: 'HELLO' })
    }).type.errors('Type \'"HELLO"\' is not assignable to type \'"GET"\'.')
  })

  // MIXED-CASING NOT ALLOWED.
  // test('allows custom methods', () => {
  //   const app = new Elysia().route('HeLlO', '/', () => {})

  //   useApp(app)

  //   const fetch = edenFetch<typeof app>(domain)

  //   fetch('/index', { method: 'HELLO' })
  // })

  test('requires second argument if GET endpoint does not exist', () => {
    const app = new Elysia().post('/', () => {})

    useApp(app)

    const fetch = edenFetch<typeof app>(domain, { fetcher: () => '' as any })

    attest(() => {
      // @ts-expect-error Testing invalid number of arguments.
      fetch('')
    }).type.errors('Expected 2 arguments, but got 1.')
  })

  test('allows third argument for subscriptions', () => {
    const app = new Elysia().ws('/', () => {})

    useApp(app)

    const fetch = edenFetch<typeof app>(domain, { fetcher: () => '' as any })

    fetch('', { method: 'SUBSCRIBE' }, {})
  })
})
