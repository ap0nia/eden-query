import { app } from './server'

const PORT = 3000

app.listen(PORT, () => {
  console.log(`🦊 Elysia is running at http://localhost:${PORT}`)
})
