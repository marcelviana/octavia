/**
 * S5 — Fim da setlist (PRD T1-R29; aceite A14), com o acabamento do DESIGN-V1
 * na V1-PR6 (as molduras `S5` e `S5-n-grande` do `telas.html`, com as erratas
 * da §9 prevalecendo).
 *
 * Avançar na última música chega aqui: "fim da setlist", com "voltar ao
 * início" e "sair". A borda esquerda continua funcionando e devolve à última
 * música; **nada** leva para fora do app sem o botão — o beco sem saída e a
 * saída acidental são justamente o que o requisito proíbe.
 *
 * O que a V1-PR6 mudou é pintura, não comportamento:
 *
 *  - o título passa a `size.display` (52). O degrau nasceu na V1-PR3, pela
 *    §4.4, e esta é a primeira e única tela que o usa: "o único momento em que
 *    a tela pode ocupar espaço". O tracking vai a `displayWide` (0,22), que é
 *    o degrau mais próximo dos 0,2 em da moldura;
 *  - a **fileira de marcas** de música percorrida, uma por posição, com a
 *    regra de N grande da §7.1 (ver `marcas()` abaixo);
 *  - a contagem ganha o `n.º de músicas` de 20 em `lineInfo`, e os dois botões
 *    ganham `voltar ao início` e `sair` de 24.
 *
 * O que NÃO mudou, e por quê: **a barra superior**. As molduras `S5` e `S3`
 * desenham as duas com 88 dp de altura e o "n de N" em IBM Plex Mono 600 de
 * 20; o app tem 64 e Raleway de 22 nas duas, iguais entre si. A §1 congela a
 * barra superior do S3 ("no S3 mexe só na barra inferior"), então mudar só a
 * do S5 abriria 24 dp e uma família de diferença entre duas telas que o músico
 * atravessa deslizando — que é exatamente o salto que a nota da própria
 * moldura `S5` diz querer evitar quando explica por que manteve a barra
 * inferior vazia. As duas mudam juntas, na PR que tocar o S3, ou não mudam.
 *
 * **N3-E17** (decisão do Marcel, 2026-09-25; div. 442): a N3-PR5 deu à barra
 * do palco 88 em B (N3-D13), e a S5 ficou com 64 — o salto de 24 dp ao chegar
 * ao fim. A altura da barra superior passa a ser o token da barra do palco
 * (`faixas[…].palco.barra`, o mesmo nó do `theme.ts`, não uma cópia): 64 em
 * C, 88 em B. "Vazia": o conteúdo é o de C — `n DE N` e a setlist, numa
 * linha —, sem a segunda linha do palco.
 */
import { useCallback, useState } from 'react'
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native'
import { Icone } from '../icones/Icone'
import { log } from '../log'
import { bar, dark, faixas, font, radius, size, space, touch, tracking } from '../theme'
import { useFaixa } from '../useFaixa'

export interface EndScreenProps {
  nomeSetlist: string
  total: number
  onVoltarUltima: () => void
  onVoltarInicio: () => void
  onSair: () => void
}

/**
 * §7.1, a regra de N grande, medida e não afirmada. A fileira tem 900 dp
 * úteis, a marca vai de 34 dp até um piso de 6, e a folga é fixa em 5:
 *
 *   8 → 34 dp · 60 → 10 dp · 128 é o último N em que a marca ainda é marca.
 *
 * Os três números da §7.1 saem daqui: com folga fixa a marca chega ao piso em
 * N = 82 (6,04 dp), e daí em diante quem encolhe é a FOLGA, até 1 dp — é esse
 * segundo trecho que faz de **128** o último N (folga 1,04) e de 129 o
 * primeiro fora (0,98). Acima disso a fileira vira uma barra sólida de
 * 900 × 3 e a contagem abaixo carrega o número sozinha (`null` aqui).
 *
 * Os 900 são os de **C**. A largura da fileira é token de faixa
 * (`faixas[…].s5.fileira`, N3-PR6c, div. 461): em **B**, 663 — com 900 a
 * fileira passava da janela de 711,1 a partir de N = 19. Em B os mesmos três
 * trechos caem noutros N: 8 → 34 dp, a marca chega ao piso em N = 60 (6 dp,
 * a fileira com 655), e 94 é o último N em que a marca ainda é marca (95 é a
 * barra sólida de 663).
 */
