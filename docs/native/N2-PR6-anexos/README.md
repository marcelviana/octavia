# N2-PR6 — anexos (o picker, sobre S2)

Rastro da PR, não fonte: a fonte é o `DESIGN-N2/README.md` §9 e o
`PRD-TELA-2.md`. Tudo aqui foi escrito nesta sessão, na árvore
`../octavia-n2-pr6`, a partir de `origin/main` = `f991eb0`.

## 1 · Extras declarados ANTES do commit 1

A lista fechada do roteiro é: commits 1–3 (+ aceite) e esta pasta. O que
segue sai dela, e está declarado aqui, antes de o primeiro commit existir.

| # | extra | por quê | div. |
|---|---|---|---|
| extra-1 | **`aoResponder` no `escrever()`** (`apps/native/src/escrita.ts`): um retorno opcional, chamado com a classificação preliminar assim que o request volta e ANTES da releitura | o congelado manda a linha virar *adicionada* **com o 201** e o `k` do rodapé contar **201 confirmados** — e o `escrever()` só devolve depois da releitura. Sem o gancho, a tela só saberia do 201 junto com o conjunto novo, e o `k` subiria com a releitura, que é o que a N2-D30 proíbe. Nenhuma regra nova: o módulo continua decidindo tudo, a tela só é avisada mais cedo | 302 |
| extra-2 | **`export` do `Regua`** em `SearchScreen.tsx` | o picker é *"o S4 com um rodapé"*, com *"as mesmas réguas em mono com a contagem à direita"*. Uma palavra no S4 em vez de uma cópia de dez linhas | 309 |
| extra-3 | **linha de aviso no rodapé também para sem rede e para o teto de 100** | o congelado só desenha o aviso de releitura falha; o T2-R12 exige motivo escrito para controle inativo e o T2-R6 diz que *"o picker avisa que, acima de 100, a setlist não pode ser reordenada"*. As duas frases já estão no conjunto (`sem-rede-s2`, `teto-100`); vale o "um aviso por vez, o que bloqueia mais" do §3.3 | 305 |
| extra-4 | **três `testID` além da tabela do §7**: `picker-vazio`, `picker-rodape`, `picker-total` | a mesma razão do `form-falha` (N2-E4) e do `apagar-falha` (div. 267): sem id, o G6 não diz que o estado `N2-P-vazio` e o rodapé de 112 foram alcançados, e o CN não lê a tinta do total | 306 |

## 2 · Divergências (a partir de 301)

Ver `DESIGN-N2/README.md` §9, "Divergências abertas na N2-PR6".

## 3 · Arquivos

| arquivo | o que é |
|---|---|
| `CN-antes.txt` | os CNs do commit 1 contra a árvore de `f991eb0`: **19 reprovam por ausência** (`sem nó com testID="picker-abrir"`), 1 passa — o "S2 do palco não tem porta", que é guarda de regressão (ver §4) |
| `gates-commit1.txt` | G1, G2/G3, `gate:icones` (reprova por `falta no mapa: "adicionar"` — a poda antes do desenho), `gate:icones:cn` (22 → 23) e `gate:a20`, verbatim |
| `gates-commit2.txt` | os mesmos gates sobre `04d9890` (refs commitados): G1 com as seis exceções usadas, G2 69 → 79, G3 64 = 64, `gate:icones` 39 registros · 0 acusações · 0 avisos, `gate:a20` 163 literais · 0; suíte e `tsc` |
| `CN-depois.txt` | os 20 CNs passando, depois do conserto da div. 313 |
| `CN-controles.txt` | quatro controles negativos ad hoc — cada CN que passa, contra o defeito que ele guarda (a porta no palco, o total que sobe com o 201, o relendo… que ocupa as outras linhas, o fio fora dos 64) |
| `linha-do-tempo.txt` | a ordem dos eventos dos CNs (d), log e tela a cada marca |
| `aparato.md` | o §4: G6, G5, as medidas contra o congelado, os toques, o defeito da div. 313, prod, as mutações |
| `device-prod.txt` | o logcat verbatim do §4.2 (duas escritas em prod), sem título nenhum |
| `dumps/` | 15 dumps do MOCK (`SHA256SUMS.txt`) e o resumo em dp de cada um |
| `png/` | `06` (os quatro estados), `08` (relendo… + aviso, rodapé de 112), `13` (a faixa sem rede, recorte) |

## 4 · O CN que não reprova hoje

`(a) a S2 vinda do PALCO não tem porta nenhuma` passa contra `f991eb0`, e
tem de passar: não há porta em lugar nenhum. Ele guarda a regra 7 contra a
REGRESSÃO. A prova de que ele pega vem depois do commit 2, com um controle
negativo ad hoc (a porta desenhada sem olhar a `edicao`).
