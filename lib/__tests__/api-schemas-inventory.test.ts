import { describe, it, expect } from 'vitest'
import { commonSchemas } from '@/lib/api-schemas'

/**
 * B7-PR2 — inventário de lib/api-schemas.ts (docs/ux/B7-PRECHECK.md H-C6).
 *
 * `commonSchemas.contentType` era o enum falso
 * ['Lyrics','Chords','Tabs','Piano','Drums'] (achado c2 do B2: 'Tabs',
 * 'Piano', 'Drums' nunca existiram no produto), sem consumidor desde o B2
 * (`grep -rn "commonSchemas\.contentType"` → exit 1, medido no pre-check
 * do B7). O enum canônico é `contentTypeSchema` (z.nativeEnum(ContentType)).
 *
 * Commit 1 = it.fails contra o código presente (controle negativo, regra
 * nº 7); commit 2 = it.
 */
describe('commonSchemas — inventário (B7-PR2)', () => {
  it('não expõe contentType (enum falso removido)', () => {
    expect('contentType' in commonSchemas).toBe(false)
  })
})
