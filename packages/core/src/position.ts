/**
 * Navegação no palco (PRD T1-R24, T1-R27, T1-R29; aceites A12, A14).
 * Posições 1-based, como a API; nada circula.
 *
 * Commit 1 de 2 (regra nº 7): stub — a implementação entra no commit 2.
 */
import type { SetlistSongDTO } from './types'

export function nextPosition(_pos: number, _n: number): number {
  throw new Error('not implemented')
}

export function prevPosition(_pos: number, _n: number): number {
  throw new Error('not implemented')
}

export function endOfSetlist(_pos: number, _n: number): boolean {
  throw new Error('not implemented')
}

export function songKey(_song: SetlistSongDTO): string {
  throw new Error('not implemented')
}
