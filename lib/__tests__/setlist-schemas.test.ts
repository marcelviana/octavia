import { describe, it, expect } from 'vitest'
import { setlistSchemas } from '@/lib/api-schemas'

/**
 * SET-23 / FASE-D-05: a UI envia `description: null` com o campo vazio e o
 * `.optional()` do Zod rejeitava a requisição INTEIRA (400 sem feedback).
 * Com `.nullish()`, os testes cobrem a SEMÂNTICA, não só a validação:
 * - null atravessa o parse COMO null (não stripped, não transformado) —
 *   é o null chegando ao handler que faz o "limpar descrição" funcionar
 *   no update (set explícito da coluna);
 * - undefined (campo ausente) continua significando "não mexa".
 */
describe('setlistSchemas — description null vs undefined (SET-23)', () => {
  describe('create', () => {
    it('aceita description: null e o null atravessa o parse como null', () => {
      const parsed = setlistSchemas.create.parse({ name: 'Show', description: null })
      expect(parsed).toHaveProperty('description', null)
    })

    it('aceita description como string', () => {
      const parsed = setlistSchemas.create.parse({ name: 'Show', description: 'abertura do bar' })
      expect(parsed.description).toBe('abertura do bar')
    })

    it('aceita description ausente (comportamento optional preservado)', () => {
      const parsed = setlistSchemas.create.parse({ name: 'Show' })
      expect(parsed.description).toBeUndefined()
      expect('name' in parsed).toBe(true)
    })

    it('demais campos inalterados: name continua obrigatório', () => {
      expect(() => setlistSchemas.create.parse({ description: null })).toThrow()
    })
  })

  describe('update', () => {
    it('aceita description: null e o null atravessa o parse como null (semântica de "limpar")', () => {
      const parsed = setlistSchemas.update.parse({ description: null })
      expect(parsed).toHaveProperty('description', null)
    })

    it('aceita description como string', () => {
      const parsed = setlistSchemas.update.parse({ description: 'nova descrição' })
      expect(parsed.description).toBe('nova descrição')
    })

    it('description ausente permanece undefined (semântica de "não mexer")', () => {
      const parsed = setlistSchemas.update.parse({ name: 'Novo nome' })
      expect(parsed.description).toBeUndefined()
    })

    it('demais campos inalterados: songs inválido continua rejeitado', () => {
      expect(() =>
        setlistSchemas.update.parse({ description: null, songs: 'não-é-array' })
      ).toThrow()
    })
  })
})
