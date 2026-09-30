"use client"

/**
 * A lógica de `/setlists` (I1-PR-13): os dados (`useSetlistData`), a setlist aberta, os três diálogos e as cinco
 * escritas — com a FALHA de cada uma como estado da tela (antes, toasts de um `Toaster` que nunca foi montado: H-I1-5).
 * O que se envia é o de antes (o gate `tests/gates/i1-setlists-escritas.test.tsx`); mudam, por decisão (I1-D9, N2
 * §10.3.5/.6; aval do commit 1):
 *  · remover é pelo id da LINHA (o defeito (a) removia pelo content: com bis, apagava a 1ª e sumia com todas);
 *  · a música adicionada entra com o `id` e o `position` que a rota devolveu (o defeito (b) inventava um id);
 *  · o 404 de uma escrita fecha o que estava aberto e RELÊ a lista; *esta setlist já foi apagada* se ela não voltou
 *    (o defeito (c) deixava o diálogo aberto e mudo; decisão 3);
 *  · na falha a meio da adição, as que entraram ficam na lista e saem da seleção — *Tentar de novo* manda só as que
 *    faltam (decisão 2: sem duplicar escrita).
 * A setlist aberta é derivada da lista pelo id: o que a lista relê, o painel mostra.
 */
import { useCallback, useMemo, useRef, useState } from "react"
import { useFirebaseAuth } from "@/contexts/firebase-auth-context"
import { useSetlistData } from "@/hooks/use-setlist-data"
import { addSongToSetlist, createSetlist, deleteSetlist, removeSongFromSetlist, updateSetlist } from "@/lib/setlist-service"
import { naoExiste } from "@/components/setlists/falhas-das-setlists"
import type { FormularioDaSetlist, LinhaDaSetlist, SetlistComMusicas } from "@/components/setlists/tipos"

type Formulario = { editando: SetlistComMusicas | null; enviando: boolean; erro: unknown | null }
type Apagar = { setlist: SetlistComMusicas; enviando: boolean; erro: unknown | null }
type Picker = { selecionadas: string[]; enviando: boolean; erro: unknown | null }

