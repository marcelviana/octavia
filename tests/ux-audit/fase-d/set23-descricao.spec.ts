import { test, expect } from '@playwright/test'
import { getBearer, settle } from './recorder'

/**
 * PR-2 (fila A #2, SET-23) — regressão de API do .nullish() nos schemas de
 * setlist. Complementa o item 16 do e-setlists.spec.ts (fluxo de UI):
 *
 *  A. Create com description: null (o payload exato que a UI envia com o
 *     campo vazio) → 201, e a setlist EXISTE (o FASE-D-05 era 400 mudo).
 *  B. Update limpando a descrição de uma setlist existente
 *     (description: null) → salvar → reler → campo vazio PERSISTIDO
 *     (semântica de clear: null = set explícito da coluna).
 *
 * Cleanup: a setlist criada usa o prefixo UX-AUDIT (coberta pelo
 * cleanup.ts) e é removida ao fim pelo próprio spec.
 */

test('SET-23: create com null e update-clear da descrição', async ({ page }) => {
  test.setTimeout(4 * 60 * 1000)

  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
  await settle(page, 1500)
  const token = await getBearer(page)
  expect(token, 'accessToken disponível').toBeTruthy()
  const auth = { Authorization: `Bearer ${token}` }

  let setlistId: string | null = null
  try {
    // ---- A. Create com description: null → 201 e setlist existe ----
    const create = await page.request.post('/api/setlists', {
      headers: auth,
      data: { name: 'UX-AUDIT PR-2 set23', description: null },
    })
    expect(create.status(), 'create com description:null aceito (era 400 no FASE-D-05)').toBe(201)
    const created = await create.json()
    setlistId = created?.id ?? created?.setlist?.id ?? null
    expect(setlistId, 'setlist criada tem id').toBeTruthy()

    // ---- B. Preencher e depois LIMPAR a descrição ----
    const fill = await page.request.put(`/api/setlists/${setlistId}`, {
      headers: auth,
      data: { description: 'descrição temporária' },
    })
    expect(fill.ok(), 'update preenchendo descrição').toBe(true)

    const clear = await page.request.put(`/api/setlists/${setlistId}`, {
      headers: auth,
      data: { description: null },
    })
    expect(clear.status(), 'update com description:null aceito').toBeLessThan(300)

    // Reler: o campo vazio precisa ter PERSISTIDO
    const read = await page.request.get(`/api/setlists/${setlistId}`, { headers: auth })
    expect(read.ok(), 'GET da setlist').toBe(true)
    const body = await read.json()
    const desc = body?.description ?? body?.setlist?.description ?? null
    expect(desc, 'descrição limpa persistida como null/vazia').toBeFalsy()
  } finally {
    if (setlistId) {
      await page.request
        .delete(`/api/setlists/${setlistId}`, { headers: auth })
        .catch(() => {})
    }
  }
})
