-- QL encerramento · A4 — a escolha das músicas reais para os julgamentos (A-QL-13, A-QL-14, A-QL-15), sem ler o texto.
-- Só leitura. Colar inteira no SQL Editor do Supabase. Molde: QL-PRECHECK-anexos/fase-b/q1-linhas-por-tipo.sql.
-- A conta principal está escrita na consulta (uid da N1-h1, `N1-ENCERRAMENTO.md:137`): nada a substituir à mão.
-- A coluna `conta` devolve os 4 primeiros caracteres do user_id lido — tem de sair `xVDJ` (lição da div. 1158).
-- Não lê nem imprime texto, título ou artista: só o id8 (8 primeiros caracteres do id), contagens e comprimentos.
-- O corpo da Letra é o do core: content_data.lyrics (`bodyOf`, packages/core/src/content-contract.ts).
with alvo as (
  select c.id, c.user_id, c.content_data as d
  from content c
  where c.user_id = 'xVDJRBh1WpPOatbfWahOLttYn1E3'
    and c.content_type = 'Lyrics'
),
linhas as (
  select a.id, a.user_id, char_length(l.linha) as n
  from alvo a
  cross join lateral regexp_split_to_table(a.d->>'lyrics', E'\n') as l(linha)
  where a.d is not null and jsonb_typeof(a.d) = 'object' and jsonb_typeof(a.d->'lyrics') = 'string'
)
select
  left(min(l.user_id), 4)              as conta,
  left(l.id::text, 8)                  as id8,
  max(l.n)                             as maior_linha,
  count(*) filter (where l.n > 48)     as linhas_acima_48
from linhas l
group by l.id
having max(l.n) > 55
order by max(l.n) desc, count(*) filter (where l.n > 48) desc, left(l.id::text, 8);