const MARCA = { maxima: 34, piso: 6, altura: 3, raio: 2 }
const FOLGA = 5

function marcas(n: number, fileira: number): { largura: number; folga: number } | null {
  if (n <= 0) return null
  if (n === 1) return { largura: MARCA.maxima, folga: FOLGA }
  const cabe = (fileira - FOLGA * (n - 1)) / n
  if (cabe >= MARCA.piso) return { largura: Math.min(MARCA.maxima, Math.floor(cabe)), folga: FOLGA }
  const folga = (fileira - MARCA.piso * n) / (n - 1)
  return folga >= 1 ? { largura: MARCA.piso, folga: Math.floor(folga * 10) / 10 } : null
}

/**
 * As marcas não levam nome acessível: a contagem logo abaixo já diz "n
 * músicas", e repeti-la seria ler duas vezes a mesma coisa. Nenhuma `View`
 * daqui é nó de texto, então nada entra no `content-desc`.
 */
function Percorridas({ total, fileira }: { total: number; fileira: number }): React.JSX.Element {
  const m = marcas(total, fileira)
  if (m === null) return <View style={[styles.fileira, styles.barraSolida, { width: fileira, maxWidth: fileira }]} />
  return (
    <View style={[styles.fileira, { gap: m.folga, maxWidth: fileira }]}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.marca, { width: m.largura }]} />
      ))}
    </View>
  )
}

export function EndScreen({
  nomeSetlist,
  total,
  onVoltarUltima,
  onVoltarInicio,
  onSair,
}: EndScreenProps): React.JSX.Element {
  // As duas linhas eram idênticas às do `StageScreen` e herdavam o mesmo
  // transbordo de 84,0 dp (V1-PRECHECK §3.4, div. 16) — com uma borda só.
  // Método e razão: a nota longa no `StageScreen`.
  const [meio, setMeio] = useState<{ largura: number; altura: number } | null>(null)
  const medirMeio = useCallback((e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout
    setMeio((m) => (m !== null && m.largura === w && m.altura === h ? m : { largura: w, altura: h }))
  }, [])
  const larguraBorda = meio === null ? 0 : Math.max(meio.largura * 0.15, touch.min)
  const alturaConteudo = meio === null ? 0 : Math.max(meio.altura, touch.min)
  const faixa = useFaixa()
  const t = faixas[faixa].palco

  return (
    <View style={styles.tela}>
      <View style={[styles.barraTopo, { height: t.barra }]}>
        <Text style={styles.posicao}>{`${total} DE ${total}`}</Text>
        <Text style={styles.nomeSetlist} numberOfLines={1}>
          {nomeSetlist}
        </Text>
      </View>

      <View style={styles.meio} onLayout={medirMeio}>
        <View style={styles.centro}>
          <View style={styles.bloco}>
            <Percorridas total={total} fileira={faixas[faixa].s5.fileira} />
            <Text style={styles.titulo}>FIM DA SETLIST</Text>
            <View style={styles.contagem}>
              <Icone nome="n-de-musicas" tamanho={20} cor={dark.lineInfo} />
              <Text style={styles.apoio}>
                {`${total} ${total === 1 ? 'música' : 'músicas'}  ·  ${nomeSetlist}`}
              </Text>
            </View>
          </View>
          <View style={styles.acoes}>
            <Pressable style={styles.botaoPrimario} onPress={onVoltarInicio} testID="voltar-inicio">
              <Icone nome="voltar-ao-inicio" tamanho={24} cor={dark.bg} />
              <Text style={styles.botaoPrimarioTexto}>Voltar ao início</Text>
            </Pressable>
            <Pressable style={styles.botaoSecundario} onPress={onSair} testID="sair">
              <Icone nome="sair" tamanho={24} cor={dark.text} />
              <Text style={styles.botaoSecundarioTexto}>Sair</Text>
            </Pressable>
          </View>
        </View>

        {/* Borda esquerda: volta à última música. A direita NÃO existe aqui —
            não há para onde avançar, e sair só pelo botão (T1-R29). */}
        {meio !== null ? (
          <Pressable
            style={[styles.borda, { width: larguraBorda, height: alturaConteudo, left: 0 }]}
            onPress={() => {
              log(`nav n=${total}/${total} setlist=fim t=0`)
              onVoltarUltima()
            }}
            testID="borda-voltar"
          />
        ) : null}
      </View>

      <View style={styles.barraBaixo} />
    </View>
  )
}

