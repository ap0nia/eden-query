export const frameworks = {
  elysia: {
    name: 'Elysia',
    runtime: 'Bun',
    reqs: 2_454_631,
  },
  swoole: {
    name: 'Swoole',
    runtime: 'PHP',
    reqs: 1_035_418,
  },
  gin: {
    name: 'Gin',
    runtime: 'Go',
    reqs: 676_019,
  },
  spring: {
    name: 'Spring',
    runtime: 'Java',
    reqs: 506_087,
  },
  fastapi: {
    name: 'FastAPI',
    runtime: 'PyPy',
    reqs: 448_130,
  },
  fastify: {
    name: 'Fastify',
    runtime: 'Node',
    reqs: 415_600,
  },
  express: {
    name: 'Express',
    runtime: 'Node',
    reqs: 113_117,
  },
  nest: {
    name: 'Nest',
    runtime: 'Node',
    reqs: 105_064,
  },
}

/**
 * Frameworks sorted in descending order with highest performance first.
 */
export const frameworksByPerformance = Object.values(frameworks).sort((a, b) => {
  return a.reqs > b.reqs ? -1 : 1
})
