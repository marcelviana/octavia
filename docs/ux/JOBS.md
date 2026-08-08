# JOBS.md — Cenários de uso reais do Octavia

> **Propósito**: este arquivo é o baseline de julgamento do UX assessment. Todo achado
> das fases de análise (Fase C) e de fluxo ao vivo (Fase D) deve referenciar um job
> daqui. Um problema que não afeta nenhum job não é prioridade.
>
> **Contexto**: o Octavia tem um único usuário (Marcel). Estes jobs descrevem o uso
> real, não personas hipotéticas. Alvos de taps/tempo marcados com ⚠️ são propostas
> iniciais — calibrar com base na experiência real antes de rodar a Fase D.
>
> **Convenção de medição**:
> - **Tap** = qualquer interação discreta (tap, clique, tecla Enter). Digitação de
>   texto conta como 1 tap por campo, não por caractere.
> - **Tempo** = do primeiro tap até o critério de sucesso visível na tela.
> - Medições da Fase D partem do app já aberto e logado, salvo indicação contrária.

---

## J1 — Show ao vivo (o job crítico)

**Contexto**: palco ou barzinho, instrumento nas mãos, iluminação ruim, possivelmente
sem Wi-Fi confiável. Tablet apoiado na estante de partitura, em landscape. Qualquer
falha aqui é inaceitável — este job domina todos os trade-offs.

**Passos**:
1. Abrir o app (pode ter ficado dias fechado)
2. Localizar a setlist do show de hoje
3. Entrar em modo performance na primeira música
4. Tocar a setlist inteira (~12 músicas), avançando entre músicas
5. Dentro de uma música longa, acompanhar com auto-scroll (play/pause)
6. Em uma música, ajustar zoom porque a cifra está pequena
7. Ativar dark sheet quando o ambiente escurecer
8. Sair do modo performance ao fim do show

**Critérios de sucesso**:
- Da tela inicial até a primeira música em tela cheia: ⚠️ **≤ 4 taps, ≤ 10 s**
- Avançar para a próxima música: **1 tap** (ou 1 gesto), com alvo de toque grande
  o suficiente para acertar sem olhar (⚠️ ≥ 48 px, idealmente borda inteira da tela)
- Play/pause do auto-scroll: **1 tap**, resposta visual imediata (< 100 ms percebido)
- Nenhum conteúdo demora > ⚠️ **1 s** para renderizar ao trocar de música (pré-carregado)
- Dark sheet e zoom acessíveis sem abrir menu aninhado: ⚠️ **≤ 2 taps** cada
- **Zero** estados em que a música desaparece, quebra ou exige reload

**Pontos de observação para o assessment**:
- Os controles do modo performance são operáveis "às cegas" (posição fixa, alvos grandes)?
- Existe indicação de posição na setlist (música 4 de 12)?
- O que acontece na última música ao tentar avançar? Beco sem saída ou fim elegante?
- Wake lock: a tela apaga no meio da música? (⚠️ confirmar se está implementado)
- Rotação/resize no meio da performance: o layout sobrevive?

---

## J2 — Ensaio: pular, transpor, anotar

**Contexto**: ensaio em casa ou com banda. Diferente do show, aqui há interação
intensa: repetir trechos, mudar tom, marcar coisas. Tablet ou notebook.

**Passos**:
1. Abrir a setlist do ensaio em modo performance
2. Pular direto para a música 7 (sem passar pelas 6 anteriores)
3. Adicionar uma anotação em um trecho ("entrar mais suave aqui")
4. Voltar para a música 3 para repassar
5. Sair e verificar que a anotação persistiu

**Critérios de sucesso**:
- Pular para música arbitrária da setlist: ⚠️ **≤ 3 taps** (implica algum índice/
  navegador de setlist acessível de dentro do modo performance)
- Anotação: da intenção ao texto salvo em ⚠️ **≤ 5 taps, ≤ 20 s**
- Anotação visível na próxima abertura da mesma música, inclusive em modo performance

