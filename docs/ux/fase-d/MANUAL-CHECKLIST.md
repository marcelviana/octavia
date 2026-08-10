# Fase D — Checklist manual (hardware real)

> Itens da lista fechada que exigem dispositivo físico (iPad/celular) e não
> foram simulados nem inferidos, conforme protocolo da fase. Cada item traz
> procedimento passo-a-passo e critério de veredito. Executar no iPad em
> https://octavia.rocks com a conta de audit (ou a conta real, sem escrita).
>
> Convenção: tap = interação discreta; tempo = do primeiro tap ao critério
> visível. Registrar o veredito de cada item neste arquivo mesmo.

---

## Item 7 — Foto vertical de celular como partitura (CONT-06)

**Pergunta original**: Foto vertical de celular (JPG) como partitura: proporção e
nitidez sobrevivem ao `width={800} height={600}` fixo?

**Procedimento**:
1. No celular, tirar uma foto vertical (retrato) de uma partitura/cifra em papel,
   com texto pequeno mas legível na foto original.
2. Importar no Octavia: Add Content → Sheet → upload da foto (título
   `[UX-AUDIT] Foto vertical teste` para o cleanup achar).
3. Abrir o item no viewer (`/content/[id]`) em tablet landscape.
4. Abrir o mesmo item em modo performance.
5. Comparar com a foto original: proporção (esticada/achatada?) e nitidez
   (dá para ler as notas/cifras à distância de palco?).

**Veredito**:
- **PASSA** se a proporção é preservada e o texto da foto permanece legível
  nos dois modos.
- **FALHA** se a imagem é distorcida, cortada ou renderizada borrada/pequena
  demais para leitura de palco.

**Cleanup**: apagar o item de teste depois (ou rodar `cleanup.ts`, que pega o
prefixo `[UX-AUDIT]`).

---

## Item 14 — "Continue with Google" no PWA instalado (AUTH)

**Pergunta original**: "Continue with Google" (popup) funciona no PWA instalado
em tablet?

**Procedimento**:
1. No iPad (Safari): abrir https://octavia.rocks → Compartilhar → Adicionar à
   Tela de Início. Abrir o app instalado.
2. Se estiver logado, deslogar.
3. Na tela de login, tocar em **Continue with Google**.
4. Observar: abre popup? Abre nova aba do Safari fora do PWA? Trava? Completa
   o fluxo e volta para o app logado?
5. Repetir num Android/Chrome com PWA instalado, se disponível.

**Veredito**:
- **PASSA** se o fluxo completa e retorna ao PWA logado.
- **FALHA** se o popup é bloqueado, o fluxo abre fora do PWA sem retorno, ou o
  login não completa (registrar exatamente onde morre).

---

## Item 35 — Wake lock em iPad (Safari) e Android real (PERF-08)

**Pergunta original**: tela permanece acesa 10 min? O toast do PERF-08 aparece e
cobre controles? Re-request após alt-tab funciona?

**Procedimento**:
1. iPad com auto-bloqueio configurado para 2 minutos (Ajustes → Tela e Brilho).
2. Abrir uma setlist em modo performance.
3. Observar o toast de wake lock ao entrar: aparece? cobre o header/controles?
   Por quanto tempo? (foto/screenshot)
4. Não tocar na tela por 10 minutos. A tela apagou?
5. Sair do app (Home/troca de app), voltar ao modo performance, esperar mais
   3 minutos sem tocar. A tela apagou? (testa o re-request pós-background)
6. Repetir em Android/Chrome se disponível.

**Veredito**:
- **PASSA** se a tela fica acesa nos passos 4 e 5 e o toast não cobre controle
  algum no momento em que o músico precisa deles.
- **FALHA** se a tela apaga no meio (registrar em qual passo) ou se o toast
  encobre controles (registrar screenshot).

---

## Item 36 — Precisão de toque nos dots de navegação (PERF-06)

**Pergunta original**: dots de 8px: taxa de acerto real em tablet; e na setlist
de 60?