export function useSetlists() {
  const { user, isLoading } = useFirebaseAuth()
  const dados = useSetlistData(user, !isLoading)
  const { setlists, setSetlists, content, reload } = dados
  const [abertaId, setAbertaId] = useState<string | null>(null)
  const [jaApagada, setJaApagada] = useState(false)
  const [formulario, setFormulario] = useState<Formulario | null>(null)
  const [apagar, setApagar] = useState<Apagar | null>(null)
  const [picker, setPicker] = useState<Picker | null>(null)
  const [falhaDoRemover, setFalhaDoRemover] = useState<{ linha: LinhaDaSetlist; erro: unknown } | null>(null)
  const removendo = useRef(new Set<string>())
  const aberta = useMemo(() => setlists.find((s) => s.id === abertaId) ?? null, [setlists, abertaId])

  /** O 404 de uma escrita: relê a lista; se a setlist não voltou, a tela diz que ela já foi apagada. */
  const sumiu = useCallback(async (id: string, certo = false) => {
    const relida = await reload()
    if (relida ? !relida.some((s) => s.id === id) : certo) setJaApagada(true)
  }, [reload])

  const abrir = useCallback((s: SetlistComMusicas) => { setJaApagada(false); setFalhaDoRemover(null); setAbertaId(s.id) }, [])
  const nova = useCallback(() => { setJaApagada(false); setFormulario({ editando: null, enviando: false, erro: null }) }, [])
  const editar = useCallback((s: SetlistComMusicas) => { setJaApagada(false); setFormulario({ editando: s, enviando: false, erro: null }) }, [])
  const pedirApagar = useCallback((s: SetlistComMusicas) => { setJaApagada(false); setApagar({ setlist: s, enviando: false, erro: null }) }, [])
  const abrirPicker = useCallback(() => { setJaApagada(false); setPicker({ selecionadas: [], enviando: false, erro: null }) }, [])

  const enviarFormulario = useCallback(async (d: FormularioDaSetlist) => {
    if (!user?.uid || !formulario) return
    const editando = formulario.editando
    const corpo = { name: d.name, description: d.description || null, performance_date: d.performance_date || null, venue: d.venue || null, notes: d.notes || null }
    setFormulario({ editando, enviando: true, erro: null })
    try {
      if (editando) {
        const atualizada = await updateSetlist(editando.id, corpo)
        if (atualizada) setSetlists((prev) => prev.map((s) => (s.id === editando.id ? { ...s, ...atualizada } : s)))
      } else {
        const criada = await createSetlist(corpo)
        if (criada) setSetlists((prev) => [{ ...criada, setlist_songs: [] }, ...prev])
      }
      setFormulario(null)
    } catch (erro) {
      if (editando && naoExiste(erro)) { setFormulario(null); await sumiu(editando.id); return }
      setFormulario({ editando, enviando: false, erro })
    }
  }, [user?.uid, formulario, setSetlists, sumiu])

  const confirmarApagar = useCallback(async () => {
    if (!user?.uid || !apagar || apagar.enviando) return
    const { setlist } = apagar
    setApagar({ setlist, enviando: true, erro: null })
    try {
      await deleteSetlist(setlist.id)
      setSetlists((prev) => prev.filter((s) => s.id !== setlist.id))
      setApagar(null)
    } catch (erro) {
      if (naoExiste(erro)) {
        setApagar(null)
        setSetlists((prev) => prev.filter((s) => s.id !== setlist.id))
        await sumiu(setlist.id, true)
        return
      }
      setApagar({ setlist, enviando: false, erro })
    }
  }, [user?.uid, apagar, setSetlists, sumiu])

  const adicionar = useCallback(async () => {
    if (!aberta || !user?.uid || !picker || picker.enviando || picker.selecionadas.length === 0) return
    const setlistId = aberta.id, fila = [...picker.selecionadas]
    const posicoes = aberta.setlist_songs.map((l) => l.position)
    const proxima = posicoes.length > 0 ? Math.max(...posicoes) + 1 : 1
    setPicker({ selecionadas: fila, enviando: true, erro: null })
    try {
      for (let i = 0; i < fila.length; i++) {
        const id = fila[i] as string
        const musica = content.find((c) => c.id === id)
        if (musica) {
          const linha = await addSongToSetlist(setlistId, id, proxima + i)
          // a linha que a rota devolveu: o id e a posição são os do servidor
          const entrou: LinhaDaSetlist = { id: String(linha.id), position: Number(linha.position ?? proxima + i), notes: linha.notes ?? null, content: musica }
          setSetlists((prev) => prev.map((s) => (s.id === setlistId ? { ...s, setlist_songs: [...s.setlist_songs, entrou] } : s)))
        }
        setPicker((p) => (p ? { ...p, selecionadas: p.selecionadas.filter((x) => x !== id) } : p))
      }
      setPicker(null)
    } catch (erro) {
      if (naoExiste(erro)) { setPicker(null); await sumiu(setlistId); return }
      setPicker((p) => (p ? { ...p, enviando: false, erro } : p))
    }
  }, [aberta, user?.uid, picker, content, setSetlists, sumiu])

  const remover = useCallback(async (linha: LinhaDaSetlist) => {
    if (!aberta || !user?.uid || removendo.current.has(linha.id)) return
    const setlistId = aberta.id
    removendo.current.add(linha.id)
    setFalhaDoRemover(null)
    try {
      await removeSongFromSetlist(linha.id)
      setSetlists((prev) => prev.map((s) => (s.id === setlistId ? { ...s, setlist_songs: s.setlist_songs.filter((l) => l.id !== linha.id) } : s)))
    } catch (erro) {
      if (naoExiste(erro)) await sumiu(setlistId)
      else setFalhaDoRemover({ linha, erro })
    } finally {
      removendo.current.delete(linha.id)
    }
  }, [aberta, user?.uid, setSetlists, sumiu])

  return {
    ...dados, user, carregandoSessao: isLoading, aberta, jaApagada, formulario, apagar, picker, falhaDoRemover,
    abrir, nova, editar, pedirApagar, abrirPicker, enviarFormulario, confirmarApagar, adicionar, remover,
    fecharFormulario: () => setFormulario(null), fecharApagar: () => setApagar(null), fecharPicker: () => setPicker(null),
    selecionar: (ids: string[]) => setPicker((p) => (p ? { ...p, selecionadas: ids } : p)),
  }
}
