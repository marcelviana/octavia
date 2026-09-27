# Octavia web — I1 · congelado (rodada 2)

Este é o registro da rodada 2, reescrito a partir das respostas. A rodada 1 foi substituída. São nove folhas em HTML estático autocontido em `DESIGN-I1/`: as oito superfícies e o componente `Linha de aviso`.

- **Formato:** cada folha é um arquivo `telas.html` sem runtime, template ou dependência externa (fontes e marca embutidas).
- **Estados:** cada estado alcançável da matriz é um `<section id="…" data-estado="…">` presente no DOM, com a faixa C (1138) e a faixa B (711) lado a lado e uma nota com a origem.
- **Tabelas de cada folha:**
  - no começo, **tokens por elemento**, a mesma tabela da §2.4;
  - no fim, **inventário de medidas**: todo valor em px do arquivo, com a declaração;
  - no fim, **inventário de cores**.

| folha | superfície | estados |
| --- | --- | --- |
| `0-linha-de-aviso/telas.html` | componente `LinhaDeAviso` | 8 |
| `1-auth/telas.html` | /login · /signup · /signup/confirm-email · /verify-email · /forgot-password | 46 |
| `2-landing/telas.html` | / | 1 |
| `3-privacy-policy/telas.html` | /privacy-policy | 1 |
| `4-content-lista/telas.html` | /dashboard · /library (+ aviso de topo `SESSAO-nao-renovada`) | 15 |
| `5-content-visualizacao/telas.html` | /content/[id] | 15 |
| `6-content-editor/telas.html` | /content/[id]/edit | 15 |
| `7-upload/telas.html` | /add-content | 20 |
| `8-setlists/telas.html` | /setlists | 20 |

**Cores e fontes:**
- Cores: as do `theme.ts` escuro, mais `accent` a 12 % (item marcado) e `bg` a 82 % (fundo do diálogo). A página do PDF usa `light.bg` e `light.line`, porque representa o papel do arquivo.
- Fontes: Raleway (`font.display*`), Manrope (`font.ui*`) e IBM Plex Mono (`font.mono*`).

## §1 · Largura de C e margem por faixa

- **C:** o conteúdo fica em `web.conteiner` = **1138**, a largura em que a faixa C do nativo foi medida (theme.ts, E1: Tab S6 e `octavia_tab32`, 1138 × 711 dp). Todo token por faixa de C já foi validado nessa largura. Acima de 1138 é margem em `bg`, e a composição não muda.
- **Margem por faixa:** `web.margem` = `space.xxl` (32) em C e `space.xl` (24) em B. Em B o conteúdo usa a largura toda (711 − 2 × 24 = 663, a mesma de `folha.largura`).
- **A:** não é desenhada; segue B por referência.

## §2 · Tokens

### §2.1 O bloco `web` como usado em cada folha

| token | C | B | folhas e elementos |
| --- | --- | --- | --- |
| `web.conteiner` | 1138 | — | todas: largura da moldura de C e máximo do conteúdo |
| `web.margem` | `space.xxl` | `space.xl` | 1–8: margem interna do contêiner; 3: margem da coluna de texto |
| `web.colunaLateral` | 320 | empilha | 5: detalhes; 6: metadados. Em todas, limiar de quebra das linhas flexíveis: texto da LinhaDeAviso (0), cabeçalhos da visualização, do editor e da setlist aberta (5, 6, 8) |
| `web.razaoListaDetalhe` | 2 : 3 | empilha | 8: lista de setlists \| setlist aberta |
| `web.zonaArquivo` | 240 | 240 | 7: altura mínima da zona de arquivo |
| `web.linhaLista` | 80 | 80 | 4: linha da biblioteca; 8: os três blocos de carregando |
| `web.linhaMusica` | 72 | 72 | 8: linha de música da setlist aberta |
| `web.empilha` | false | true | 4–8: casca em duas linhas; 5, 6, 8: coluna lateral desce; 5, 6: ações do cabeçalho descem; 1, 2: marca sobe acima do formulário |

### §2.2 As medidas sem declaração na rodada 1

Todas saíram das folhas; nenhuma aparece em nenhum `telas.html` (§2.3).

| px | onde estava | como ficou |
| --- | --- | --- |
| 160 | 8: altura mínima do vazio do picker (nada disponível / busca vazia) | padding `space.xxxl`, sem altura |
| 180 | 6: largura mínima da grade de campos do editor | grade de 3 colunas iguais em C e 2 em B, sem medida |
| 200 | 8: altura mínima do vazio "nenhuma música ainda"; 7: base flexível do título no lote | padding `space.xxxl`; o lote virou grade (número · título · artista) |
| 220 | 4: largura do menu Mais; 7: base flexível do artista no lote | menu na largura do conteúdo; grade |
| 260 | todas: primeira coluna da tabela de tokens da folha | três colunas iguais |
| 280 | 5: altura mínima dos vazios do painel; 6: altura do campo de letra | padding `space.xxxl`; campo de letra = `5 × touch.min` (240) |
| 360 | 8: largura máxima do apoio do vazio | sai; o texto quebra no contêiner |
| 520 | 1: altura da tela em branco do verify-email | o estado virou `AUTH-verify-carregando` (resposta 14), sem altura |
| 560 | 5: largura máxima da página do PDF | 60 % do painel (tela cheia: 40 % em C, 85 % em B) |
| 627 | todas: altura fixa da moldura de C (e 1054 na de B) | sem altura: a moldura mede o conteúdo |

### §2.3 Toda medida em px que aparece nas folhas

É a união dos inventários das nove folhas. O inventário é gerado do próprio arquivo e auditado: **zero px sem declaração** em todas.

| px | declaração |
| --- | --- |
| 1 | bar.hairline |
| 4 | space.xs |
| 6 | radius.chip |
| 8 | space.sm |
| 12 | space.md · radius.control · size.labelSmall |
| 13 | literal V1 §4.4 (metadado de linha) |
| 14 | size.label · (touch.min − 20) / 2 (padding vertical da LinhaDeAviso) |
| 15 | size.bodySmall |
| 16 | space.lg · size.body |
| 17 | size.button |
| 18 | size.input |
| 20 | radius.pill · ícone 20 (catálogo V1, anexo D) · entrelinha da LinhaDeAviso |
| 22 | size.title · zoomDefault |
| 24 | space.xl · ícone 24 (catálogo V1, anexo D) |
| 26 | size.titleSmall |
| 28 | size.titleLarge · ícone 28 (catálogo V1, anexo D) |
| 32 | space.xxl |
| 36 | literal N3 (botão de ação da LinhaDeAviso) |
| 48 | space.xxxl · touch.min |
| 56 | touch.list |
| 58 | touch.list + 2 (botão secundário do S0, V1 §5.2) |
| 60 | touch.list + 4 (campo do S0, V1 §5.2) |
| 64 | bar.top |
| 72 | web.linhaMusica |
| 80 | web.linhaLista |
| 96 | folha.topo (B) · 2 × touch.min (campo de duas linhas) |
| 100 | folha.topo (C) |
| 140 | literal S0 (vão marca | formulário, V1 E10) |
| 219 | literal S0 (altura da marca) |
| 240 | web.zonaArquivo · 5 × touch.min (campo de letra) |
| 320 | web.colunaLateral |
| 340 | literal S0 (largura da marca) |
| 420 | literal S0 (coluna do formulário) |
| 663 | folha.largura (B) |
| 711 | largura da faixa B (theme.ts, E1) |
| 720 | folha.largura (C) |
| 1138 | web.conteiner · largura da faixa C (theme.ts, E1) |