**Pontos de observação**:
- Navegação intra-setlist existe ou só há avançar/voltar sequencial?
- Anotações são legíveis em modo performance ou só na visualização de conteúdo?
- O modo performance diferencia "ensaio" (interação rica) de "show" (interação mínima),
  ou tenta servir os dois com a mesma tela?

---

## J3 — Preparar repertório: montar setlist nova

**Contexto**: sofá, alguns dias antes de um show. Momento de planejamento, sem pressa
de palco, mas com repertório grande na cabeça. Provavelmente desktop ou tablet.

**Passos**:
1. Criar setlist nova com nome e data
2. Adicionar ~10 músicas da biblioteca, buscando por nome
3. Reordenar: mover a música 8 para a posição 2
4. Remover uma música que não vai entrar
5. Revisar a ordem final e conferir tonalidades na listagem
6. ⚠️ Duplicar uma setlist antiga como ponto de partida *(confirmar se existe;
   se não, registrar como gap — é um padrão de uso muito comum)*

**Critérios de sucesso**:
- Criar setlist vazia: ⚠️ **≤ 3 taps**
- Adicionar cada música: ⚠️ **≤ 3 taps por música** (buscar → resultado → adicionar),
  sem sair da tela da setlist a cada adição
- Reordenar: drag-and-drop funcional em touch **e** mouse, ou controles equivalentes
- A listagem da setlist mostra título, artista e tom sem precisar abrir cada item

**Pontos de observação**:
- O fluxo de adicionar músicas é "modo picker" fluido ou obriga ida-e-volta
  biblioteca ↔ setlist?
- Reorder na setlist de 60 músicas (do seed): performance e usabilidade degradam?
- Setlist vazia recém-criada: o estado vazio orienta o próximo passo?

---

## J4 — Importar material novo

**Contexto**: alguém mandou um PDF de cifra pelo WhatsApp, ou baixei uma partitura.
Quero colocar no Octavia com metadados corretos para achar depois. Frequentemente
no celular, na hora que recebi.

**Passos**:
1. A partir do dashboard/biblioteca, iniciar adição de conteúdo
2. Fazer upload de um PDF (⚠️ no celular: direto do share sheet do WhatsApp seria
   o ideal — confirmar se o PWA está registrado como share target; se não, gap)
3. Preencher título, artista, tom
4. Escolher o tipo de conteúdo correto (partitura vs. cifra vs. letra)
5. Salvar e confirmar que aparece na biblioteca
6. Repetir com um arquivo problemático (muito grande ou formato inválido) e
   observar o erro

**Critérios de sucesso**:
- Upload completo com metadados: ⚠️ **≤ 8 taps, ≤ 60 s** para 1 arquivo
- Erro de arquivo inválido: mensagem específica e acionável (o quê e por quê),
  sem perder os metadados já digitados
- Item recém-importado é imediatamente localizável pela busca
- Upload em andamento tem indicação de progresso; a UI não congela

**Pontos de observação**:
- Este era o fluxo do Bug F1 (FileUploadZone renderizando placeholder) — verificar
  a experiência completa pós-fix, não só o funcionamento
- Importação em lote (5 PDFs de uma vez) existe? Se não, quanto custa importar 5?
- Os metadados têm defaults inteligentes (ex.: título inferido do nome do arquivo)?

---

## J5 — Achar uma música

**Contexto**: alguém pede uma música no meio do ensaio/show, ou quero conferir um
tom. Busca de memória, possivelmente com nome parcial, errado ou sem lembrar o artista.
Este job acontece **dentro** de outros jobs — a busca precisa ser rápida em qualquer
contexto.

**Passos**:
1. Da tela onde estiver, chegar à busca
2. Buscar por fragmento do título ("garota" para "Garota de Ipanema")
3. Buscar com erro de digitação ("ipanma") e observar o resultado
4. Buscar por artista
5. Abrir o resultado direto em visualização