> Medição automatizada da Fase D: geometria dos dots registrada em
> `data/item-36.json` (tamanho real em px, espaçamento, largura total na
> setlist de 60). Aqui fica só a taxa de acerto humana.

**Procedimento**:
1. Abrir a setlist "UX-AUDIT Show padrão" (8 músicas) em modo performance no iPad.
2. Com o tablet na estante de partitura (posição de palco), tentar pular
   direto para a música 5 tocando no dot correspondente. Repetir 10 vezes
   (voltando para a música 1 entre tentativas).
3. Anotar acertos/erros (erro = caiu em outra música ou nada aconteceu).
4. Repetir com a "UX-AUDIT Estresse" (60 músicas): tentar acertar a música 30.
   5 tentativas bastam.

**Veredito**:
- **PASSA** se ≥ 9/10 na setlist de 8 **e** ≥ 4/5 na de 60.
- **FALHA** caso contrário; registrar taxa real de cada setlist.

---

## Item 6 (parte física) — Pinch-to-zoom no viewer de PDF (CONT-08)

**Pergunta original (parte)**: Pinch-to-zoom funciona em touch ou só botões de
20%?

**Procedimento**:
1. Abrir `[UX-AUDIT] Partitura de 12 páginas` no viewer (`/content/[id]`) no iPad.
2. Fazer pinch-out sobre a partitura.
3. Observar: o PDF dá zoom? A página inteira dá zoom (zoom do browser)? Nada?

**Veredito**:
- **PASSA** se o pinch amplia o PDF de forma utilizável.
- **FALHA** se só os botões de ±20% funcionam ou se o pinch dá zoom na página
  inteira (quebrando o layout).

---

## Item 18 (parte física) — Drag de reorder com o dedo no iPad (SET-04)

**Pergunta original (parte)**: o drag inicia com toque?

> A parte automatizável está medida em `data/item-18.json`: com touch
> emulado, os botões da linha ficam em `opacity: 0` **antes e depois** do
> tap (28×28 px), e o drag por eventos de toque **não move** a linha.
> Confirmar no hardware:

**Procedimento**:
1. Abrir a setlist "UX-AUDIT Fase D picker" no iPad, detalhe com músicas.
2. Pressionar e segurar o grip (⋮⋮) de uma música e arrastar para cima/baixo.
3. Tentar também segurar a linha inteira e arrastar.

**Veredito**:
- **PASSA** se a linha entra em modo drag e solta na nova posição (mesmo que
  não persista — a persistência é o SET-03, diferido).
- **FALHA** se nada acontece com toque (drag HTML5 sem suporte a touch —
  resultado esperado pela leitura do código).

---

## Item 33 (parte física) — Scroll horizontal da tablatura em touch (CONT-02)

**Pergunta original (parte)**: o overflow-x-auto é descobrível/operável em touch?

**Procedimento**:
1. Abrir `[UX-AUDIT] Ponta de Areia` (tab) no viewer, no iPad em portrait.
2. Sem nenhuma dica visual, tentar ler a tablatura completa.
3. Observar: você percebe que há conteúdo cortado à direita? O arrasto
   horizontal com um dedo rola a tab sem rolar a página?

**Veredito**:
- **PASSA** se há affordance perceptível de corte E o gesto horizontal funciona
  isolado da página.
- **FALHA** se o corte é invisível (linha de tab parece completa mas não é) ou
  o gesto rola a página junto.

---

## Item 15 (confirmação visual de 10s) — Balão HTML5 em pt-BR

> Mecanismo já confirmado na automação (validação 100% nativa, idioma vem do
> browser/SO). Só confirmar visualmente:

**Procedimento**: no iPad (SO em pt-BR), abrir /login deslogado, tocar em
Sign In com campos vazios.

**Veredito**: balão "Preencha este campo." (pt-BR) sobre UI em inglês =
divergência confirmada (GLOB-01/AUTH-04).