0 aparece só como `0px` (sem medida). Percentuais (60 %, 40 %, 85 %) e frações de grade não são medidas em px.

### §2.4 Tokens por elemento, por superfície

### Linha de aviso — `0-linha-de-aviso/telas.html` · 8 estado(s)

| elemento | C | B |
| --- | --- | --- |
| linha | largura do contêiner · altura mín. touch.min · fundo bg · contorno line (bar.hairline) · padding (touch.min − 20) / 2 e space.xl · vão space.md | igual |
| bloco do texto | flex com base web.colunaLateral (limiar de quebra da ação) | igual; a ação desce quando não cabe |
| ícone | 20 · traço 1,5 · falha errorInk · sem conexão / limite offlineInk · garantida accentInk | igual |
| texto | font.ui · size.label · entrelinha 20 · text · quebra sem elidir | igual |
| detalhe | font.ui · size.label · entrelinha 20 · muted · vão space.xs | igual |
| ação Tentar de novo | alvo touch.min · botão 36 (literal N3) · radius.control · contorno lineInfo · tentar novamente 20 · size.label | igual |
| posição | abaixo do título da tela · abaixo do cabeçalho do painel da ação · dentro do diálogo, acima dos botões | igual |
| diálogo (exemplo) | folha.largura 720 · padding space.xxl | folha.largura 663 |

Medidas em px presentes no arquivo: 1 · 4 · 6 · 8 · 12 · 14 · 15 · 16 · 17 · 20 · 22 · 24 · 28 · 32 · 36 · 48 · 56 · 320 · 663 · 711 · 720 · 1138 — todas declaradas (§2.3).

Estados: `AVISO-falha` · `AVISO-falha-sem-acao` · `AVISO-rede` · `AVISO-limite` · `AVISO-sucesso` · `AVISO-detalhe` · `AVISO-longo` · `AVISO-dialogo-apagar`

### Auth — `1-auth/telas.html` · 46 estado(s)

| elemento | C | B |
| --- | --- | --- |
| moldura da faixa | 1138 = web.conteiner · bg · contorno line (bar.hairline) · radius.chip · padding space.xxxl | 711 (largura da faixa B) · igual |
| composição | marca \| formulário lado a lado · vão 140 (literal do S0, V1 E10) | empilha: marca em cima · vão space.xxxl |
| marca | logo-octavia-dark 340 × 219 (literal do S0) · nome acessível "Octavia" | igual |
| coluna do formulário | 420 (literal do S0) · vão space.xxl | igual — 420 cabe em 711 − 2 × space.xl |
| rótulo da tela | font.display · size.bodySmall · tracking.displayWide · muted · caixa alta | igual |
| apoio | font.ui · size.body · muted | igual |
| rótulo do campo | font.ui · size.label · muted | igual |
| campo | touch.list + 4 · radius.control · borda lineInfo (erro: errorInk) · padding space.lg · vão space.md · size.input | igual |
| ícone do campo (email, senha) | 20 · traço 1,5 · lineInfo | igual |
| validação do campo | falha 20 · errorInk · size.label · vão space.md | igual |
| LinhaDeAviso | altura mín. touch.min · padding (touch.min − 20) / 2 e space.xl · entrelinha 20 · ícone 20 · size.label · ação: botão 36 (literal N3) em alvo touch.min | igual (a ação desce se não couber) |
| marca do Google | 20 × 20 · asset de terceiro (não é ícone do catálogo) · nome acessível "Google" | igual |
| validação sob o botão do Google | falha 20 · errorInk · size.label · vão space.md | igual |
| botão principal | touch.list · radius.control · fundo text · rótulo bg · font.uiBold · size.button · log-in 24 · traço 1,75 | igual |
| botão principal inativo | contorno lineInfo · rótulo muted | igual |
| botão secundário | touch.list + 2 · radius.control · contorno lineInfo · size.bodySmall | igual |
| link | accentInk · size.label | igual |

Medidas em px presentes no arquivo: 1 · 4 · 6 · 8 · 12 · 14 · 15 · 16 · 17 · 18 · 20 · 22 · 24 · 28 · 32 · 36 · 48 · 56 · 58 · 60 · 140 · 219 · 320 · 340 · 420 · 711 · 1138 — todas declaradas (§2.3).

Estados: `AUTH-login` · `AUTH-login-validacao` · `AUTH-login-entrando` · `AUTH-login-google` · `AUTH-login-redirecionando` · `AUTH-login-sem-token` · `AUTH-login-credencial` · `AUTH-login-limite-prazo` · `AUTH-login-limite` · `AUTH-login-rede` · `AUTH-login-google-erro` · `AUTH-login-nao-configurado` · `AUTH-login-perfil-401` · `AUTH-login-servidor` · `AUTH-signup` · `AUTH-signup-validacao` · `AUTH-signup-senhas` · `AUTH-signup-criando` · `AUTH-signup-email-usado` · `AUTH-signup-senha-fraca` · `AUTH-signup-rede` · `AUTH-signup-limite` · `AUTH-signup-perfil` · `AUTH-signup-excecao` · `AUTH-confirm` · `AUTH-confirm-enviando` · `AUTH-confirm-sucesso` · `AUTH-confirm-erro` · `AUTH-confirm-erro-rede` · `AUTH-confirm-sem-usuario` · `AUTH-confirm-excecao` · `AUTH-verify-carregando` · `AUTH-verify` · `AUTH-verify-checando` · `AUTH-verify-enviando` · `AUTH-verify-nao-verificado` · `AUTH-verify-checar-falhou` · `AUTH-verify-reenviar-erro` · `AUTH-verify-reenviar-limite` · `AUTH-verify-reenviado` · `AUTH-forgot` · `AUTH-forgot-validacao` · `AUTH-forgot-enviando` · `AUTH-forgot-indisponivel` · `AUTH-forgot-erro` · `AUTH-forgot-sucesso`

### Landing — `2-landing/telas.html` · 1 estado(s)

| elemento | C | B |
| --- | --- | --- |
| moldura da faixa | web.conteiner (1138) · padding space.xxxl · radius.chip · contorno line | 711 · igual |
| composição | marca \| coluna lado a lado · vão 140 (literal S0) | web.empilha: marca em cima · vão space.xxxl |
| marca | 340 × 219 (literal S0) · nome acessível "Octavia" | igual |
| coluna | 420 (literal S0) · vão space.xxl | igual |
| frase | font.displayMedium · size.title · lineHeight.text · text | igual |
| Entrar (principal) | touch.list · radius.control · fundo text · rótulo bg · font.uiBold · size.button · log-in 24 | igual |
| Criar conta (secundário) | touch.list + 2 · contorno lineInfo · size.bodySmall | igual |
| link da política | accentInk · size.label | igual |

Medidas em px presentes no arquivo: 1 · 6 · 8 · 12 · 14 · 15 · 16 · 17 · 22 · 24 · 28 · 32 · 48 · 56 · 58 · 140 · 219 · 320 · 340 · 420 · 711 · 1138 — todas declaradas (§2.3).

Estados: `LANDING`

### Privacy policy — `3-privacy-policy/telas.html` · 1 estado(s)

| elemento | C | B |
| --- | --- | --- |
| margem | web.margem = space.xxl | web.margem = space.xl |
| coluna | folha.largura (720) | folha.largura (663) |
| título | font.display · size.titleLarge · text (sem caixa alta) | igual |
| seção | font.display · size.title · text · vão space.md | igual |
| corpo | font.ui · size.body · lineHeight.text · text (inglês e português com a mesma tinta) | igual |
| entre seções | space.xxl | igual |
| e-mail | accentInk, sublinhado | igual |