**Critérios de sucesso**:
- Do dashboard até resultado aberto: ⚠️ **≤ 4 taps, ≤ 10 s**
- Busca parcial por título e por artista funciona
- Busca sem resultado tem estado vazio útil ("nada encontrado para X" + sugestão),
  não tela em branco
- ⚠️ Tolerância a typo: provavelmente não existe (busca ILIKE simples) — se
  confirmado, registrar como gap com severidade baseada na frequência real de erro

**Pontos de observação**:
- A busca está acessível de dentro do modo performance? (cenário real: "toca aquela!"
  no meio do show — música que não está na setlist)
- Filtros por tipo de conteúdo ajudam ou atrapalham o caso comum?
- Com 40+ itens (seed), a listagem sem busca ainda é navegável (ordenação, densidade)?

---

## J6 — Modo offline: chegou sem sinal

**Contexto**: barzinho no subsolo, sinal zero, Wi-Fi inexistente. O show vai
acontecer de qualquer jeito. Este job valida a promessa offline-first do app
(service worker + cache IndexedDB).

**Pré-condição**: a setlist do show foi aberta pelo menos uma vez **com** conexão
(⚠️ confirmar se o cache é automático ao visualizar ou exige ação explícita de
"baixar setlist" — a resposta muda completamente o critério).

**Passos**:
1. Com conexão: abrir a setlist do show (popular o cache)
2. Ativar modo avião / `context.setOffline(true)`
3. Abrir o app do zero (kill + reopen, não só voltar do background)
4. Navegar até a setlist e entrar em modo performance
5. Tocar 3 músicas, incluindo uma com PDF
6. Tentar uma ação que exige rede (ex.: importar conteúdo) e observar o comportamento

**Critérios de sucesso**:
- App abre offline sem tela de erro bloqueante
- A setlist cacheada abre completa: **todas** as músicas renderizam, incluindo PDFs
- Estado offline é comunicado discretamente (indicador), sem interromper o uso
- Ações que exigem rede falham com mensagem clara — ou melhor, enfileiram
  (offline-queue) com feedback do que acontecerá ao reconectar
- Ao reconectar: sem duplicação, sem perda, sem exigir reload manual

**Pontos de observação**:
- Existe qualquer indicação **antes** do show de que a setlist está garantida
  offline? ("baixada ✓") — sem isso, o musico só descobre a falha no palco
- O que acontece com música da setlist cujo arquivo nunca foi cacheado?
  Placeholder claro ou quebra silenciosa?
- Login offline: a sessão sobrevive ou o Firebase Auth bloqueia a entrada?

---

## Matriz de prioridade dos jobs

| Job | Frequência | Criticidade | Peso no assessment |
|-----|-----------|-------------|--------------------|
| J1 — Show ao vivo | ⚠️ semanal? | Máxima (falha = falha em público) | **40%** |
| J3 — Preparar repertório | ⚠️ semanal? | Alta | 15% |
| J5 — Achar uma música | diária/embutida | Alta | 15% |
| J4 — Importar material | ⚠️ semanal? | Média | 10% |
| J6 — Offline | rara, mas binária | Máxima quando ocorre | **15%** |
| J2 — Ensaio | ⚠️ semanal? | Média | 5% |

> ⚠️ Frequências são chute — ajustar com a realidade. A regra de desempate para
> priorizar achados: **J1 e J6 vetam**; um achado S1 nesses jobs entra no topo do
> backlog independente de esforço. Nos demais, severidade × frequência ÷ esforço.

---

## O que este arquivo NÃO cobre (de propósito)

- Jobs multiusuário (compartilhar setlist, colaboração) — o app tem 1 usuário
- Onboarding de usuário novo — irrelevante para o único usuário existente; o fluxo
  de signup será avaliado apenas quanto a estar funcional, não otimizado
- Descoberta de features — Marcel conhece o app; achados de "descobribilidade"
  só valem se o próprio Marcel esquece onde a feature está (sinal de IA ruim)