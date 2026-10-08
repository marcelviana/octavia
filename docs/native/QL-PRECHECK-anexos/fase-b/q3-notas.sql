-- QL pre-check · Fase B · consulta 3 — as notas da música (`content.notes`, QL-D4). Só leitura. Colar inteira no SQL
-- Editor. A conta principal está escrita na consulta (N1-h1); `conta` tem de sair `xVDJ`. Só contagens e comprimentos.
with alvo as (
  select c.user_id, c.content_type, c.notes
  from content c
  where c.user_id = 'xVDJRBh1WpPOatbfWahOLttYn1E3'
),
com as (
  select a.*, char_length(a.notes) as n,
         (select max(char_length(l)) from regexp_split_to_table(a.notes, E'\n') l) as maior_linha,
         (select count(*) from regexp_split_to_table(a.notes, E'\n') l) as linhas
  from alvo a
  where a.notes is not null and btrim(a.notes) <> ''
)
select
  (select min(left(user_id, 4)) from alvo)        as conta,
  coalesce(t.content_type, 'todos')                as tipo,
  (select count(*) from alvo x where t.content_type is null or x.content_type = t.content_type) as musicas,
  count(c.notes)                                   as com_notas,
  max(c.n)                                         as maior_comprimento,
  percentile_disc(0.5) within group (order by c.n) as mediana_comprimento,
  max(c.linhas)                                    as mais_linhas,
  max(c.maior_linha)                               as maior_linha,
  count(*) filter (where c.maior_linha > 26)       as com_linha_acima_26,
  count(*) filter (where c.maior_linha > 48)       as com_linha_acima_48,
  count(*) filter (where c.linhas > 1)             as com_mais_de_uma_linha
from (select distinct content_type from alvo union all select null) t
left join com c on (t.content_type is null or c.content_type = t.content_type)
group by t.content_type
order by t.content_type nulls last;