Medidas em px presentes no arquivo: 1 · 6 · 8 · 12 · 14 · 16 · 17 · 22 · 24 · 28 · 32 · 48 · 320 · 663 · 711 · 720 · 1138 — todas declaradas (§2.3).

Estados: `PRIVACY`

### Content — lista — `4-content-lista/telas.html` · 15 estado(s)

| elemento | C | B |
| --- | --- | --- |
| contêiner | web.conteiner (1138) · web.margem = space.xxl · acima de 1138, margem em bg | largura toda (711) · web.margem = space.xl · web.empilha |
| barra superior | bar.top · uma linha: marca · navegação · busca · conta · vão space.xl | empilha: bar.top (marca · busca · conta) + touch.list (navegação) |
| marca na barra | font.display · size.title · tracking.displayWide · nome acessível "Octavia" | igual |
| item de navegação | touch.min · radius.control · size.bodySmall · muted; ativo: text, contorno accentInk, fundo a 12 % | igual |
| busca da barra | touch.min · contorno lineInfo · busca 20 lineInfo · size.bodySmall | igual |
| conta | touch.min × touch.min · radius.pill · font.uiBold · size.label | igual |
| título da tela | font.display · size.titleSmall · tracking.displayWide | igual; controles descem para a linha de baixo |
| botão de escrita (Adicionar) | touch.list · contorno lineInfo · adicionar 24 accentInk · rótulo text | igual |
| contador | 4 colunas · radius.control · número font.display size.titleLarge · rótulo size.label muted | 2 colunas |
| lista do painel | 2 colunas · linha touch.list · ícone de tipo 20 lineInfo · título size.body · tipo 13 (literal V1 §4.4) | 1 coluna |
| linha da biblioteca | mín. web.linhaLista (80) · padding space.xl · título size.body · apoio size.label muted · data 13 | ações descem para a segunda linha |
| Favoritar / Mais | touch.min · radius.control · contorno lineInfo; pressionado accentInk + 12 % | igual |
| paginação | touch.min · atual: contorno accentInk + 12 % · anterior inativo em lineInfo traço 1,25 | igual |
| vazio central | sem conteúdo 28 · font.display size.title tracking.display · apoio size.body | igual |
| menus (filtros, Mais) | largura do conteúdo · abaixo do controle, vão space.sm · itens touch.min | igual |
| diálogo | folha.largura 720 · folha.topo 100 · padding space.xxl | folha.largura 663 · folha.topo 96 |

Medidas em px presentes no arquivo: 1 · 4 · 6 · 8 · 12 · 13 · 14 · 15 · 16 · 17 · 20 · 22 · 24 · 26 · 28 · 32 · 36 · 48 · 56 · 64 · 80 · 96 · 100 · 320 · 663 · 711 · 720 · 1138 — todas declaradas (§2.3).

Estados: `DASH` · `DASH-vazio` · `DASH-vazio-favoritas` · `DASH-erro` · `SESSAO-nao-renovada` · `LIB` · `LIB-filtros` · `LIB-mais` · `LIB-salvo` · `LIB-carregando-chunk` · `LIB-carregando` · `LIB-vazio` · `LIB-vazio-busca` · `LIB-erro` · `LIB-apagar`

### Content — visualização — `5-content-visualizacao/telas.html` · 15 estado(s)

| elemento | C | B |
| --- | --- | --- |
| casca | a da superfície 4 (bar.top, uma linha) | empilha (bar.top + touch.list) |
| cabeçalho | voltar 24 em alvo touch.min · título font.displayMedium size.titleSmall (sem caixa alta: é dado) · tipo 20 + size.label muted · padding space.xl | ações descem para a linha de baixo, recuo touch.min + space.lg |
| Editar | touch.list · radius.control · contorno lineInfo · renomear 24 accentInk · rótulo text | igual |
| corpo \| detalhes | lado a lado · vão space.xl · detalhes em web.colunaLateral (320) | web.empilha: detalhes abaixo, largura toda |
| painel | contorno line · radius.control · rótulo font.mono size.labelSmall tracking.label | igual |
| corpo de texto | font.mono · zoomDefault (22) · lineHeight.text (tab: lineHeight.tab) · sem quebra, rola na horizontal dentro do painel | igual |
| barra do PDF | controles touch.min · zoom −/+ 24 · ajuste ativo contorno accentInk + 12 % · anterior inativo lineInfo traço 1,25 | empilha em duas linhas |
| tela cheia | barra bar.top · Sair: fechar 24 + rótulo · página a 40 % da largura | página a 85 % |
| página do PDF | light.bg com contorno light.line (é o papel do arquivo) · 60 % do painel | igual |
| vazio do painel | sem conteúdo 28 lineInfo · size.body · apoio size.label muted | igual |
| detalhes | rótulo font.display size.button tracking.display muted · par chave size.label muted / valor text | igual |

Medidas em px presentes no arquivo: 0 · 1 · 4 · 6 · 8 · 12 · 14 · 15 · 16 · 17 · 20 · 22 · 24 · 26 · 28 · 32 · 36 · 48 · 56 · 64 · 320 · 420 · 711 · 1138 — todas declaradas (§2.3).

Estados: `VIEW-cifra` · `VIEW-letra` · `VIEW-tab` · `VIEW-partitura` · `VIEW-partitura-cheia` · `VIEW-carregando-arquivo` · `VIEW-carregando-pdf` · `VIEW-vazio-partitura` · `VIEW-vazio-letra` · `VIEW-vazio-tab` · `VIEW-vazio-cifra` · `VIEW-erro-cache` · `VIEW-erro-formato` · `VIEW-erro-pdf` · `VIEW-erro-render`

### Content — editor — `6-content-editor/telas.html` · 15 estado(s)

| elemento | C | B |
| --- | --- | --- |
| cabeçalho do editor | voltar 24 alvo touch.min · título font.displayMedium size.titleSmall · tipo size.label muted | ações descem, recuo touch.min + space.lg |
| chip "alterações não salvas" | altura space.xxl · contorno e texto offlineInk · radius.chip · 13 (literal V1 §4.4) · só quando há alteração | igual |
| Salvar | touch.list · visto 24 accentInk · rótulo text; inativo: visto inteiro lineInfo traço 1,25, rótulo muted, motivo size.label muted ao lado | igual |
| editor \| detalhes | lado a lado · detalhes em web.colunaLateral (320) | web.empilha |
| bloco | contorno line · radius.control · título font.display size.button tracking.display muted | igual |
| campo | touch.min · contorno lineInfo · radius.control · size.body · rótulo size.label muted · grade de 3 colunas · duas linhas = 2 × touch.min · letra = 5 × touch.min | grade de 2 colunas |
| texto em mono | font.mono · zoomDefault (22) · lineHeight.text / lineHeight.tab · rola na horizontal dentro do painel | igual |
| acorde rápido | touch.min × touch.min mín. · font.monoBold · size.bodySmall | quebra em mais linhas |
| Adicionar seção / compasso | touch.min · adicionar 20 accentInk · rótulo text | igual |
| caixa de marcar | 20 · contorno lineInfo · radius.chip · alvo touch.min | igual |

Medidas em px presentes no arquivo: 0 · 1 · 4 · 6 · 8 · 12 · 13 · 14 · 15 · 16 · 17 · 20 · 22 · 24 · 26 · 28 · 32 · 36 · 48 · 56 · 64 · 96 · 240 · 320 · 420 · 711 · 1138 — todas declaradas (§2.3).

