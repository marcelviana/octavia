-- QL pre-check · Fase B · consulta 1 — linhas longas por tipo (QL-D11). Só leitura. Colar inteira no SQL Editor.
-- A conta principal está escrita na consulta (uid da N1-h1, `N1-ENCERRAMENTO.md:137`): nada a substituir à mão.
-- A coluna `conta` devolve os 4 primeiros caracteres do user_id lido — tem de sair `xVDJ` (lição da div. 1158).
with alvo as (
  select c.id, c.user_id, c.content_type, c.content_data as d
  from content c
  where c.user_id = 'xVDJRBh1WpPOatbfWahOLttYn1E3'
),
secoes as (
  select a.id,
         string_agg(s.parte, E'\n\n' order by s.ord) as corpo
  from alvo a
  cross join lateral (
    select e.ord,
           nullif(concat_ws(E'\n',
             case when jsonb_typeof(e.v->'name')   = 'string' then nullif(e.v->>'name', '')   end,
             case when jsonb_typeof(e.v->'chords') = 'string' then nullif(e.v->>'chords', '') end,
             case when jsonb_typeof(e.v->'lyrics') = 'string' then nullif(e.v->>'lyrics', '') end), '') as parte
    from jsonb_array_elements(a.d->'sections') with ordinality as e(v, ord)
  ) s
  where a.content_type = 'Chords' and jsonb_typeof(a.d->'sections') = 'array' and jsonb_array_length(a.d->'sections') > 0
  group by a.id
),
corpos as (
  select a.id, a.user_id, a.content_type,
         case
           when a.d is null or jsonb_typeof(a.d) <> 'object' then null
           when a.content_type = 'Lyrics' and jsonb_typeof(a.d->'lyrics') = 'string' then a.d->>'lyrics'
           when a.content_type = 'Tab' and jsonb_typeof(a.d->'tablature') = 'string' then a.d->>'tablature'
           when a.content_type = 'Chords' and jsonb_typeof(a.d->'sections') = 'array' and jsonb_array_length(a.d->'sections') > 0
             then (select s.corpo from secoes s where s.id = a.id)
           when a.content_type = 'Chords' and jsonb_typeof(a.d->'chords') = 'string' then a.d->>'chords'
         end as corpo
  from alvo a
),
linhas as (
  select c.id, c.content_type, char_length(l.linha) as n
  from corpos c
  cross join lateral regexp_split_to_table(c.corpo, E'\n') as l(linha)
  where c.corpo is not null and c.corpo <> ''
)
select
  min(left(a.user_id, 4))                                                       as conta,
  a.content_type                                                                as tipo,
  count(*)                                                                      as musicas,
  count(*) filter (where c.corpo is not null and c.corpo <> '')                 as com_corpo_de_texto,
  (select count(*) from linhas l where l.content_type = a.content_type)         as linhas,
  (select count(distinct l.id) from linhas l where l.content_type = a.content_type and l.n > 26) as musicas_acima_26,
  (select count(distinct l.id) from linhas l where l.content_type = a.content_type and l.n > 48) as musicas_acima_48,
  (select count(distinct l.id) from linhas l where l.content_type = a.content_type and l.n > 55) as musicas_acima_55,
  (select count(distinct l.id) from linhas l where l.content_type = a.content_type and l.n > 80) as musicas_acima_80,
  (select count(*) from linhas l where l.content_type = a.content_type and l.n > 26) as linhas_acima_26,
  (select count(*) from linhas l where l.content_type = a.content_type and l.n > 48) as linhas_acima_48,
  (select count(*) from linhas l where l.content_type = a.content_type and l.n > 55) as linhas_acima_55,
  (select count(*) from linhas l where l.content_type = a.content_type and l.n > 80) as linhas_acima_80,
  (select max(l.n) from linhas l where l.content_type = a.content_type)          as maior_linha,
  (select percentile_disc(0.95) within group (order by l.n) from linhas l where l.content_type = a.content_type) as p95_linha,
  count(*) filter (where position(E'\t' in coalesce(c.corpo, '')) > 0)          as musicas_com_tab_char,
  count(*) filter (where position(E'\r' in coalesce(c.corpo, '')) > 0)          as musicas_com_cr,
  count(*) filter (where coalesce(c.corpo, '') ~ '[\u0300-\u036f]')            as musicas_com_acento_combinante
from alvo a
join corpos c on c.id = a.id
group by a.content_type
order by a.content_type;
