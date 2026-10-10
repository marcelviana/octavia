# A ideia do metrônomo visual no palco

Registro de 2026-10-10. Origem: conversa do Marcel com o revisor em 2026-10-09. **Nada aqui foi lido no código.** O que
é técnico é `[hipótese]` do revisor, a medir no pre-check do bloco. Este arquivo é o registro da ideia até o bloco
abrir; o pre-check do bloco o substitui.

## O que o Marcel decidiu

- **A ideia:** no palco, além da rolagem que acompanha o BPM cadastrado, um indicador visual da batida que oriente quem
  olha o app. Um metrônomo, mas visual.
- **O uso:** os dois. Uma **contagem de entrada** antes da música e um **pulso correndo a música inteira**.
- **Quando:** só avança com o QL encerrado. Na fila, **depois do resto do D** (2026-10-09). A posição em relação à
  navegação do palco é pergunta do aval do encerramento do QL.

## Os seis pontos em aberto

Nenhum está decidido. Cada um traz a recomendação do revisor.

1. **Quantos tempos na contagem.** Depende de o compasso por música entrar no recorte do D (pergunta do pre-check do D).
   Com o campo, a contagem segue o compasso e o pulso acentua o tempo 1. Sem o campo, a recomendação é 4 tempos fixos,
   sabendo que 3/4 e 6/8 contam errado.
2. **O que dispara a contagem.** Recomendação: o mesmo gesto que hoje inicia a rolagem, com um toque durante a contagem
   para cancelar. Como esse gesto funciona hoje é pergunta do pre-check.
3. **Pausar a rolagem pausa o pulso?** Recomendação: sim, e retomar não repete a contagem.
4. **Música sem BPM.** Recomendação: sem contagem e sem pulso, com o controle da barra inerte.
5. **Liga e desliga.** Recomendação: um controle só na barra do palco, que liga contagem e pulso juntos, com o estado
   gravado no aparelho (como a QL-D39).
6. **A posição na fila.** Decidida em parte: depois do resto do D. Falta a posição em relação à navegação do palco.

## O que o revisor levantou `[hipótese]`

- **A batida é calculada, não agendada:** `batida = (agora − t0) × BPM / 60000`, do relógio monotônico. A parte inteira
  é a batida e a fração é a fase. Um timer por batida acumula atraso.
- **Função pura no `packages/core`** (tempo, BPM e t0 entram; batida e fase saem), com teste e controle negativo.
- **Desenho fora da thread de JS**, animando só opacidade e transformação, para o pulso não engasgar com sync ou render.
- **Um relógio só** para a rolagem e o pulso. A batida 1 da música é a batida seguinte à última da contagem, no mesmo
  t0, e a rolagem começa nesse instante.
- **O toque para realinhar é obrigatório.** O app não sabe onde a banda está, e o pulso sai de fase ao longo da música.
  Tocar no indicador zera a fase sem mudar o BPM.
- **Dois desenhos.** A contagem é grande, central e com número, para a banda inteira ver. O pulso é discreto e
  periférico, lido sem tirar o olho da letra. Movimento contínuo (pêndulo ou barra que varre) em vez de piscar, área
  pequena, contraste contido, nunca a tela inteira.
- **Controles novos no palco.** O toque para realinhar e o oitavo controle da barra se conferem contra as bordas de
  toque (a lição da QL-D60) e conversam com o bloco da navegação do palco.
- **Com o SY pronto antes**, o pulso se mede já com o sync automático rodando por baixo.

## O que o pre-check do bloco mede

- como a rolagem lê o BPM hoje e em qual thread ela roda;
- se a biblioteca de animação na thread de UI já está no app ou é dependência nova, com rebuild;
- quantas músicas da conta principal têm BPM preenchido;
- se o pulso se mantém liso no Tab S6 com o palco rolando.

## A forma esperada do bloco

Pre-check, brief e desenho curtos, PR de gates, PR do core (fase, contagem, realinhamento), PR do palco e encerramento
com release no Tab. Julgamentos do Marcel no aparelho: se a contagem se lê de longe e se o pulso se acompanha sem tirar
o olho da letra.