Estados: `EDIT-cifra` · `EDIT-sem-mudancas` · `EDIT-salvando` · `EDIT-tab` · `EDIT-letra` · `EDIT-carregando-auth` · `EDIT-carregando` · `EDIT-carregando-editor` · `EDIT-sem-usuario` · `EDIT-erro-rede` · `EDIT-erro-auth` · `EDIT-erro-limite` · `EDIT-erro-servidor` · `EDIT-404` · `EDIT-salvar-erro`

### Upload — `7-upload/telas.html` · 20 estado(s)

| elemento | C | B |
| --- | --- | --- |
| casca e título | as da superfície 4 · título font.display size.titleSmall | empilha |
| passos | radius.chip · 13 · atual contorno accentInk + 12 % | descem para baixo do título |
| cartão de escolha | radius.control · contorno lineInfo · marcado accentInk + 12 % · título size.button uiBold · apoio size.label | 2 colunas viram 1; tipos em 2 × 2 |
| zona de arquivo | altura mín. web.zonaArquivo (240) · tracejado lineInfo (ausente) · erro errorInk · padding space.xxl | igual |
| campo | touch.min · radius.control · contorno lineInfo · rótulo size.label muted | 2 colunas viram 1 |
| Salvar / Importar | touch.list · visto ou adicionar 24 accentInk · inativo lineInfo traço 1,25 + motivo size.label | igual; o motivo sobe para cima dos botões se não couber |
| linha do lote | grade: número (largura do conteúdo) · título · artista · número font.mono size.label muted · campo de artista touch.min · padding space.md space.xl | igual |
| pronto | garantida 28 text · font.display size.title | igual |

Medidas em px presentes no arquivo: 1 · 4 · 6 · 8 · 12 · 13 · 14 · 15 · 16 · 17 · 20 · 22 · 24 · 26 · 28 · 32 · 36 · 48 · 56 · 64 · 96 · 240 · 320 · 711 · 1138 — todas declaradas (§2.3).

Estados: `UP-carregando` · `UP-como` · `UP-arquivo` · `UP-enviando` · `UP-extensao` · `UP-limite` · `UP-envio-rede` · `UP-envio-servidor` · `UP-detalhes` · `UP-detalhes-inativo` · `UP-salvando` · `UP-salvar-erro` · `UP-criar` · `UP-criar-validacao` · `UP-lote` · `UP-lote-importando` · `UP-lote-erro` · `UP-lote-vazio` · `UP-lote-sucesso` · `UP-pronto`

### Setlists — `8-setlists/telas.html` · 20 estado(s)

| elemento | C | B |
| --- | --- | --- |
| lista \| setlist aberta | lado a lado · web.razaoListaDetalhe (2 : 3) · vão space.xl | web.empilha: a setlist aberta desce |
| Nova setlist | touch.list · nova setlist 24 accentInk · rótulo text | igual |
| cartão | radius.control · contorno line; atual accentInk · nome font.display size.title tracking.label caixa alta · metadados size.label muted, n.º de músicas 20 lineInfo | igual |
| Editar / Apagar do cartão | só ícone 24 em alvo touch.min · renomear accentInk · apagar setlist errorInk · nome acessível longo | igual |
| cabeçalho da setlist | nome font.display size.title tracking.display · Editar e Adicionar músicas touch.list | rótulo curto "Adicionar", nome acessível longo (N3-D17) |
| linha de música | mín. web.linhaMusica (72) · ordem fixa, sem alça · padding space.xl · número font.mono size.label muted · título size.body · artista e tipo 13 · remover 24 accentInk em touch.min | igual |
| carregando (blocos) | três blocos de web.linhaLista (80) · contorno line · sem texto | igual |
| diálogo | faixas.folha 720 · topo 100 · padding space.xxl · campos touch.min em 2 colunas | 663 · topo 96 · 1 coluna |
| botão do diálogo | touch.list · Criar/Salvar visto accentInk · Apagar contorno e ícone errorInk · inativo lineInfo traço 1,25 + motivo size.label | igual; motivo sobe se não couber |
| LinhaDeAviso | abaixo do título da lista (carregar), abaixo do cabeçalho da setlist (remover), dentro do diálogo acima dos botões (criar, apagar, adicionar) | igual |

Medidas em px presentes no arquivo: 1 · 4 · 6 · 8 · 12 · 13 · 14 · 15 · 16 · 17 · 20 · 22 · 24 · 26 · 28 · 32 · 36 · 48 · 56 · 64 · 72 · 80 · 96 · 100 · 320 · 663 · 711 · 720 · 1138 — todas declaradas (§2.3).

Estados: `SET` · `SET-nenhuma` · `SET-carregando` · `SET-carregando-dados` · `SET-vazio` · `SET-erro` · `SET-criar` · `SET-criar-validacao` · `SET-criar-salvando` · `SET-criar-erro` · `SET-apagar` · `SET-apagar-erro` · `SET-ja-apagada` · `SET-sem-musicas` · `SET-adicionar` · `SET-adicionar-vazio` · `SET-adicionar-busca` · `SET-adicionar-enviando` · `SET-adicionar-erro` · `SET-remover-erro`


## §3 · A `LinhaDeAviso` como ficou

A folha própria é a `0-linha-de-aviso/telas.html`, com 8 estados em C e B. O componente é um só e está em toda falha das oito folhas.

- **Tipos:**
  - falha: falha 20 em `errorInk`;
  - sem conexão: sem conexão 20 em `offlineInk`;
  - limite: última sincronização 20 em `offlineInk`;
  - sucesso: garantida 20 em `accentInk`.
- **Quando o sucesso aparece:** só quando a tela não mostra o resultado por si: e-mail enviado (`AUTH-confirm-sucesso`, `AUTH-verify-reenviado`), lote importado (`UP-lote-sucesso`) e alterações salvas (`LIB-salvo`). Apagado, favoritado, adicionado e removido não têm frase, porque a lista já mudou.
- **Medidas:**
  - altura mínima `touch.min`;
  - padding `(touch.min − 20) / 2` na vertical e `space.xl` na horizontal;
  - vão `space.md`;
  - texto em `size.label`, entrelinha 20, `text`; `detalhe` em `muted`;
  - a linha cresce para caber o texto e **nunca elide**.
- **Ação *Tentar de novo*:** botão de 36 (literal N3) em alvo `touch.min`. Quando não cabe na linha, desce para baixo do texto. O bloco de texto quebra com base em `web.colunaLateral`.
- **Quando a linha não tem ação:** quando repetir não resolve (401/403, 429, validação do servidor, 404 "esta setlist já foi apagada") e **dentro do diálogo de apagar setlist** (`SET-apagar-erro`, `AVISO-dialogo-apagar`), onde quem repete é o *Apagar* do diálogo.
- **Posição:**
  - abaixo do título da tela, para carregar e para o aviso de topo `sessao.nao-renovada`;
  - abaixo do cabeçalho do painel em que a ação aconteceu, por exemplo remover música;
  - dentro do diálogo, acima dos botões: criar, editar, apagar e adicionar.
- **Uma linha por tela:** se há mais de uma falha, vence a que bloqueia mais.
- **Forma da frase:** `não foi possível <ato> — <motivo>`, com o motivo da espécie. Onde o código não conhece o status (forgot-password), o motivo é `motivo.generico`.

## §4 · Tokens que faltaram na rodada 1 — resolvidos

