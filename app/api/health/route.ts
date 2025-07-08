import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/rate-limit'

const healthCheckHandler = async (request: NextRequest) => {
  return NextResponse.json({ status: 'ok' })
}

const headHealthCheckHandler = async (request: NextRequest) => {
  return NextResponse.json(null, { status: 200 })
}

export const GET = withRateLimit(healthCheckHandler, 1000)
export const HEAD = withRateLimit(headHealthCheckHandler, 1000)
