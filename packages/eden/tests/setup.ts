import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll } from 'vitest'

/**
 * @see https://vitest.dev/guide/mocking#requests
 */
export const server = setupServer()

// Start server before all tests.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

//  Close server after all tests.
afterAll(() => server.close())

// Reset handlers after each test `important for test isolation`.
afterEach(() => server.resetHandlers())