1. Bloco `web` em `TokensDaFaixa`, com os nomes e valores da §2.1.
2. Barra superior: composição de tokens existentes (`bar.top` em C; `bar.top` + `touch.list` em B), sem token novo.
3. Campo fora do auth: `touch.min`. O login e o signup mantêm `touch.list + 4` (S0).
4. `web.colunaLateral` (320) e `web.razaoListaDetalhe` (2 : 3).
5. Marca na barra: texto em `font.display` · `size.title` · `tracking.displayWide`.
6. Corpo de conteúdo: `zoomDefault` (22), mono, sem controle de zoom.
7. `web.linhaLista` (80) e `web.linhaMusica` (72).
8. `web.zonaArquivo` (240).
9. Padding da LinhaDeAviso = `(touch.min − 20) / 2`, derivado; botão de ação 36, literal N3.

## §5 · Frases por superfície (finais)

Formato: `chave · texto pt-BR · frase de hoje`. Removidas nesta rodada: `lib.apagado`, `lib.favoritado`, `lib.desfavoritado` (resposta 7); Download e Refresh Page do PDF (18); favoritar e apagar na visualização (20, 28); alça e reordenar (27); `lib.erro.atualizar`, `set.copia` e `lib.copia` (N3); `up.sem-resposta` (N9); `set.erro.adicionar.parcial` (N11). Estilo do nativo: minúsculas, travessão, sem ponto final; botões com inicial maiúscula. `{x}` é dado.

### §5.1 Comuns

- `motivo.rede` · sem conexão · "Network error…", "Failed to fetch"
- `motivo.auth` · o servidor não aceitou a sessão — entre de novo · "Authentication failed…", "Authentication required"
- `motivo.limite` · muitas tentativas — tente de novo em instantes · "Too many failed attempts…", "Rate limit exceeded"
- `motivo.servidor` · falha no servidor · "File upload failed", "Failed to create content", "Failed to save…"
- `motivo.recusado` · o servidor recusou os dados · "Validation failed"
- `motivo.generico` · algo deu errado — tente de novo · "An unexpected error occurred", "Something went wrong"
- `acao.tentar` · Tentar de novo · "Try Again" / "Try again" / "Retry"
- `acao.cancelar` · Cancelar · "Cancel"
- `acao.voltar` · Voltar · "Back", "Go Back"
- `estado.carregando` · carregando… · "Loading..." — também nas telas que hoje devolvem `null` (verify-email, editor, add-content)
- `sessao.nao-renovada` · a sessão não foi renovada: {razão} · frase fixa do login. É o aviso de topo em qualquer tela exceto `/login`, desenhado uma vez na folha 4 (`SESSAO-nao-renovada`)

### §5.2 Auth

- **Seis frases fixas do login, literais, todas na LinhaDeAviso:**
  - sem conexão — a sessão não foi aberta → rede no envio da sessão
  - o servidor não aceitou o login — entre de novo → 401 / 403
  - muitas tentativas de entrar — tente de novo em {N} → 429 com prazo
  - muitas tentativas de entrar — tente de novo em instantes → 429 sem prazo
  - falha no servidor — a sessão não foi aberta → 5xx e o resto, inclusive "Unable to obtain authentication token"
  - a sessão não foi renovada: {razão} → fora do /login (4.1)
- **Validação de campo, antes do envio da sessão (sob o campo ou sob o botão do Google):**
  - `login.credencial` · e-mail ou senha não conferem · "Invalid email or password…"
  - `login.sem-conta-email` · nenhuma conta com este e-mail · "No account found…"
  - `login.senha-incorreta` · senha incorreta · "Incorrect password…"
  - `login.google-cancelado` · o login com Google foi cancelado · "Sign-in was cancelled…"
  - `login.google-bloqueado` · o navegador bloqueou a janela do Google — libere pop-ups e tente de novo · "Sign-in popup was blocked…"
- `login.razao.sem-token` · o servidor não devolveu o token · "Unable to obtain authentication token"
- `login.rotulo` / `login.entrar` · Entrar · "Sign In"
- `login.entrando` · Entrando… · "Signing in..."
- `login.email` · E-mail · "Email"
- `login.email.placeholder` · voce@exemplo.com · "your.email@example.com"
- `login.senha` · Senha · "Password"
- `login.esqueci` · Esqueci a senha · "Forgot password?"
- `login.ou` · ou · "or"
- `login.google` · Entrar com Google · (botão existente)
- `login.google.carregando` · Carregando… · "Loading..."
- `login.sem-conta` / `login.criar-conta` · Não tem conta? / Criar conta · "Don't have an account?" / "Sign up"
- `login.abrindo` · abrindo o painel… · "Redirecting to dashboard..."
- `login.nao-abriu` / `login.abrir-painel` · Não abriu? / Abrir o painel · "Click here if not redirected automatically"
- `login.nao-configurado` · o login não está disponível neste servidor · "Authentication not configured"
- `signup.rotulo` / `signup.criar` · Criar conta · "Sign Up"
- `signup.nome` / `signup.sobrenome` · Nome / Sobrenome · "First Name" / "Last Name"
- `signup.instrumento` · Instrumento principal · "Primary Instrument" (Violão/Guitarra · Piano · Violino · Bateria · Voz · Baixo · Outro)
- `signup.senha.dica` · no mínimo 6 caracteres · "Password must be at least 6 characters"
- `signup.confirmar` · Confirmar a senha · "Confirm Password"
- `signup.criando` · Criando a conta… · "Creating account..."
- `signup.ja-tem` / `signup.voltar` · Já tem conta? / Voltar para o login · "Back to login"
- `signup.senhas` · as senhas não conferem · "Passwords do not match"
- `signup.email-usado` · já existe uma conta com este e-mail — entre ou use outro · "An account with this email already exists…"
- `signup.senha-fraca` · senha fraca — use pelo menos 6 caracteres · "Password is too weak…"
- `signup.rede` · sem conexão — a conta não foi criada · "Network error…"
- `signup.limite` · muitas tentativas — tente de novo em instantes · "Too many…"
- `signup.perfil` · falha no servidor — o perfil não foi criado · "Failed to create profile in database"
- `confirm.rotulo` · Confirme o e-mail · "Confirm Your Email" / "Verify Your Email"
- `confirm.apoio` · enviamos um link de confirmação para {email} — abra o link para ativar a conta · "We've sent a confirmation link…" + "Email sent to:"
- `confirm.ir-login` · Ir para o login · "Go to Login"
- `confirm.nao-recebeu` · Não recebeu o e-mail? · "Didn't receive the email?"
- `confirm.reenviar` · Reenviar o e-mail · "Resend Verification Email"
- `confirm.enviando` · Enviando… · "Sending..."
- `confirm.enviado` · e-mail de confirmação enviado — veja a caixa de entrada · "Verification email sent successfully!…" (sucesso)
- `confirm.rede` · sem conexão — o e-mail não foi enviado · "Network error…"
- `confirm.sessao-caiu` · a sessão caiu — entre de novo · "Not authenticated or Firebase not configured"
- `verify.apoio` · confirme o e-mail {email} para usar o Octavia · "Please verify your email address…"
- `verify.ja-confirmei` · Já confirmei · "I've Verified My Email"
- `verify.conferindo` · Conferindo… · "Checking..."
- `verify.sair` · Sair · "Sign Out"
- `verify.ajuda` · problemas? veja o spam ou fale com o suporte · "Having trouble?…"
- `verify.nao-confirmado` · o e-mail ainda não foi confirmado — abra o link que enviamos · "Email not verified yet…"
- `verify.checar-falhou` · não foi possível conferir a confirmação · "Failed to check verification status"
- `forgot.rotulo` · Trocar a senha · "Reset Password"
- `forgot.apoio` · digite o e-mail e enviamos um link para trocar a senha · "Enter your email address…"
- `forgot.lembrou` / `forgot.entrar` · Lembrou a senha? / Entrar · "Remember your password?" / "Sign in"
- `forgot.enviando` · Enviando… · "Sending..."
- `forgot.indisponivel` · a troca de senha não está disponível · "Password reset is not available"
- `forgot.erro` · não foi possível enviar o e-mail — algo deu errado · "Failed to send reset email…" + `motivo.generico`
- `forgot.veja` · Veja o e-mail · "Check Your Email"
- `forgot.enviado` · enviamos as instruções para {email} — não chegou? veja o spam ou tente de novo · "We've sent password reset instructions to…"
- `forgot.voltar` · Voltar para o login · "Back to Sign In"

