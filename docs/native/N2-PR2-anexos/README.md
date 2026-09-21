# N2 — PR-2: o core da escrita (sem tela) · anexos

Provas da PR-2 do bloco N2. Base: `origin/main` = `becdf7e` (o merge da #313,
o desenho congelado). Três commits, nesta ordem — **o gate vem antes do que
ele mede** (`V1-ENCERRAMENTO.md:204`).

| arquivo | o que é |
| --- | --- |
| `CN-antes.txt` | os quatro arquivos de teste REPROVANDO no commit 1, por ausência dos módulos |
| `CN-depois.txt` | os mesmos passando no commit 2 — 243 testes dos projetos `core` e `native` |
| `G1-antes.txt` | o G1 no commit 1: as sete exceções declaradas e **ainda não usadas** |
| `G1-depois.txt` | G1, G2 e G3 sobre os dois commits |
| `gate-icones.txt` | o `gate:icones` a 39 registros, antes e depois; o CN de 18 → 19 acusações; o `gate:a20` |
| `retry-after.txt` | a medição do item 1.3 — **o servidor manda `Retry-After`**; fecha a div. 225 |

**Nenhum anexo carrega texto de música** (regra do `CLAUDE.md`): esta PR não
tem tela, não tem dump de UI e não tem captura. Os corpos que o mock serve nos
CNs são fixtures do próprio projeto (`letra de Primeira`), escritos aqui.

## O que esta PR entrega

Seis operações de escrita no `packages/core`, a releitura depois de todo 2xx, a
classificação fechada em sete espécies, o conjunto fechado de frases, as linhas
de log e a validação do cliente — **e nenhuma tela**. O G2 dizendo `43 = 43` é
a prova disso: nenhum `testID` novo.

## Os três números que a PR move

| gate | antes | depois | como |
| --- | --- | --- | --- |
| G3 (linhas de log) | 57 | **63** | seis adições, lista de erratas **vazia** |
| `gate:icones` (registros) | 34 | **39** | + o anexo D do `DESIGN-N2` (E17, N2-D33) |
| CN do `gate:icones` | 18 | **19** | o defeito (8): um pendente que já está no mapa e não casa |

## O que os controles negativos acharam

Dois defeitos reais no código desta PR, os dois no `apps/native/src/escrita.ts`,
os dois achados pelos CNs e não pela leitura:

1. **O reset do gate de taxa era um no-op.** `gate.block(FAMILIA, 0)` não
   encurta uma janela já aberta — o `rateLimitGate` do core garante isso de
   propósito (`rate-limit.ts:66-69`), para que uma resposta com prazo menor não
   reabra a porta antes da hora. A janela de 30 s de um teste vazou para os dois
   seguintes, que reprovaram por um motivo que não era o deles. Um instrumento
   que não limpa é um instrumento quebrado; o reset passou a **trocar** o gate.
2. **A trava de "uma escrita por vez" era tomada depois do primeiro `await`.**
   As duas chamadas passavam pelo `if (emVoo)` síncrono, suspendiam no
   `estaOnline()` e escreviam as duas. Dois toques no mesmo frame é exatamente
   o caso que o T2-R11 existe para cobrir — e o `expo-network` é justamente um
   `await` que demora. A trava passou a ser tomada **antes** do primeiro
   `await`.

Os dois estão escritos no arquivo, ao lado do código, com a razão.

## O que fica para as PRs da tela

- **O gancho do prefetch** (`aoRelerSetlists`) está ligado a nada: o T2-R17
  **não acontece por construção**, e a div. 228 diz por quê.
- **A lista `PENDENTES` do `gate:icones`**: a PR que desenhar os cinco ícones
  a poda.
- **O `gate:a20` não lê o `packages/core`** (div. 229): hoje quem cobre as
  frases é o `frases.test.ts`.
- **As capturas** de cada estado de falha, o G5 e o G6: são de tela.
