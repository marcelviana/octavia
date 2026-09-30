# G-faixa — medições commitadas (I1-PR5; I1-D16)

`<superficie>.json` **nesta pasta** = a medição de uma superfície redesenhada, commitada pela PR
dela. O CI (`gates-web.yml`, job `g-faixa`) roda **só o veredito** sobre esses arquivos
(`scripts/gates-web/g-faixa-veredito.mjs`), sem descer em subpastas.

`cn-main/` = a **linha de base do web velho** (o CN da I1-PR5 sobre a `main` `73612be`): reprova
por construção e fica fora do veredito do CI. As PRs de superfície medem contra ela.

`casca-efeito/` (I1-PR9) = o efeito da casca nova sobre as telas de **corpo velho** (`setlists`, `content`): só
registro, fora do veredito do CI — é a herança das PRs 10–13.

**Formato (I1-PR15, decisão 2 do encerramento do I1)**: em texto só o que o veredito lê — os `<superficie>.json` desta
pasta. O rastro nas subpastas (`cn-main/`, `casca-efeito/` com `antes/` e `depois/`, `rodada1/`, `antes-*/`) está em
`.json.gz` (`gzip -n -9`, um por arquivo, mesmo nome + `.gz`); o veredito e os scripts dos anexos leem os dois formatos
por `scripts/gates-web/ler-medicao.mjs` (a mesma medição nos dois formatos é erro). Para ler à mão: `gzip -dc <arq>.gz`.

Como medir: `scripts/gates-web/COMO-RODAR.md`. Sem texto de música: nas superfícies com sessão o
texto de cada nó vai só como hash e comprimento.