### §5.3 Landing

- `landing.frase` · organize, veja e compartilhe cifras, letras, tabs e partituras · "Organize, visualize, and share your sheet music, tabs, and lyrics…"
- `landing.entrar` · Entrar (principal) · "Sign In"
- `landing.criar` · Criar conta (secundário) · "Sign Up" / "Get Started Free" / "Create Free Account"
- `landing.politica` · Política de privacidade · "Privacy Policy"
- `landing.marca` · Octavia (nome acessível) · alt "Octavia"

### §5.4 Privacy policy

O texto de hoje, inteiro, bilíngue e intacto. As 24 frases de `app/privacy-policy/page.tsx` não são traduzidas nem cortadas.

### §5.5 Content — lista

- **Casca:**
  - `casca.painel` / `.biblioteca` / `.setlists` / `.adicionar` · Painel · Biblioteca · Setlists · Adicionar · "Dashboard" · "Library" · "Setlists" · "Add Song"
  - `casca.buscar` · Buscar… · "Search..."
  - `casca.conta` · Conta de {nome} (nome acessível; frase nova, N12) · menu: Perfil · Sair · "Profile" · "Sign out"
- **Painel:**
  - `dash.titulo` · Painel · "Dashboard"
  - `dash.adicionar` · Adicionar · "Add Content"
  - `dash.abas` · Visão geral · Recentes · Favoritas · "Overview" · "Recent" · "Favorites"
  - `dash.cont.*` · conteúdos na biblioteca · setlists · favoritas · vistas há pouco · "Total Content"… "viewed recently"
  - `dash.recentes` / `dash.favoritas` · Recentes / Favoritas · "Recent Content" / "Favorite Content"
  - `dash.vazio.recentes` · nada visto recentemente · "No recent content"
  - `dash.vazio.favoritas` · nenhuma favorita · "No favorite content"
  - `dash.erro` · não foi possível carregar o painel — {motivo} · "There was an error loading…" (uma linha por tela)
- **Biblioteca:**
  - `lib.titulo` · Biblioteca · "Your Music Library"
  - `lib.filtros` · Filtros · "Filters" — tipo (Letra · Cifra · Tab · Partitura) · dificuldade (Iniciante · Intermediário · Avançado) · Só as favoritas
  - `lib.ordenar` · Mais recentes · Título (A–Z) · Artista (A–Z) · "Most Recent"…
  - `lib.favoritar` / `lib.favorita` · Favoritar / Favorita · rótulo que alterna (frase nova, N12)
  - `lib.mais` · Mais (nome acessível: Mais ações para “{título}”) · "More options"
  - `lib.menu` · Abrir · Editar · Apagar · "View" · "Edit" · "Delete"
  - `lib.paginas` · Anterior · Próxima · "Previous" · "Next"
  - `lib.carregando` · carregando a biblioteca… · "Loading library..." / "Loading your music library..."
  - `lib.vazio` / `.apoio` · nenhum conteúdo ainda / adicione a primeira música para começar · "No content found" / "Add your first piece…"
  - `lib.vazio.busca` / `.apoio` · nada encontrado / mude a busca ou os filtros · "Try adjusting your search or filters"
  - `lib.erro` · não foi possível carregar a biblioteca — {motivo} · "There was an error loading your music library…"
  - `lib.apagar.titulo` · Apagar conteúdo · "Delete Content"
  - `lib.apagar.pergunta` · apagar “{título}”? não dá para desfazer · "Are you sure…? This action cannot be undone."
  - `edit.salvo` · alterações salvas · "Changes saved successfully" (sucesso, depois do redirect do editor)

### §5.6 Content — visualização

- `view.voltar` · Voltar para a biblioteca (nome acessível; frase nova, N12)
- `view.editar` · Editar · "Edit"
- `view.painel` · cifra · letra · tab · partitura · "Chord Chart" · "Lyrics" · "Tablature" · "Sheet Music"
- `view.detalhes` · Detalhes · "Song Details" (+ os rótulos de campo de hoje)
- `view.notas` / `view.notas.vazio` · Notas de palco / nenhuma nota de palco — use Editar para escrever · "Performance Notes" / "No performance notes available" + "Click Edit…"
- `view.tab.meta` · capo: {x} · afinação: {x} · "Capo:" · "Tuning:"
- `view.pdf.pagina` · página {n} de {N} · "Page" · "of"
- `view.pdf.largura` / `.pagina` · Largura / Página (nomes acessíveis: Ajustar à largura / Ajustar à página) · "Fit width" / "Fit page"
- `view.pdf.tela-cheia` / `.sair` · Tela cheia / Sair da tela cheia · (controle existente)
- `view.pdf.carregando` · carregando o PDF… · "Loading PDF..."
- `view.vazio.partitura` / `.apoio` · nenhuma partitura / envie um PDF ou uma imagem para ver a partitura · "No sheet music available" / "Upload a PDF or image…"
- `view.vazio.letra` / `.apoio` · nenhuma letra / escreva a letra para ter no palco · "No lyrics available" / "Add lyrics…"
- `view.erro.cache` · não foi possível abrir o arquivo guardado neste navegador · "Failed to load cached file"
- `view.erro.formato` · não foi possível abrir o arquivo — confira o formato · "Failed to load file. Please check the file format…"
- `view.erro.pdf` · não foi possível abrir o PDF — {motivo} (o arquivo está corrompido ou inacessível · formato de PDF inválido · a cópia guardada está corrompida — recarregue a página) · "Failed to load PDF"…
- `view.erro.render` · algo deu errado · "Something went wrong"

### §5.7 Content — editor

- `edit.nao-salvo` · alterações não salvas (só quando houver alteração) · "Unsaved changes"
- `edit.salvar` / `edit.salvando` · Salvar / Salvando… · "Save Changes" / "Saving..."
- `edit.voltar` · Voltar sem salvar (nome acessível; frase nova, N12)
- `edit.carregando` · carregando o conteúdo… · "Loading content for editing..."
- `edit.carregando.editor` · carregando o editor… · "Loading editor..."
- `edit.erro.carregar` · não foi possível carregar o conteúdo — {motivo} · "Failed to load content for editing." (por espécie: rede · 401 · 429 · 5xx)
- `edit.nao-existe` · este conteúdo não existe · "Content Not Found" / "The content you're trying to edit doesn't exist."
- `edit.ir-biblioteca` · Ir para a biblioteca · "Browse Library"
- `edit.erro.salvar` · não foi possível salvar — {motivo} · "Failed to save changes"
- `edit.cifra.*` · Informações · Título · Artista · Tom · Capo · BPM · Acordes rápidos · Seções · Adicionar seção · Nome da seção · Progressão · Letra da seção · Prévia · "Song Information"… "Preview"
- `edit.tab.*` · Afinação (Padrão (EADGBE) · Drop D (DADGBE) · Sol aberto (DGDGBD) · DADGAD) · Tablatura · Adicionar compasso · compasso {n} · "Tuning"… "Measure"
- `edit.letra.placeholder` · escreva a letra — use [Verso 1], [Refrão]… para marcar as seções · "Enter your lyrics here… Use [Verse 1], [Chorus]…"
- `edit.meta.*` · Detalhes · Básico · Música · Organização · Título * · Artista · Álbum · Gênero · Tom · BPM · Compasso · Dificuldade · Tags · Notas · Favorita · Pública (dá para compartilhar) · "Basic Info"… "Make this content public (shareable)"

