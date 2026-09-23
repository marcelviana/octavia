# N2 — ENCERRAMENTO

**A fonte do bloco — e um índice, não uma segunda cópia.** Tudo o que este
arquivo afirma aponta para o documento, a PR ou o anexo onde está; onde a
prosa daqui e a fonte divergirem, vale a fonte. Nenhum texto de decisão ou de
errata é reescrito aqui.

- **Bloco**: N2 — a tela 2 do app nativo, **escrita de setlist**: criar com nome
  e data, renomear, datar, apagar, adicionar e remover músicas, reordenar —
  contra o backend atual, com o hotfix de segurança que o pre-check achou.
- **Janela**: 2026-09-16 (pre-check, #306) → 2026-09-23 (PR-7, #319, merge
  `bc55419` às 14:02:31Z).
- **Esta PR**: só docs, sobre `origin/main` = `bc55419`, árvore
  `../octavia-n2-fim`, branch `n2/encerramento`. Nenhuma request a prod, nenhum
  `adb`.
- **Convenção**: `[medido]` = comando + saída literal, nesta sessão; `[lido]` =
  tirado do documento citado, sem medir de novo.
- **Divergências desta PR**: **335 a 345** (§12).

> **A TELA VENCE O LOG.**
> O log estava perfeito — `write op=delete … 200`, `resync … 200`,
> `cache write … invalidated=1` — e S1 voltava mostrando a setlist apagada.
> — div. 270, N2-PR4 (regra 15 do catálogo, §5)

---

## 1. O que o N2 entregou

**Para o músico**: a tela 2 é montar o repertório do próximo show **no próprio
tablet** — criar a setlist, achar as músicas pela busca e pô-las ali, tirar,
reordenar com o dedo, apagar —, e saber, quando a rede ou o servidor falha, se
a mudança foi gravada ou não. O J3 (`docs/ux/JOBS.md:79-106`) medido ponta a
ponta no Tab S6 `[lido: N2-PR7-anexos/aparato.md §4, j3.txt]`:

| passo do J3 | gestos | critério do J3 |
|---|---|---|
| criar a setlist vazia | **3** (`Nova setlist` · digitar · `Criar`) | ≤ 3 ✓ |
| 1ª música | **3** (`Adicionar música` · digitar · `Adicionar`) | ≤ 3 por música ✓ |
| 2ª a 4ª | **1** cada | ✓ |
| 5ª | **2** (uma rolagem + `Adicionar`; div. 332) | ✓ |
| reordenar | **3** (entrar · 1 arrasto · `Salvar a ordem`) | drag funcional ✓ |
| total | **16** gestos, 7 escritas | |

Tempo de parede 73,2 s, dos quais ~67 s são do arnês (`uiautomator dump` a
2,26–2,36 s cada, 20 dumps, 21,1 s de pausa escrita); **o lado do app, somado
do log das 7 escritas (`write` + `resync`), é 1,29 s**. A listagem final mostra
título, artista e tipo sem abrir item (dump `t-j3-final.xml`).

