"use client"

/**
 * O gerente de `/setlists` (I1-PR-13; folha `8-setlists`): a lista à esquerda e a setlist aberta à direita (2 : 3 em
 * C; em B a aberta desce), os três diálogos — o formulário, o apagar, o picker — e UMA linha por lugar: abaixo do
 * título da lista (a sessão; a carga que falhou sem lista na tela; *esta setlist já foi apagada*), abaixo do cabeçalho
 * da setlist (o remover) e dentro do diálogo (criar, salvar, apagar, adicionar). A lógica é do `useSetlists`.
 */
import { LinhaDaTela, type FalhaDaTela } from "@/components/identidade/linha-da-tela"
import { CONTROLE_LISTA } from "@/components/identidade/controles"
import { Icone } from "@/components/identidade/icone"
import { ApagarSetlist } from "@/components/setlists/apagar"
import { CartaoDaSetlist } from "@/components/setlists/cartao"
import { SetlistAberta } from "@/components/setlists/detalhe"
import { linhaDaFalha } from "@/components/setlists/falhas-das-setlists"
import { FormularioDeSetlist } from "@/components/setlists/formulario"
import { FRASES_SET, contagemDeSetlists, exibir } from "@/components/setlists/frases-setlists"
import { Blocos, CabecalhoDaLista, Caixa, Colunas, FRASE_DA_CAIXA, PainelSemSetlist, SetlistsCarregando } from "@/components/setlists/moldura"
import { PickerDeMusicas } from "@/components/setlists/picker"
import { useSetlists } from "@/components/setlists/use-setlists"

export function SetlistManager() {
  const s = useSetlists()
  if (s.carregandoSessao || !s.user) return <SetlistsCarregando />

  const F = FRASES_SET
  const semLista = s.setlists.length === 0
  const carregando = s.loading && semLista
  const falhou = !s.loading && semLista && s.erro !== null
  const vazio = !s.loading && semLista && s.erro === null
  const falhaDaLista: FalhaDaTela | null = falhou ? linhaDaFalha("set.erro", s.erro, { onTentar: () => void s.reload() })
    : s.jaApagada ? { tipo: "falha", motivo: F["set.ja-apagada"] } : null
  const r = s.falhaDoRemover
  const falhaDoPainel = r && s.aberta?.setlist_songs.some((l) => l.id === r.linha.id)
    ? linhaDaFalha("set.erro.remover", r.erro, { dados: { título: exibir(r.linha.content).titulo }, onTentar: () => void s.remover(r.linha) })
    : null

  return (
    <>
      <Colunas
        lista={<>
          <CabecalhoDaLista contagem={semLista ? undefined : contagemDeSetlists(s.setlists.length)} onNova={s.nova} />
          <LinhaDaTela falha={falhaDaLista} rotuloTentar={F["acao.tentar"]} />
          {carregando && <Blocos />}
          {falhou && <Caixa />}
          {vazio && (
            <Caixa>
              <p className={FRASE_DA_CAIXA}>{F["set.vazio"]}</p>
              <p className="text-tam-label text-cor-muted">{F["set.vazio.apoio"]}</p>
              <button type="button" onClick={s.nova} className={`${CONTROLE_LISTA} border-cor-accent-ink`}>
                <Icone nome="nova-setlist" tamanho={24} className="text-cor-accent-ink" />
                {F["set.vazio.acao"]}
              </button>
            </Caixa>
          )}
          {s.setlists.map((setlist) => (
            <CartaoDaSetlist key={setlist.id} setlist={setlist} aberta={s.aberta?.id === setlist.id} onAbrir={s.abrir} onEditar={s.editar} onApagar={s.pedirApagar} />
          ))}
        </>}
        painel={s.aberta
          ? <SetlistAberta setlist={s.aberta} falha={falhaDoPainel} onEditar={() => s.editar(s.aberta!)} onAdicionar={s.abrirPicker} onRemover={s.remover} />
          : <PainelSemSetlist frase={semLista ? undefined : F["set.nenhuma"]} />}
      />
      {s.formulario && (
        <FormularioDeSetlist key={s.formulario.editando?.id ?? "nova"} editando={s.formulario.editando} enviando={s.formulario.enviando}
          erro={s.formulario.erro} onEnviar={s.enviarFormulario} onFechar={s.fecharFormulario} />
      )}
      {s.apagar && (
        <ApagarSetlist nome={s.apagar.setlist.name} enviando={s.apagar.enviando} erro={s.apagar.erro} onApagar={s.confirmarApagar} onFechar={s.fecharApagar} />
      )}
      {s.picker && s.aberta && (
        <PickerDeMusicas setlist={s.aberta} biblioteca={s.content} bibliotecaInteira={s.bibliotecaInteira} erroDaBiblioteca={s.erroDaBiblioteca}
          onRecarregar={() => void s.reload()} selecionadas={s.picker.selecionadas} onSelecionar={s.selecionar} enviando={s.picker.enviando}
          erro={s.picker.erro} onAdicionar={s.adicionar} onFechar={s.fecharPicker} />
      )}
    </>
  )
}