### §5.8 Upload

- `up.passos` · como · detalhes · pronto
- `up.como` · como você quer adicionar? · "How would you like to add content?"
- `up.criar` / `.apoio` · Criar do zero / escreva no editor · "Create New" / "Start from scratch…"
- `up.importar` · Importar de arquivo · "Import from File"
- `up.tipo` · tipo de conteúdo · "Content Type"
- `up.importar.tipo` · importar · Um arquivo · Várias músicas num arquivo · "Import Type"
- `up.zona` · arraste o arquivo para cá · "Import Music File"
- `up.escolher` · Escolher arquivo (nome acessível: Escolher o arquivo de música) · "Browse files" / "Upload music file"
- `up.formatos` · formatos: .pdf, .docx, .txt · até 4 MiB · "Supported formats:" + "(max 50MB)" (número corrigido)
- `up.enviando` · enviando o arquivo… · "Uploading file..."
- `up.extensao` · tipo de arquivo não aceito: {nome} — use {lista} · "Unsupported file type…"
- `up.erro.envio` · o arquivo não foi enviado — {motivo} · "File upload failed", "Failed to fetch" (= `motivo.rede`)
- `up.meta.*` · Título * · Artista * · Álbum · Gênero · Ano · Notas · Opções avançadas · Cancelar · Salvar · Salvando… · "Title *"… "Saving..."
- `up.meta.obrigatorios` · título e artista são obrigatórios · "Title and Artist are required"
- `up.erro.salvar` · não foi possível salvar — {motivo} · "Failed to save content"
- `up.criar.titulo` / `up.proximo` · Título / Próximo · "Title" / "Next"
- `up.titulo-obrigatorio` · o título é obrigatório · "Title is required"
- `up.lote.importar` / `.importando` · Importar todas / Importando… · "Import All"
- `up.lote.erro` · não foi possível importar as músicas — {motivo} · "Failed to import songs"
- `up.lote.vazio` · nenhuma música encontrada no arquivo · "No songs found in the file"
- `up.lote.ler` · não foi possível ler o arquivo · "Failed to parse file"
- `up.lote.ok` · {n} músicas importadas · "{n} songs imported successfully" (sucesso)
- `up.pronto` / `.apoio` · pronto / “{título}”, de {artista}, está na biblioteca · "🎉 Done!…" / ""{título}" by {artista}"
- `up.ir-biblioteca` · Ir para a biblioteca · "Go to Library"

### §5.9 Setlists

- `set.titulo` · Setlists · "Your Setlists"
- `set.contagem` · {n} setlists · "setlist"
- `set.nova` · Nova setlist · "Create Setlist"
- `set.musicas` · {n} músicas / 1 música · "song"
- `set.editar` / `set.apagar` · nomes acessíveis Editar a setlist {nome} / Apagar a setlist {nome} · "Edit setlist" / "Delete setlist"
- `set.adicionar` · Adicionar músicas (B: Adicionar; nome acessível: Adicionar músicas a {nome}) · "Add Songs"
- `set.remover` · Remover {título} da setlist (nome acessível) · "Remove song"
- `set.carregando` · carregando as setlists… · "Loading your setlists..." / "Loading setlists..."
- `set.vazio` / `.apoio` / `.acao` · nenhuma setlist ainda / crie a primeira para organizar as músicas do show / Criar a primeira setlist · "No setlists yet"…
- `set.erro` · não foi possível carregar as setlists — {motivo} · "Couldn't load setlists…"
- `set.nenhuma` · escolha uma setlist para ver os detalhes · "Select a setlist to view its details"
- `set.form.*` · Nova setlist · Editar setlist · Nome · Descrição · Data do show · Local · Notas · Criar · Salvar · Criando… · "Setlist Name"… "Notes"
- `set.erro.criar` / `.salvar` · não foi possível criar a setlist / salvar a setlist — {motivo} · "Failed to save setlist"
- `set.apagar.titulo` / `.pergunta` · Apagar setlist / apagar “{nome}”? não dá para desfazer · "Delete Setlist" / "Are you sure…"
- `set.erro.apagar` · não foi possível apagar a setlist — {motivo} (sem *Tentar de novo*: o Apagar do diálogo repete) · "Failed to delete setlist"
- `set.ja-apagada` · esta setlist já foi apagada · "Setlist not found"
- `set.sem-musicas` / `.apoio` · nenhuma música ainda / adicione músicas da biblioteca · "No songs yet"…
- `set.picker.titulo` · Adicionar a {nome} · "Add Songs to Setlist"
- `set.picker.busca` · buscar por título, artista ou tipo · "Search by title, artist, or content type..."
- `set.picker.todas` · Selecionar todas ({n}) · "Select all (… songs)"
- `set.picker.ok` · Adicionar {n} · Adicionando… · "Add" + "Song"
- `set.picker.vazio` / `.apoio` · nenhuma música disponível / adicione músicas à biblioteca primeiro · "No songs available"…
- `set.picker.busca-vazia` · nada encontrado / mude a busca · "No matching songs"…
- `set.erro.adicionar` · não foi possível adicionar as músicas — {motivo} (também para falha a meio da adição) · "Failed to add songs"
- `set.erro.remover` · não foi possível remover “{título}” — {motivo} · "Failed to remove song"

### §5.10 · Frases novas — as nove que ficaram

| # | chave | texto |
| --- | --- | --- |
| N1 | `forgot.enviar` | Enviar o link |
| N2 | `digitado-fica` | o que você escreveu continua aqui |
| N4 | `view.vazio.tab` | nenhuma tablatura |
| N5 | `view.vazio.cifra` | nenhuma cifra |
| N6 | `edit.nada-mudou` | nada mudou desde que você abriu |
| N7 | `set.form.sem-nome` | a setlist precisa de um nome |
| N8 | `up.limite` | o arquivo passa de 4 MiB — escolha um menor |
| N10 | `set.picker.todas-ja` | todas as músicas da biblioteca já estão nesta setlist |
| N12 | `casca.conta` · `view.voltar` · `edit.voltar` · `lib.favoritar` / `lib.favorita` | Conta de {nome} · Voltar para a biblioteca · Voltar sem salvar · Favoritar / Favorita |


## §6 · Ícones

Do catálogo (anexo D): letra · cifra · tab (o `d` do catálogo, não o das folhas) · partitura · busca · voltar · **voltar (variante espelhada)** — Próxima · fechar · falha · tentar novamente · sem conexão · última sincronização (limite) · garantida (sucesso, pronto) · n.º de músicas · data · local · sem conteúdo · zoom − · zoom + · sair · nova setlist · renomear · apagar setlist · adicionar · remover.

De fora do catálogo, já declarados: log-in, email e senha (E14.a), e o visto do Salvar (N2, R2·2).

Asset de terceiro, que não é ícone: a **marca do Google** no *Entrar com Google*. Nas folhas, um quadrado tracejado de 20 marca onde ela entra.