/**
 * Medidas das molduras `S5` e `S5-n-grande`. Onde a moldura usa um número
 * fora das escalas do `theme.ts`, entra o degrau mais próximo — a regra da
 * **errata E10**; a tabela desta tela está no anexo da PR. Ficam como literal,
 * declarados, os que não têm degrau nem escala: a fileira (900 em C, token de faixa desde a N3-PR6c) e os
 * 34 · 6 · 5 · 3 · 2 da §7.1, e o corpo 13 do nome da setlist (§4.4
 * "chip / status").
 */
const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: dark.bg },
  // A altura é o token da barra do palco (N3-E17): 64 em C, 88 em B.
  barraTopo: {
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    borderBottomWidth: bar.hairline,
    borderBottomColor: dark.line,
  },
  posicao: {
    color: dark.text,
    fontFamily: font.display,
    fontSize: size.title,
    letterSpacing: size.title * tracking.display,
  },
  nomeSetlist: {
    color: dark.muted,
    fontFamily: font.ui,
    fontSize: 13,
    letterSpacing: 13 * tracking.label,
    textTransform: 'uppercase',
  },
  meio: { flex: 1 },
  // O gap do `centro` mais o `marginTop` das ações somam os 40 dp que a
  // moldura põe entre o bloco e os botões (empate 32/48 na escala: fica o que
  // o app já tinha, 16 + 24).
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg },
  bloco: { alignItems: 'center', gap: space.xl },
  // A largura (a `maxWidth` da fileira e a da barra sólida) é o token da faixa (div. 461): 900 em C, 663 em B.
  fileira: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  marca: { height: MARCA.altura, borderRadius: MARCA.raio, backgroundColor: dark.accentInk },
  barraSolida: {
    height: MARCA.altura,
    borderRadius: MARCA.raio,
    backgroundColor: dark.accentInk,
  },
  titulo: {
    color: dark.text,
    fontFamily: font.display,
    fontSize: size.display,
    letterSpacing: size.display * tracking.displayWide,
    lineHeight: size.display,
    textAlign: 'center',
  },
  contagem: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  apoio: { color: dark.muted, fontFamily: font.ui, fontSize: size.body },
  acoes: { flexDirection: 'row', gap: space.lg, marginTop: space.xl },
  botaoPrimario: {
    height: touch.stage,
    paddingHorizontal: space.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderRadius: radius.control,
    backgroundColor: dark.text,
  },
  botaoPrimarioTexto: { color: dark.bg, fontFamily: font.uiBold, fontSize: size.input },
  botaoSecundario: {
    height: touch.stage,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderWidth: bar.hairline,
    borderColor: dark.line,
    borderRadius: radius.control,
  },
  botaoSecundarioTexto: { color: dark.text, fontFamily: font.ui, fontSize: size.input },
  borda: { position: 'absolute', top: 0 },
  barraBaixo: { height: bar.stage, borderTopWidth: bar.hairline, borderTopColor: dark.line },
})
