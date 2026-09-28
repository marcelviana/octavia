# G-faixa — medições commitadas (I1-PR5; I1-D16)

`<superficie>.json` **nesta pasta** = a medição de uma superfície redesenhada, commitada pela PR
dela. O CI (`gates-web.yml`, job `g-faixa`) roda **só o veredito** sobre esses arquivos
(`scripts/gates-web/g-faixa-veredito.mjs`), sem descer em subpastas.

`cn-main/` = a **linha de base do web velho** (o CN da I1-PR5 sobre a `main` `73612be`): reprova
por construção e fica fora do veredito do CI. As PRs de superfície medem contra ela.

`casca-efeito/` (I1-PR9) = o efeito da casca nova sobre as telas de **corpo velho** (`setlists`, `content`): só
registro, fora do veredito do CI — é a herança das PRs 10–13.

Como medir: `scripts/gates-web/COMO-RODAR.md`. Sem texto de música: nas superfícies com sessão o
texto de cada nó vai só como hash e comprimento.