Não é mais usado: **alça**, porque o reordenar saiu deste bloco. Favoritar, mais ações, tela cheia, progresso e upload são controles só de texto.


## §7 · Perguntas

Encerradas: as 32 da rodada 1 foram respondidas e aplicadas (§8). Não há pergunta aberta.

## §8 · O que mudou da rodada 1

### Formato

- F1 · todas as folhas · HTML estático autocontido, sem runtime nem template; cada estado é um `<section id data-estado>` no DOM.
- F2 · todas as folhas · inventário de medidas e de cores gerado e auditado no fim de cada arquivo; zero px sem declaração.
- F3 · todas as folhas · as cores fora do tema na folha de documentação (#1C1B22, #1E1C28, #EDE6DB) saíram.
- F4 · nova folha `0-linha-de-aviso` · o componente desenhado em 8 estados.

### Respostas 1–32

1. Sem mudança no desenho (1138 já era o contêiner). Todas as folhas: a tabela de tokens passou a dizer `web.conteiner`.
2. Sem mudança: as folhas já eram escuras, com uma paleta só.
3. Sem mudança: a barra superior já estava desenhada nas folhas 4–8. O botão de recolher a lateral não existe nelas.
4. Folha 1:
   - `AUTH-login-sem-token` passou a "falha no servidor — a sessão não foi aberta";
   - novo `AUTH-login-limite-prazo` ({N});
   - `AUTH-login-limite` ficou com "…em instantes";
   - notas de `-rede`, `-perfil-401` (401/403) e `-servidor` (5xx e o resto) atualizadas.
   "a sessão não foi renovada: {razão}" saiu do /login e virou o estado `SESSAO-nao-renovada` na folha 4.
5. Folha 1: credencial sob o campo, sem mudança (`AUTH-login-credencial`). Os erros do Google saíram da LinhaDeAviso e ficam sob o botão do Google (`AUTH-login-google-erro`).
6. Folha 1:
   - `AUTH-forgot-erro` com `motivo.generico`;
   - novos `AUTH-confirm-erro-rede` e `AUTH-verify-reenviar-limite`;
   - `AUTH-confirm-erro` e `AUTH-verify-reenviar-erro` restritos a 429 e rede.
   Folhas 4, 6, 7 e 8: motivos por espécie nas notas, sem mudança de estado.
7. Folha 4: removidos `LIB-apagado` e `LIB-favoritado` e as frases `lib.apagado`, `lib.favoritado` e `lib.desfavoritado`; novo `LIB-salvo` ("alterações salvas"). Folhas 1 e 7: os sucessos de e-mail enviado e lote importado ficam.
8. Folhas 4–8: campo em `touch.min`, já desenhado assim; as tabelas de tokens perderam a marca de pergunta. Folha 1 sem mudança (`touch.list + 4`).
9. Folha 1: o botão *Entrar com Google* ganhou a marca do Google (quadrado de 20, asset de terceiro) em `AUTH-login` e nos estados derivados. Os demais controles já eram só texto: sem mudança.
10. Sem mudança: reuso de renomear e apagar setlist na folha 4 (menu Mais) e na folha 5 (Editar).
11. Folhas 4 e 5: a *Próxima* da paginação e do visualizador de PDF (`VIEW-partitura`) usa o voltar (variante espelhada), registrado na §6.
12. Sem mudança: a folha 3 já usava `folha.largura`.
13. Folhas 5 e 6: a coluna de detalhes virou `web.colunaLateral`. Folha 8: `web.razaoListaDetalhe`.
14. Folha 1: `AUTH-verify-branco` virou `AUTH-verify-carregando`. Folha 6: `EDIT-sem-usuario` com "carregando…". Folha 7: o "sem usuário" é o `UP-carregando` (nota).
15. Folha 7: a zona de arquivo virou `web.zonaArquivo` (`UP-arquivo` e estados de zona).
16. Sem mudança: na folha 2 *Entrar* já era o principal.
17. Folha 4: `DASH-erro` passou a uma linha por tela (nota).
18. Folha 5: `VIEW-erro-pdf` só com a linha e *Tentar de novo*; Download e Refresh Page saíram da nota e da lista de frases.
19. Sem mudança: o corpo rola dentro do painel nas folhas 5 e 6.
20. Folha 5: *Favoritar* saiu do cabeçalho de todos os estados; `VIEW-favorita` foi removido.
21. Folha 6: *alterações não salvas* só quando há alteração; `EDIT-sem-mudancas` fica sem o chip (nota).
22. Folha 6: novo `EDIT-salvando` ("Salvando…").
23. Folha 7: N9 saiu da nota de `UP-salvar-erro`; "Failed to fetch" é `motivo.rede`.
24. Sem mudança: a cópia velha do passo 1 não é desenhada (nota de `UP-salvar-erro`).
25. Folha 8: `SET-apagar-erro` sem *Tentar de novo*. Folha 0: `AVISO-dialogo-apagar`.
26. Folha 8: `SET-adicionar-erro` sem a segunda linha (N11).
27. Folha 8: a alça saiu de todas as linhas de música e `SET-reordenar` foi removido. A ordem é fixa.
28. Folha 5: *Apagar* saiu do cabeçalho de todos os estados; não há diálogo de apagar na visualização.
29. Sem mudança nas folhas: a implementação usa o `d` do catálogo (§6).
30. Sem mudança: 404 e exceções ficam na tela padrão, sem desenho.
31. Sem mudança: título de música sem caixa alta; nome de setlist em caixa alta (folha 8).
32. Folhas 5 e 6: corpo de conteúdo em mono 22 (`zoomDefault`), em todos os estados de texto.

### §4 da rodada 1 (tokens que faltaram)

1. Todas as folhas: bloco `web` aplicado (§2.1).
2. Folhas 4–8: sem mudança (barra sem token novo).
3. Folhas 4–8: campo `touch.min`. Folha 1: `touch.list + 4`. Sem mudança de desenho.
4. Folhas 5, 6 e 8: `web.colunaLateral` e `web.razaoListaDetalhe`.
5. Folhas 4–8: sem mudança (a marca já era texto).
6. Folhas 5 e 6: mono 22.
7. Folhas 4 e 8: `web.linhaLista` e `web.linhaMusica`; os blocos de carregando da folha 8 passaram de 112 a 80.
8. Folha 7: `web.zonaArquivo`.
9. Todas as folhas: padding derivado e botão de 36 declarados no inventário.

### Frases novas

- N1 · entra · folha 1 · `AUTH-forgot` e derivados (*Enviar o link*).
- N2 · entra · folhas 6, 7 e 8 · `EDIT-salvar-erro`, `UP-salvar-erro`, `SET-criar-erro`.
- N3 · sai · folhas 4 e 8 · `LIB-erro-copia` e `SET-copia` removidos.
- N4 · entra · folha 5 · `VIEW-vazio-tab`.
- N5 · entra · folha 5 · `VIEW-vazio-cifra`.
- N6 · entra · folha 6 · `EDIT-sem-mudancas`.
- N7 · entra · folha 8 · `SET-criar-validacao`.
- N8 · entra · folha 7 · `UP-limite`.
- N9 · sai · folha 7 · nota de `UP-salvar-erro`.
- N10 · entra · folha 8 · `SET-adicionar-vazio` (nota).
- N11 · sai · folha 8 · `SET-adicionar-erro`.
- N12 · entra · folhas 4, 5 e 6 · nomes acessíveis da conta, do voltar e do *Favoritar* / *Favorita*.
