import { prisma } from './db'

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const { pathname } = new URL(req.url)

    // Skip favicon route
    if (pathname === '/favicon.ico') {
      return new Response(null, { status: 204 }) // or serve an icon if you have one
    }

    // Return all users
    const users = await prisma.users.findMany()

    // Count all users
    const count = await prisma.users.count()

    // Format the response with JSON
    return new Response(
      JSON.stringify({
        users: users,
        totalUsers: count,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  },
})

console.log(`Listening on http://localhost:${server.port}`)