**As 14 PRs** `[medido: gh pr view <n> --json commits,mergeCommit]` — em ordem de
número; a de merge difere em dois pontos (a #307 entrou antes da #306; a #310
antes da #309):

| PR | merge | commits | o que entrou | onde está registrado | divs. |
|---|---|---|---|---|---|
| **#306** | `c33c794` | 4 | pre-check: Fase A estática, Fase B (5 requests a prod, zero escrita), posse por rota; **N2-D1…D11** | `N2-PRECHECK.md`, `N2-PRECHECK-anexos/` | 144–162 |
| **#307** | `e20c0a4` | 2 | **hotfix da div. 150**: o `DELETE /api/setlists/[id]` apagava as músicas de **qualquer** setlist (service role, sem filtro de dono) — agora checa dono; **N2-D12**: inexistente e alheia → 404 byte-idêntico (sem oráculo) | `docs/ux/HOTFIX-150.md` §1–§5 | 170–176 |
| **#308** | `984051d` | 2 | PR-0: `PRD-TELA-2.md` (rev. 0 e 1), errata do `SETLISTS.md` (criar, editar, apagar; **regra 9**); **N2-D13…D22** | `PRD-TELA-2.md` §0, §13–§14; `docs/api/SETLISTS.md` | 177–186 |
| **#309** | `adf32e6` | 7 | PR-1: **T1-R10 ligado** (N2-D8) — `invalidated=` passa a ser contador real; poda do `g1.sh` (div. 141); div. 121 fechada; aceite no Tab S6 | `N2-PR1-anexos/README.md`; caso 21 do catálogo | 187–199 |
| **#310** | `13b1a7b` | 3 | capturas de S1–S4 para o brief; **anexo não carrega texto de música** (regra no `CLAUDE.md`), cinco dumps e cinco PNGs do V1-PR7 limpos | `N2-BRIEF-anexos/README.md`, `MEDIDAS.md` | 200–211 |
| **#311** | `7039a82` | 4 | hotfix: o ramo **alheia** provado em prod, vazio e **com músicas** — a div. 150 fechada nos **três ramos** com dado real (inexistente no preview; alheia vazia e com músicas em prod; os três 404 byte-idênticos, 48 B, sha `9b7d9169…`) | `HOTFIX-150.md` §3.1–§3.2 | 212–214 |
| **#312** | `5f1c226` | 3 | **W4-a** (instrumento): errata do G3 em **par**; `g1.sh`/`g2g3.sh` recusam chamada sem par; aviso de errata não usada; os dumps idênticos do V1 | `W4A-anexos/README.md`; casos 22 e 23 | 215–220 |
| **#313** | `becdf7e` | 1 | **desenho congelado** (18 molduras, 5 ícones, `SHA256SUMS`); **N2-D23…D34**; errata E17 no `DESIGN-V1` | `DESIGN-N2/README.md` §1–§8 | 221–225 |
| **#314** | `fedfd24` | 4 | PR-2: o **core da escrita**, sem tela — seis operações, releitura após todo 2xx, sete espécies, conjunto fechado de frases, três linhas de log novas (G3 57 → 64) | `PRD-TELA-2.md` rev. 2 e §13; `LOGS-OCTAVIA.md` "Errata N2-PR2"; `N2-PR2-anexos/` | 226–233 |
| **#315** | `0fa1b75` | 5 | PR-3: S1 com `Nova setlist`, folha de criar, linha de aviso de 48 dp; `datetimepicker` (módulo nativo); projeto `native-tela`; **primeiro `POST` do nativo em prod** | `DESIGN-N2` §9 (E1–E6); `N2-PR3-anexos/` | 234–261 |
| **#316** | `8bd4281` | 5 | PR-4: S2 com edição — renomear e datar, remover, apagar; **prazo de rede de 20 s** (N2-D35); dois defeitos achados no aparelho e consertados (269, 270) | `DESIGN-N2` §9 (E7–E9); `N2-PR4-anexos/` | 262–272 |
| **#317** | `f991eb0` | 6 | PR-5: o modo de reordenar (`PanResponder`, sem módulo nativo); **N2-D36 revista, N2-D37**; regra do avião | `DESIGN-N2` §9 (E10–E14); `N2-PR5-anexos/` | 273–300 |
| **#318** | `426f4cc` | 4 | PR-6: o picker; `gate:icones` sem pendentes | `DESIGN-N2` §9 (E15–E18); `N2-PR6-anexos/` | 301–318 |
| **#319** | `bc55419` | 8 | PR-7: estados transversais, aceite completo nos dois aparelhos; `sem-resposta` (E19); G1b com pares; dois defeitos consertados (327, 333) | `DESIGN-N2` §9 (E19–E23); `N2-PR7-anexos/` | 319–334 |

---

## 2. Decisões N2-D1…D37

O texto de cada decisão vive **só** no documento da última coluna. A segunda
coluna é um rótulo para achar a linha, não a decisão.

| # | rótulo | onde o texto vive |
|---|---|---|
| N2-D1 | recorte: só escrita de setlist | `N2-PRECHECK.md` §0.1 |
| N2-D2 | escrita só online; sem fila offline | `N2-PRECHECK.md` §0.1 |
| N2-D3 | da dívida do palco só a div. 121; o resto ao W4 | `N2-PRECHECK.md` §0.1 |
| N2-D4 | design novo pelo Claude Design; §8.3 do V1 no brief | `N2-PRECHECK.md` §0.1 |
| N2-D5 | probe dos workflows de CI; a PR do pre-check testa a proteção | `N2-PRECHECK.md` §0.1 |
| N2-D6 | hotfix das divs. 150/151 antes de qualquer escrita | `N2-PRECHECK.md` §0.1 (aval da Fase A) |
| N2-D7 | errata do `SETLISTS.md` na PR-0 | `N2-PRECHECK.md` §0.1 |
| N2-D8 | T1-R10 como primeira PR de código, gate antes | `N2-PRECHECK.md` §0.1 |
| N2-D9 | 401 de escrita não desloga | `N2-PRECHECK.md` §0.1; aplicada em `PRD-TELA-2.md` §3 |
| N2-D10 | Fase B: B-c, B-a, B-b, B-d sim; B-e adiado; B-f vetado | `N2-PRECHECK.md` §0.1 |
| N2-D11 | A10 continua dependendo de uso real | `N2-PRECHECK.md` §0.1 |
| N2-D12 | 404 sem oráculo para inexistente e alheia | `docs/ux/HOTFIX-150.md` §1.1 |
| N2-D13 | releitura `GET /api/setlists` após todo 2xx (Q1) | `PRD-TELA-2.md` §0 |
| N2-D14 | diálogo de apagar (Q2) | `PRD-TELA-2.md` §0 |
| N2-D15 | picker marca o que já está, bis permitido (Q3) | `PRD-TELA-2.md` §0 |
| N2-D16 | entrada de criar como recomendação ao brief (Q4) | `PRD-TELA-2.md` §0 |
| N2-D17 | acima de 100: adicionar sim, reordenar inativo (Q5) | `PRD-TELA-2.md` §0 |
| N2-D18 | "tentar de novo" só depois da releitura; "pode ter gravado" (Q6) | `PRD-TELA-2.md` §0 |
| N2-D19 | S2 vinda do palco sem edição (Q7) | `PRD-TELA-2.md` §0 |
| N2-D20 | criar só com nome e data; `songs[]` fora (Q8) | `PRD-TELA-2.md` §0 |
| N2-D21 | o cliente valida só o que é dele (Q9) | `PRD-TELA-2.md` §0 |
| N2-D22 | salvo com releitura falha é estado próprio (Q10) | `PRD-TELA-2.md` §0 |
| N2-D23 | motivo de inativo legível sem toque, regra única | `DESIGN-N2/README.md` §2 |
| N2-D24 | §8.3 do V1: não, com gatilho | `DESIGN-N2/README.md` §2 |
| N2-D25 | canvas de 627 dp | `DESIGN-N2/README.md` §2 |
| N2-D26 | faixa de edição de 64 dp em S2 | `DESIGN-N2/README.md` §2 |
| N2-D27 | modo de reordenar em coluna única | `DESIGN-N2/README.md` §2 |
| N2-D28 | remover sem diálogo; apagar com diálogo | `DESIGN-N2/README.md` §2 |
| N2-D29 | mover por número e >100 fora do N2 | `DESIGN-N2/README.md` §2 |
| N2-D30 | rodapé do picker; total só da releitura | `DESIGN-N2/README.md` §2 |
| N2-D31 | limite de taxa: número só se o servidor mandar | `DESIGN-N2/README.md` §2 (medida na N2-PR2: manda — div. 225) |
| N2-D32 | releitura falha → só "Tentar recarregar" | `DESIGN-N2/README.md` §2 |
| N2-D33 | os cinco ícones entram pela E17 (39) | `DESIGN-N2/README.md` §2 |
| N2-D34 | div. 83 decidida: o G3 conta comentário; remoção como par com razão (mecanismo do W4-b) | `DESIGN-N2/README.md` §2 |
| N2-D35 | prazo de rede de 20 s | `PRD-TELA-2.md` §0 |
| N2-D36 | `Salvar a ordem` inativo enquanto nada mudou (**revista** em 2026-09-22) | `PRD-TELA-2.md` §0; resolução em `DESIGN-N2/README.md` §9 (div. 276) |
| N2-D37 | 400 de permutação descarta o arrasto | `PRD-TELA-2.md` §0; `DESIGN-N2/README.md` §9 (N2-E14, div. 289) |

---

## 3. Erratas do congelado, N2-E1…E23

Todas em `DESIGN-N2/README.md` §9, na seção da PR que as abriu. A última
coluna classifica o efeito — **comportamento** (o app passou a fazer outra
coisa), **medida** (só mediu e confirmou a conta do congelado), **frase**
(chaves novas no conjunto fechado, zero redação nova), **leitura** (qual das
duas coisas do congelado vale).

| # | PR | o quê | div. | efeito |
|---|---|---|---|---|
| E1 | 3 | duas frases de "pode ter gravado", quatro chaves | 237 | frase |
| E2 | 3 | "Criar começa ativo" × a moldura: vale a moldura | 243 | leitura |
| E3 | 3 | a variante da regra 4 é inalcançável na folha | 247 | leitura |
| E4 | 3 | `form-falha`, o 26º `testID` | 245, 258 | leitura |
| E5 | 3 | S1f em um nó de texto | 246 | leitura |
| E6 | 3 | `Nova setlist` mede 152,0 × 57,8 dp | 252 | **medida** |
| E7 | 4 | quatro chaves e `perguntaDeApagar` | 267 | frase |
| E8 | 4 (fechada na 7) | `Limpar` na data | 267, 319 | comportamento¹ |
| E9 | 4 | caixa do título a 272,0 dp | 271 | **medida** |
| E10 | 5 | quatro chaves e quatro construtores | — | frase |
| E11 | 5 | `Reordenar` no grupo da esquerda | 281 | leitura |
| E12 | 5 | alças inteiras durante o salvamento | 280 | leitura |
| E13 | 5 | sem opacidade 0,5 (E3 do V1) | 284 | leitura |
| E14 | 5 | 400 de permutação descarta o arrasto (N2-D37) | 289 | comportamento¹ |
| E15 | 6 | reticência do placeholder por ponto de código | — | leitura |
| E16 | 6 | duas chaves e sete construtores | 310 | frase |
| E17 | 6 | campo 900 × 48 com texto, 960 × 48 vazio | 315 | **medida** |
| E18 | 6 | rodapé com aviso a 112,9 dp | 316 | **medida** |
| E19 | 7 | a espécie `rede` se parte: `sem-resposta` | 308 | **comportamento** |
| E20 | 7 | `Adicionar` inertes sem frase durante o `POST` | 311, 320 | **comportamento**² |
| E21 | 7 | 404 com releitura falha: `sumiu-nao-relido` | 327 | **comportamento** |
| E22 | 7 | a barra do reordenar: título trunca, motivo não | 296, 322 | leitura |
| E23 | 7 | apagar 200 com releitura falha: `apagada-nao-relida` | 333 | **comportamento** |

¹ O prompt desta PR lista quatro que mudaram comportamento (E19, E20, E21,
E23). Lida a §9, **E8 e E14 também mudaram** — a E8 pôs um controle que o
congelado não desenha, a E14 trocou a R2·1 no caso do 400. Div. 342.
² A E20 **ratificou** um comportamento que já estava na `main` desde a N2-PR6
(div. 311 → div. 320); na N2-PR7 mudou o CN, não o app. Div. 342.

---

## 4. Divergências 144–334

### 4.1 A contagem

**Números atribuídos: 183** de 191 (`144…334`). Vagos: **161** (vaga de
propósito, `N2-PRECHECK.md` §13) e **163–169** (o hotfix começou em 170 para
não colidir com a #306, `HOTFIX-150.md` §5).

A taxonomia de origem (`N1-ENCERRAMENTO.md:211`: **P** premissa do prompt do
revisor · **D** doc anterior · **A** ambiente/dado real · **T** toolchain/aparato
· **X** terceiros) **só é coluna em quatro dos oito registros do bloco**. Por
origem declarada `[medido]`:

```
$ grep -rnE '^\| \*\*(1[4-9][0-9]|2[0-9][0-9]|3[0-3][0-9])\*\* \|' docs \
    | <primeira ocorrência de cada número, coluna 2>
P 24 : 144 145 146 147 148 158 159 160 162 177 182 183 186 187 188 190 192 197 198 215 217 228 230 231
A 13 : 150 151 153 154 155 156 178 179 180 181 229 232 233
D 10 : 149 184 185 193 194 218 219 220 226 227
T  5 : 189 195 196 199 216
A/T 1 : 157 · A/X 1 : 152 · P/D 1 : 191 · — 1 : 161
```

**55 com origem declarada** (fora a 161). Sem a coluna: **10** do hotfix (170–176,
212–214, em lista) e **118** das tabelas do brief e do `DESIGN-N2` §9 (200–211,
221–225, 234–334). Nestas, a origem aparece — quando aparece — escrita no texto
`[medido: grep sobre as mesmas linhas]`:

| marcador no texto | divs. |
|---|---|
| "Origem P" | 234, 301, 319, 320, 331 |
| "Origem A" | 321 |
| "O prompt…", "O roteiro…", "O §4 do prompt…" | 235, 236, 250, 258, 263, 295, 299, 304, 322 |
| "Defeito" (código) | 256, 269, 270, 286, 313, 327 (e 333, "achado lido no código") |
| "Defeito de aparato" / "Aparato" / "Arnês" / "Instrumento" | 257, 294, 317, 330, 314, 329 |
| "Extra" | 274, 275, 302, 305, 306, 309, 323, 324, 325, 328 |
| "Tensão" | 225, 289, 308, 311 |

**Atenção a uma colisão de nome**: o `X1…X5` dos extras do `DESIGN-N2` §9 é
**numeração de extra**, não a origem X (terceiros). Div. 341.

### 4.2 As que mudaram decisão

| div. | virou | onde |
|---|---|---|
| 145 | N2-D7 (contrato das três escritas da setlist) | `SETLISTS.md` |
| 150, 151 | N2-D6, N2-D12 | `HOTFIX-150.md` |
| 152 | N2-D9 | pre-check §0.1 |
| 154, 181 | N2-D21 | PRD §0 |
| 155 | N2-D17, N2-D29 | PRD §0; DESIGN-N2 §2 |
| 157 | N2-D8 (e o caso 21) | pre-check §0.1 |
| 176 | regra 9 (contrato vive no arquivo do contrato) | `SETLISTS.md`; §5 |
| 186 | N2-D23 | DESIGN-N2 §2 |
| 189 | errata do G3 em par (W4-a) | `g2g3.sh`; caso 22 |
| 204 | regra 10 (anexo sem letra) | `CLAUDE.md`; §5 |
| 216 | N2-D34 (a 83 decidida) | DESIGN-N2 §2 |
| 225 | N2-D31 medida: o servidor manda `Retry-After` | PRD rev. 2 |
| 242 | o congelado vence o T2-R1 (a folha fecha em S1) | PRD T2-R1 |
| 262 | N2-D35 | PRD §0 |
| 276 | N2-D36 revista | PRD §0 |
| 289 | N2-D37 / N2-E14 | PRD §0; DESIGN-N2 §9 |
| 290 | regra 11 (avião lido/declarado/restaurado) | PRD §8; §5 |
| 308 | N2-E19 | DESIGN-N2 §9 |
| 311 | N2-E20 | DESIGN-N2 §9 |
| 319 | N2-E8 fica como está | DESIGN-N2 §9 |
| 321 | G1b com pares | `g1.sh`; §5 regra 14 |
| 327 | N2-E21 | DESIGN-N2 §9 |
| 333 | N2-E23 | DESIGN-N2 §9 |

### 4.3 Onde o revisor errou

As de origem P — o prompt do revisor presumiu o que não era — e o que cada uma
ensinou. As do `DESIGN-N2` §9 sem coluna de origem entram pelo marcador do
texto (§4.1).

> #### 147 e 219: a razão de o encerramento ser a fonte
>
> As duas vezes, o handoff citou o `W3-ENCERRAMENTO.md` por uma estrutura que
> ele não tem. Na **147** (pre-check), *"herança 6 do W3"* e um `pnpm gate:g1`:
> o W3 não tem seção de herança e o gate é `sh apps/native/scripts/g1.sh` — a
> origem, medida no aval, era **a memória de sessão do Marcel**, citada como se
> estivesse na branch. Na **219** (W4-a, registrada como D), *"herança 5"*: de
> novo não há lista de heranças; a proposta de revisão da 83 é o **item 8 da
> §7 "Dívida"**. É exatamente o caso que a regra do `CLAUDE.md` *"estado de bloco
> é artefato de repositório"* existe para pegar: **o rastro erra de endereço, o
> encerramento commitado não tem como**. E aconteceu **uma terceira vez, no
> prompt desta PR** (div. 337): *"W3 §7: a 83, a poda do g1"* — a poda do g1 é
> a div. 141, na §3, não um item da §7. Por isso a §10 deste arquivo tem
> **nome de seção e numeração estáveis**, para que o próximo handoff cite o que
> existe.

| div. | o que o prompt presumiu | o que ensinou |
|---|---|---|
| 144 | numeração a partir da 143 | contar no repositório (`git grep`), não no handoff |
| 145 | o `SETLISTS.md` cobria as escritas da setlist | ler o contrato antes de dá-lo por completo → N2-D7 |
| 146, 182 | T1-R17 como "prefetch por data" (é o T1-R15) | citar requisito pelo texto; a troca se repetiu na PR-0 |
| 147 | "herança 6 do W3", `pnpm gate:g1` | ver o quadro acima |
| 148 | uma pasta `domains/` | `ls` antes de mandar buscar |
| 158 | numeração de hipóteses do aval | vale a do documento |
| 159 | "o mesmo mecanismo" do C e do N1 | eram dois; nomear o script, não o precedente |
| 160 | a B-d com id de setlist e cadeia B | ler a rota antes de desenhar o probe |
| 162 | corpo de prod em anexo | precedente do N1 → regra 10 |
| 177 | "409" | a taxonomia do `CONTRATO-DE-ERRO.md` não tem 409 |
| 183 | requisito de apagar no `PRD-TELA-1.md` | não existe; a tela 1 só lê |
| 186 | "motivo ao toque (padrão A15)" | contra o `DESIGN-V1:374` → N2-D23 |
| 187 | `g1.sh` sem argumentos | o gate passava sem medir → W4-a |
| 188 | aviso e exceções no mesmo commit | as duas instruções não cabiam juntas |
| 190, 231 | citação por número de linha | envelhece; citar por seção (div. 184) |
| 191 | a 121 fecha "pelo mesmo mecanismo" | fecha por outro (T1-R9 + `file_url` imutável) |
| 192 | a S4 acharia nome de setlist | a S4 indexa só content |
| 197, 198 | três eventos separados; a reversão feita | o aparelho decide o protocolo |
| 215 | a 187 nomeava só o `g1.sh` | dois gates irmãos, meio registro |
| 217 | `git log --follow` como procedência | palpite; o hash do blob é medição |
| 219 | "herança 5" | ver o quadro acima |
| 228 | prefetch após escrita "por construção" | não acontece; medir a ligação |
| 230 | formato resumido das linhas de log | vale o T2-R16 escrito |
| 234 | seletor de calendário já instalado | módulo nativo novo, dev client novo |
| 235, 236 | `App.tsx:163/177`; "quatro" pendentes | 165/178; eram cinco |
| 250 | mock na 8081; `which adb` | a 8081 é do Metro; `which` falha sem login → `APARATO.md` |
| 258 | abrir uma N2-E6 para `form-falha` | já era a N2-E4 |
| 263 | o prazo "no core" | o core é puro; o número no core, o mecanismo no `api.ts` |
| 295 | um `code` próprio para permutação inválida | não existe: `400 VALIDATION_ERROR` |
| 299 | a seção de aparato do `CLAUDE.md` | não existia → `APARATO.md` (§9) |
| 301 | `adicionarMusica` no core | não existe |
| 304 | "S2 relê" na volta do picker | já tem o conjunto da última releitura |
| 319, 320 | E8 e E20 em aberto | as duas já estavam na `main` |
| 322 | "N2-E15" para o fecho da 296 | rótulo já usado → E22 |
| 331 | 10 adições numa visita, uma bis | impossível numa setlist criada vazia |
| 332 | "1 toque nas seguintes" | a 5ª pede rolagem |

---

## 5. Catálogo — o que o N2 acrescentou ao `LOGS-OCTAVIA.md`

**Casos do padrão.** 21, 22 e 23 já estavam lá (21 pela PR-1, com a div. 157;
22 e 23 pelo W4-a). Esta PR acrescenta **24–27**:

| # | div. | PR | o instrumento |
|---|---|---|---|
| 24 | 233 | N2-PR2 | o mock que dormia **antes** de ler o modelo: a inversão não existia e o CN passava sem medir |
| 25 | 238 | N2-PR3 | o `gate:a20` leu o `frases.ts` e examinou **zero** literais — 72 antes e depois (a 229 abriu o escopo; div. 338) |
| 26 | 282 | N2-PR5 | o `gate:icones` cego a entrada escrita em várias linhas; o `apagar-setlist` passava assim desde a PR-4 |
| 27 | 294 | N2-PR5 | o Metro com `CI=1` não observa o disco — **o mesmo mecanismo da div. 127 (W1), já escrito na regra 4** |

**Regras.** O catálogo tinha oito (0–5 numeradas e duas de método, sem número);
as do N2 entram como **9–15**, porque a 9 já era citada por esse número
(`SETLISTS.md`, div. 176). Os números 6–8 não existem, e o catálogo diz isso
(div. 335).

| # | regra | origem |
|---|---|---|
| 9 | comportamento de contrato vive no arquivo do contrato | 176 |
| 10 | anexo não carrega texto de música de terceiro | 204 (`CLAUDE.md`) |
| 11 | avião em aceite manual: lido, declarado, restaurado | 290 |
| 12 | prova de escrita em prod usa recurso descartável da conta | #311, PR-3…7 |
| 13 | conferir o bundle servido antes de retestar | 294 |
| 14 | "mudou de propósito" é um par declarado, no G3 e no G1b | 189, 321 |
| 15 | **a tela vence o log** | 270 |

---

## 6. Gates no fim do bloco

Tudo `[medido]` nesta sessão, na árvore `../octavia-n2-fim` = `bc55419`.

**G1a e G1b** — `sh apps/native/scripts/g1.sh bc55419 WORKTREE`:

```
G1a — diff vazio em 39 arquivos DERIVADOS de apps/native + packages/core/src
      EXCEÇÕES DECLARADAS (o escopo desta PR):
        packages/core/src/frases.ts
        packages/core/src/escrita.ts
        apps/native/src/escrita.ts
        apps/native/src/screens/Picker.tsx
        apps/native/src/screens/IndexScreen.tsx
        apps/native/src/screens/SetlistsScreen.tsx
        apps/native/src/navigation.tsx
  G1a: DIFF VAZIO ✓ (e nenhum arquivo novo no escopo)
  G1a: EXCEÇÃO DECLARADA E NÃO USADA — poda isto ANTES do merge (div. 141):
        (as sete acima)
G1b — linhas REMOVIDAS ou ALTERADAS nos testes do core: 0
      PARES DECLARADOS (velha -> nova · razão; o escopo de decisão desta PR):
        expect(r.frase).toBe('sem conexão — nada foi salvo')
          -> expect(r.frase).toBe('sem resposta do servidor')
          · razão: N2-E19: a espécie `rede` deixa de afirmar que nada foi salvo
  G1b: só adição ✓
  G1b: PAR DECLARADO E NÃO USADO — poda isto ANTES do merge (div. 321):
[exit 0]
```

**As listas NÃO estão vazias.** A N2-PR7 entrou com **sete exceções do G1a e o
par do G1b** declarados — o gate avisou *"poda isto ANTES do merge"* e o merge
aconteceu sem a poda. É a div. 141 funcionando como foi desenhada (imprime, não
reprova) e mostrando o preço: **a próxima PR herda um G1 sete arquivos mais
permissivo**. Não podado aqui (é código, fora da lista fechada). Div. 339;
destino na §10.

**G2 e G3** — `sh apps/native/scripts/g2g3.sh bc55419 WORKTREE`:

```
G2 — testIDs  antes=79  depois=79
  G2: antes ⊆ depois ✓
G3 — linhas log( antes=64  depois=64
      ERRATAS DECLARADAS (pares velha -> nova; o escopo de log desta PR):
        (nenhuma — nenhuma linha de log pode sumir nesta PR)
  G3: nenhuma linha sumiu ✓
[exit 0]
```

O bloco inteiro, contra o ponto de partida do pre-check (`9e14042`): **G2 43 →
79**, **G3 57 → 64**. (O G3 de ponta a ponta acusa as duas linhas
`invalidated=0` que a PR-1 trocou pelo contador — errata declarada **naquela**
PR; errata não viaja entre PRs, então o par bloco-a-bloco não é gate.)

**`gate:a20`** — `node scripts/a20.mjs` (em `apps/native`), exit 0:

```
  arquivos varridos: 30 (inclui 1 de fora da raiz: ../../packages/core/src/frases.ts — N2-PR3, div. 229)
  literais em posição de texto examinados: 170
  acusações: 0
```

**`gate:icones`** — `node scripts/icones.mjs`, exit 0:

```
  §6.4: 34 linhas → 33 nomes distintos, + 4 fora do catálogo + 6 da tela 2 = 43 esperados
  anexo D: 34 registros (V1) + 5 (DESIGN-N2, E17) = 39 registros · 68 elementos distintos no do V1
  tela 2 (E17): 6/6 nomes já no mapa e cobrados · 0 declarados pendentes
  mapa: 43 nomes · 97 elementos distintos · 43 com 'normal'
  acusações: 0 · avisos: 0
```

**39 registros = 39 do anexo D**, 43 nomes (o par `adicionar/remover` é um
registro e dois nomes, div. 226).

**G5 e G6** — as tabelas por aparelho da N2-PR7 `[lido: N2-PR7-anexos/g6.md,
g5.txt]`: **G6 com 20 estados, 56/56 asserções no Tab S6 e 56/56 no AVD**; G5
sobre 40 dumps, **zero alvo real abaixo de 48 dp** nos dois (os menores são
recorte de rolagem na borda da lista, `g5-recorte.txt`); menores reais `voltar`
e `fechar-busca`, 48,0 × 48,0.

**`SHA256SUMS`** — `shasum -a 256 -c SHA256SUMS`:

```
DESIGN-N2:  telas.html: OK · telas.pdf: OK                              [exit 0]
DESIGN-V1:  README.md: FAILED · telas.html: OK · icones.html: OK · telas.pdf: OK
            shasum: WARNING: 1 computed checksum did NOT match           [exit 1]
```

O do V1 reprova **pelo README** desde a V1-PR6 (div. 223); os três congelados
seguem `OK`. Decisão **A** — o README sai do `SHA256SUMS` do V1 — destino W4-b
(§10). Os `dumps/SHA256SUMS.txt` das PRs 3–6 conferem todos; a **PR-7 não tem
`SHA256SUMS.txt`** para os seus 46 dumps (div. 343).

**Suíte** — `pnpm test` na `main`: `Test Files 107 passed | 4 skipped (111)` ·
`Tests 1029 passed | 85 skipped (1114)` · exit 0.

**Testes escritos no bloco, por PR** `[medido]`: linhas `it(`/`test(`
acrescentadas nos `*.test.ts(x)` do diff de cada merge (`git diff M^1 M`). Não
entram o CN de shell do W4-a (`cn-w4a.sh`) nem os CNs ad hoc dos anexos.

| PR | #307 | #309 | #312 | #314 | #315 | #316 | #317 | #318 | #319 | **total** |
|---|---|---|---|---|---|---|---|---|---|---|
| `it` + | 4 | 11 | 0 (shell) | 76 | 16 | 20 | 32 | 28 | 14 | **201** |
| arquivos de teste novos | 1 | 1 | — | 4 | 2 | 2 | 2 | 2 | 0 | **16** |

As PRs só de docs (#306, #308, #310, #311, #313) não escreveram teste.

---

## 7. A série do CI

Todas as corridas do `android-debug-apk` das PRs do N2, evento
`pull_request`, **nível job** (`startedAt → completedAt`), todas `success`
`[medido: gh run list --workflow=native.yml --branch <ramo> · gh run view <id> --json jobs]`.
O `native.yml` filtra por `paths`; as PRs só de docs não o disparam.

| # | run | PR | commit | início (UTC) | job | nota |
|---|---|---|---|---|---|---|
| 1 | `35155759267` | #309 | `9e88c3c` | 09-16 22:04 | 12m33s | abertura |
| 2 | `35156800868` | #309 | `e5c1ec1` | 09-16 22:16 | 12m50s | |
| 3 | `35538341300` | #309 | `e949cc9` | 09-20 21:19 | 12m50s | push sem arquivo do filtro |
| 4 | `35586376779` | #309 | `cbe1a4b` | 09-21 10:00 | 9m31s | push sem arquivo do filtro |
| 5 | `35610812531` | #309 | `bd250f3` | 09-21 14:14 | 12m50s | push sem arquivo do filtro |
| 6 | `35655296020` | #312 | `4b6a510` | 09-21 21:07 | 12m10s | abertura |
| 7 | `35663577954` | #314 | `70e77be` | 09-21 22:36 | 9m21s | abertura |
| 8 | `35665914430` | #314 | `da67e45` | 09-21 23:05 | 12m39s | |
| 9 | `35723549642` | #315 | `25c00ee` | 09-22 11:48 | **13m28s** | **primeiro build com módulo nativo novo desde o N1** (div. 234) |
| 10 | `35738242548` | #315 | `bb9a427` | 09-22 14:08 | **13m11s** | push sem arquivo do filtro |
| 11 | `35739888971` | #315 | `a3061e6` | 09-22 14:22 | 12m59s | push sem arquivo do filtro |
| 12 | `35739924367` | #315 | `a1f3f54` | 09-22 14:23 | **8m09s** | a **mesma árvore** da 10 mais um parágrafo de anexo (div. 253) |
| 13 | `35740988227` | #315 | `c8db83a` | 09-22 14:32 | 14m02s | push sem arquivo do filtro |
| 14 | `35746115122` | #315 | `a904057` | 09-22 15:16 | 11m58s | |
| 15 | `35766146681` | #316 | `7aea968` | 09-22 18:17 | 12m31s | abertura |
| 16 | `35772931849` | #316 | `93c8a13` | 09-22 19:18 | 13m26s | |
| 17 | `35780792936` | #317 | `53cafdd` | 09-22 20:31 | 10m19s | abertura |
| 18 | `35785657879` | #317 | `85f2988` | 09-22 21:16 | 12m52s | |
| 19 | `35801102126` | #318 | `4dcdb94` | 09-23 00:13 | 8m37s | abertura |
| 20 | `35865083143` | #319 | `f4f88db` | 09-23 13:09 | 10m20s | abertura |
| 21 | `35867694118` | #319 | `de9e655` | 09-23 13:31 | 12m15s | |

**Descritivo, não referência**: `n=21 · piso 8m09s · teto 14m02s · mediana 12m33s
· média 11m51s`. **Duas corridas abaixo do piso da referência** (9m16s): a 12
(8m09s) e a 19 (8m37s). A 12 tem causa medida — cache do runner, a mesma árvore
da 10 em 13m11s (div. 253, que também registra como **errada** a primeira
leitura de que os 13m11s vinham do módulo novo). A 19 não tem causa medida, e
não ganha uma aqui.

**A referência continua sendo a faixa da V1-PR6** (n=12, 9m16s–14m11s, mediana
11m49s; `V1-ENCERRAMENTO.md` §8), **até o `CI-FAIXA.md` do W4-b**. Esta série
não é incorporada nela aqui: incorporá-la é decidir o corte, e o corte é do
W4-b. Para ele, ficam também:

- **a 19ª retida do W3**, que o W3 deixou para "o próximo bloco" e o N2 não
  incorporou: run `35096488810`, `3575e4b`, `w3/gates-no-ci`, 12:33:10Z →
  12:44:57Z, **11m47s** `[medido]`;
- **as corridas de `push` na `main`** depois de cada merge do N2 (mesmo job):
  `adf32e6` 8m31s · `5f1c226` 13m42s · `fedfd24` 12m43s · `0fa1b75` 12m29s ·
  `8bd4281` 13m09s · `f991eb0` 13m05s · `426f4cc` 11m41s; a de `bc55419` (#319)
  **ainda corria** quando esta tabela foi medida.

**O B8.1 com preço do N2** `[medido: git diff --name-only <push anterior> <push>]`:
**sete** corridas saíram de pushes que não tocaram nenhum caminho do filtro
(3, 4, 5, 10, 11, 12, 13) — **83m32s de APK** por pushes de docs e anexos. O
`paths` do `pull_request` olha o diff acumulado da PR (`W3-ENCERRAMENTO.md` §7
item 7). O push desta PR não dispara o `native.yml`: a PR nunca tocou
`apps/native/**`.

---

## 8. Escritas do nativo em prod

`[lido: N2-PR7-anexos/aparato.md §6, "A conta de escritas"]`, conferido contra os
`device-prod.txt` de cada PR `[medido: grep -c 'OCTAVIA: write op=']`:

| PR | conta principal (Tab S6) | conta de audit (AVD) |
|---|---|---|
| N2-PR3 | 1 (`create`) | — |
| N2-PR4 | 3 (`update`, `remove`, `delete`) | — |
| N2-PR5 | 1 (`reorder`) | 2 (`reorder` de 60, ida e volta) |
| N2-PR6 | 2 (`add`, um bis) | — |
| N2-PR7 | 1 (`delete` da `N2-PR5 aceite`) | 13 (`create`, 10 × `add`, `reorder`, `delete`) |
| **total** | **8** | **15** |

**23 escritas.** Nenhum 401, nenhum 429, nenhum retry. **Nenhuma setlist
criada pelo nativo ficou em prod**: a da N2-PR3 saiu na N2-PR4, a `N2-PR5
aceite` na N2-PR7, a `N2-PR7 audit` no mesmo §3.3; a setlist de 60 da audit
voltou à ordem de antes, elemento a elemento.

**Requests que não escreveram**:

| onde | requests | o que |
|---|---|---|
| pre-check, Fase B (#306) | 5 | `GET` 200; `POST {}` 400; `POST` sem token 401; `GET` sem token 401; `DELETE songs/nao-e-uuid` 500 — **zero escrita** (`N2-PRECHECK.md` §11.0) |
| hotfix, preview (#307) | 1 `DELETE` | uuid inexistente → 404, zero linhas (`HOTFIX-150.md` §3.1) |
| hotfix, prod (#311) | 2 `DELETE` | setlist alheia vazia e com músicas → 404 byte-idêntico, **zero escrita**; a `DESCARTÁVEL N2` confirmada intacta pelo Marcel (§3.2) |
| PR-1, Tab S6 (#309) | 8 `GET` | 4 × `setlists` + 4 × `content` nas aberturas do T1-R10 (`device-t1r10.txt`) |
| PR-3…7, logcats de prod | 39 `GET` | 31 × `/api/setlists` (as releituras e as aberturas) + 8 × `/api/content`, de **62** linhas `api` — as outras 23 são as escritas acima `[medido]` |

As capturas do brief (#310) fizeram leitura de prod (sync e busca local, `N2-BRIEF-anexos/README.md` §1) e não foram contadas lá; não são contadas aqui.

---

## 9. Aparato → [`APARATO.md`](APARATO.md)

Arquivo novo, uma página, **a fonte única** do que vivia em cinco `aparato.md`
de anexo (N2-PR3…PR7) e em divergências espalhadas. Uma linha no `CLAUDE.md`
aponta para ele — extra declarado: é a regra 5 do catálogo, **a razão mora onde
quem vai mexer lê** (div. 299 registrou que o `CLAUDE.md` não tinha onde pôr a
regra do avião). Os `aparato.md` de anexo ficam como estão: rastro.

---

## 10. Herança, com destino

A numeração abaixo é estável — cite por **§10.<bloco>.<n>** (a lição da §4.3).

### 10.1 W4-b

| # | item | origem |
|---|---|---|
| 1 | **o mecanismo da 83**: par de remoção com razão (`linha → REMOVIDA: <razão>`) no `g2g3.sh` | N2-D34; `W3-ENCERRAMENTO.md` §7 item 8 |
| 2 | docstring do `buildIndex` que o código desmente | div. 220 (e 194) |
| 3 | div. 119 (`emVoo`) | N2-D3 |
| 4 | o estouro do `lruEvict` | N2-D3 |
| 5 | medição do build de release | N2-D3 |
| 6 | **B8.1** — o APK re-roda em push só de docs: **no N2, 7 corridas, 83m32s** (§7) | `W3-ENCERRAMENTO.md` §7 item 7 |
| 7 | `CI-FAIXA.md`: a faixa com corte, incorporando as 21 do N2, a 19ª do W3 e as de `push` (§7) | §7; div. 80 |
| 8 | `shasum -c` dos congelados no `gates-nativos` | div. 223 |
| 9 | **README fora do `SHA256SUMS` do V1** — decisão A | div. 223 |
| 10 | **podar o G1**: sete exceções do G1a e o par do G1b que a N2-PR7 deixou | div. 339 (§6) |

### 10.2 N3 (content nos apps)

| # | item | origem |
|---|---|---|
| 1 | **B9 na frente** | N2-D1 |
| 2 | `DELETE /api/content/[id]` segue 200 para inexistente — assimetria com setlist | div. 174 |
| 3 | B5-D6: cascata content × storage e reconciliação de órfãos | `B5-ENCERRAMENTO.md`; `N1-ENCERRAMENTO.md` herança |
| 4 | B1.5 | `N1-ENCERRAMENTO.md` herança; div. 152 |
| 5 | B10: restrição de referrer da API key, agora que o app existe | `N1-ENCERRAMENTO.md` herança |
| 6 | C-D7 (Zod por tipo; modelo de anotação) | `PRD-TELA-2.md` §11 |

### 10.3 Bloco D (backend)

| # | item | origem |
|---|---|---|
| 1 | 401 sem distinção entre email não verificado e token inválido (H-N2-11, medição do Marcel) | div. 152; N2-D9 |
| 2 | três rotas sem validação do id do path → 500 | div. 153 |
| 3 | `performance_date` sem checagem de calendário | div. 154 |
| 4 | **teto único**: reorder para em 100, addSong não | div. 155; N2-D17 |
| 5 | dois defeitos do web (remove por `content.id`; id local falso) | div. 156 |
| 6 | o web mostra erro ao apagar setlist já apagada | div. 172 |
| 7 | o `refine` de texto recusa português comum | div. 181 |
| 8 | reorder parcial acima de 100 (mover por número, P3) | N2-D29 |
| 9 | 178, 179, 180 (corpos de resposta do `PUT`/`POST`) | `PRD-TELA-2.md` §10 |

### 10.4 Propostas do desenho

| # | proposta | destino | origem |
|---|---|---|---|
| 1 | **P1** selo de bis na linha de S2 | a PR que mexer no palco | `DESIGN-N2` §5 |
| 2 | **P2** duplicar setlist (sem endpoint) | backlog | §5; N2-D20 |
| 3 | **P3** mover por número | com a correção do teto (10.3.4) | §5; N2-D29 |

### 10.5 Do V1, que segue aberto

`V1-ENCERRAMENTO.md` §11, "O resto da herança", e `W3-ENCERRAMENTO.md` §7:

| # | item |
|---|---|
| 1 | §8 do `DESIGN-V1`: chevrons das zonas de toque (§8.1) e os cinco desabilitados (§8.2) |
| 2 | tema claro nas telas de lista |
| 3 | `cor.offline` com zero usos |
| 4 | ~~A13 fora do aceite~~ — **fechado no W2** (12/12 páginas em avião, `W2-ENCERRAMENTO.md` §aceites); listado por pedido, não é herança (div. 345) |
| 5 | a opção C do teto de download — `T₁` com `n = 0` de rede real |
| 6 | div. 108 — o aceite no aparelho como única prova de comportamento do `StageScreen` |
| 7 | cobertura dos gates (`a20.mjs`, `icones.mjs` fora do relatório) — a opção A, recusada duas vezes |

### 10.6 Do N2

| # | item | origem |
|---|---|---|
| 1 | A10 com dado real — depende de uso | N2-D11 |
| 2 | §8.3 do V1 com o gatilho (metade das setlists com data futura) | N2-D24 |
| 3 | `native-tela` prova **árvore**, não geometria — o aceite no aparelho não se dispensa | div. 249; `N2-PR3-anexos/aparato.md` §6.1; div. 344 |
| 4 | `reason=order` × `reason=reopen` para a releitura da regra 3 — unificar é decisão do Marcel | div. 273 |
| 5 | H-N2-14: o `ms` da releitura em rede real (os CNs são loopback) | `PRD-TELA-2.md` §9 |
| 6 | div. 209: o texto de música **na história** do git (`34d7064`, #300) — decisão do Marcel | `N2-BRIEF-anexos/README.md` §4 |
| 7 | div. 83 no G3, lado escolhido: continua contando comentário | N2-D34 |

### 10.7 Blocos ainda não decididos (registrados pelo Marcel em 2026-09-23)

| # | item |
|---|---|
| 1 | o tablet em **retrato** precisa de composição própria — os elementos se encavalam; o canvas do N1/N2 é só paisagem (N2-D25) |
| 2 | app **iOS** |

### 10.8 Próximo bloco decidido

O **web com a identidade visual do nativo**. O pre-check dele registra as
decisões já tomadas; não se repetem aqui.

---

## 11. O rito, como ficou

| mudança de método | onde está |
|---|---|
| pre-check em fases (A estática, B em prod) com **orçamento probe a probe**, cada probe com garantia de zero escrita escrita antes | `N2-PRECHECK.md` §11.3, §11.0 |
| PRD com **§12 de perguntas** numeradas, opções e recomendação; as respostas viram decisões no §0 | `PRD-TELA-2.md` §0, §12 |
| **brief → Claude Design → duas revisões → congelamento com sha**; o `SHA256SUMS` sem o README, para a errata não quebrar a prova | `N2-BRIEF-anexos/`, `DESIGN-N2/README.md` §4, §8 |
| **aceite no aparelho antes do merge**, em sessão própria quando a que codificou não tem `adb` | `N2-PR3-anexos/README.md` |
| o CN vem no commit 1, reprovando pelo motivo certo; CN que passa ganha controle ad hoc | `CN-antes.txt` e `CN-controles.txt` de cada PR |
| **extras declarados antes** do commit que os usa | `N2-PR6-anexos/README.md` §1; `DESIGN-N2` §9 ("Extra") |
| relatório e anexos em pt-BR; a saída literal de ferramenta fica como saiu, com glossário | div. 300; glossários de `N2-PR5-anexos/` e `N2-PR7-anexos/` |
| o encerramento é índice; a memória de sessão é rastro | `CLAUDE.md`; §4.3 |

---

## 12. Divergências desta PR — 335 a 345

| # | origem | o quê | o que foi feito |
|---|---|---|---|
| **335** | P | O prompt fala em "as 8 regras do W3" e manda numerar as novas a partir de 9. `[medido]` o catálogo tem as regras **0–5** numeradas e **duas de método sem número** (oito ao todo); a 9 já era citada por esse número no `SETLISTS.md` e no `PRD-TELA-2.md` (div. 176) | numeradas **9–15**, como pedido; o catálogo declara que **6–8 não existem**, para ninguém procurá-las |
| **336** | P | "a fonte única do que hoje vive em **sete** `aparato.md`" — `[medido]` `find docs -name 'aparato*.md'` → **cinco** (N2-PR3…PR7) | o `APARATO.md` consolida os cinco, mais as divs. do PR1 e do brief que são de aparato |
| **337** | P | "`W3-ENCERRAMENTO.md` §7: os itens que o N2 fechou (**a 83, a poda do g1**)". A poda do g1 é a **div. 141, §3** — não é item da §7. **Terceira vez** que um handoff cita o W3 por uma estrutura que ele não tem (147, 219) | item 8 da §7 marcado (N2-D34, #313); a poda anotada numa nota ao fim da §7, apontando para a #309 e dizendo que não é item dali |
| **338** | P | O prompt põe o caso 25 na div. **229**. A 229 (PR-2) é o `gate:a20` não alcançar o `packages/core`; o **zero literal** examinado é a **238** (PR-3), quando o escopo foi estendido | o caso 25 cita a 238, com a 229 como a que abriu o escopo |
| **339** | P | O prompt pede o G1a com "exceções (vazias)". `[medido]` **sete exceções do G1a e um par do G1b declarados e não usados** na `main` — a N2-PR7 entrou sem a poda que o gate pediu | registrado na §6 como está; **não podado** (código); destino §10.1.10 |
| **340** | D | A **div. 254** (`form-salvar` sem `testID` no ramo `salvando`) foi **consertada na N2-PR4** (`a4e7df6`, comentário em `FolhaDeCriar.tsx`), e os dois registros dela (`DESIGN-N2` §9, `N2-PR3-anexos/aparato.md` §9) ainda dizem "correção de outra rodada" | registrado aqui; os documentos congelados/anexos não são reeditados |
| **341** | D | A taxonomia de origem só é coluna em 4 dos 8 registros (§4.1): 128 das 183 divergências não a têm, e os "Extra X1…X5" do `DESIGN-N2` §9 usam a letra da origem "terceiros" como numeração | contagem por letra só onde declarada; o resto pelo marcador do texto, marcado `[lido]` |
| **342** | P | "Anote quais mudaram comportamento (E19, E20, E21, E23)": a E20 **ratificou** comportamento que já estava na `main` desde a N2-PR6 (div. 320); e **E8 e E14** também mudaram comportamento | a §3 classifica pela leitura da §9, com as duas notas |
| **343** | D | Os 46 dumps da N2-PR7 não têm `SHA256SUMS.txt`; os das PRs 3–6 têm, e conferem | registrado; não gerado aqui (seria anexo novo de outra PR) |
| **344** | P | "a regra 3 dos testes (`native-tela` prova árvore, não geometria)" — `[medido]` nenhum documento dá esse nome (`grep -rn "regra 3 dos testes" docs` → vazio). O conteúdo existe: `N2-PR3-anexos/aparato.md` §6.1 e div. 249 | citado pelo conteúdo e pela fonte, sem criar o nome |
| **345** | P | O prompt lista "A13 fora do aceite" entre o que o V1 deixou aberto. `[medido]` o W1 o deixou sem rodar (`W1-ENCERRAMENTO.md` §10 item 5) e o **W2 o rodou e fechou** (`W2-ENCERRAMENTO.md:78`: *"A13 12/12 páginas do cache em avião, `src=disk` — fecha a dívida 5 do W1"*) | listado na §10.5, riscado, com a fonte do fechamento |

---

## 13. Contabilidade desta PR

| | |
|---|---|
| requests a `/api/*` em prod | **0** |
| comandos a aparelho | **0** — `adb` não invocado |
| worktree | `../octavia-n2-fim`, **sem** `.env*`; `pnpm install --frozen-lockfile --offline` |
| arquivos | `N2-ENCERRAMENTO.md` e `APARATO.md` (novos); `LOGS-OCTAVIA.md`, `PRD-TELA-2.md` (cabeçalho), `W3-ENCERRAMENTO.md` §7, `CLAUDE.md` (uma linha) |
| código | nenhum |
| APK | nenhum: a PR não toca caminho do `native.yml` |
