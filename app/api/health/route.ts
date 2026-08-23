import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, rateLimited, getClientIp, RATE_LIMITS } from '@/lib/user-rate-limit'

// B1.3: rota pública — o único uso legítimo de chave por IP fora do
// caminho de auth falhada ("sem credencial ≠ sem limite", sem exceções).
const healthCheckHandler = async (request: NextRequest) => {
  const rl = checkRateLimit({
    scope: 'ip',
    id: getClientIp(request),
    familia: 'health',
    config: RATE_LIMITS.HEALTH
  })
  if (!rl.ok) {
    return rateLimited(rl)
  }
  return NextResponse.json({ status: 'ok' })
}

const headHealthCheckHandler = async (request: NextRequest) => {
  const rl = checkRateLimit({
    scope: 'ip',
    id: getClientIp(request),
    familia: 'health',
    config: RATE_LIMITS.HEALTH
  })
  if (!rl.ok) {
    return rateLimited(rl)
  }
  return NextResponse.json(null, { status: 200 })
}

export const GET = healthCheckHandler
export const HEAD = headHealthCheckHandler
