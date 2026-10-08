-- QL pre-check · Fase B · consulta 2 — a Cifra e o par acorde/letra (QL-D3). Só leitura. Colar inteira no SQL Editor.
-- A conta principal está escrita na consulta (N1-h1): nada a substituir à mão; `conta` tem de sair `xVDJ`.
-- "Linha de acordes" é HEURÍSTICA declarada (nenhum dado a marca — `QL-PRECHECK.md` A3): linha não vazia em que todo
-- token separado por espaço é um acorde (`^[A-G](#|b)?` + sufixo de m/maj/min/dim/aug/sus/add/M/°/º/+/-/dígito/()/#/b,
-- baixo opcional `/X`) ou um separador (`|`, `:`, `-`, `.`, `x2`, `(2x)`…), com pelo menos um acorde. O PAR é a linha de
-- acordes seguida de uma linha não vazia que não é de acordes. Medida em Cifra e, para comparar, em Letra.
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
  select c.id, c.content_type, l.ord, l.linha, char_length(l.linha) as n,
         (btrim(l.linha) <> ''
          and not exists (
            select 1 from regexp_split_to_table(btrim(l.linha), E'[ \t]+') t(tok)
            where t.tok !~ '^[A-G](#|b)?(m|maj|min|dim|aug|sus|add|M|°|º|\+|-|[0-9]|\(|\)|#|b)*(/[A-G](#|b)?)?$'
              and t.tok !~ '^([|:.\-]+|x?[0-9]+x?|\([0-9]+x\))$')
          and exists (
            select 1 from regexp_split_to_table(btrim(l.linha), E'[ \t]+') t(tok)
            where t.tok ~ '^[A-G](#|b)?(m|maj|min|dim|aug|sus|add|M|°|º|\+|-|[0-9]|\(|\)|#|b)*(/[A-G](#|b)?)?$')
         ) as acordes
  from corpos c
  cross join lateral regexp_split_to_table(c.corpo, E'\n') with ordinality as l(linha, ord)
  where c.corpo is not null and c.corpo <> '' and c.content_type in ('Chords', 'Lyrics')
),
pares as (
  select a.id, a.content_type, a.n as n_acordes, b.n as n_letra, greatest(a.n, b.n) as n_par
  from linhas a
  join linhas b on b.id = a.id and b.ord = a.ord + 1
  where a.acordes and not b.acordes and btrim(b.linha) <> ''
)
select
  min(left(al.user_id, 4))                                                                as conta,
  t.tipo,
  (select count(distinct l.id) from linhas l where l.content_type = t.tipo)               as musicas_com_corpo,
  (select count(*) from linhas l where l.content_type = t.tipo)                            as linhas,
  (select count(*) from linhas l where l.content_type = t.tipo and l.acordes)              as linhas_de_acordes,
  (select count(distinct l.id) from linhas l where l.content_type = t.tipo and l.acordes)  as musicas_com_linha_de_acordes,
  (select count(*) from pares p where p.content_type = t.tipo)                             as pares,
  (select count(distinct p.id) from pares p where p.content_type = t.tipo)                 as musicas_com_par,
  (select count(*) from pares p where p.content_type = t.tipo and p.n_par > 26)            as pares_acima_26,
  (select count(*) from pares p where p.content_type = t.tipo and p.n_par > 48)            as pares_acima_48,
  (select count(*) from pares p where p.content_type = t.tipo and p.n_par > 55)            as pares_acima_55,
  (select count(*) from pares p where p.content_type = t.tipo and p.n_par > 80)            as pares_acima_80,
  (select count(*) from pares p where p.content_type = t.tipo and p.n_acordes > 26)        as linha_de_acordes_do_par_acima_26,
  (select max(p.n_par) from pares p where p.content_type = t.tipo)                         as maior_par,
  (select count(*) from linhas l where l.content_type = t.tipo and l.acordes and l.n > 26) as linhas_de_acordes_acima_26,
  (select count(*) from linhas l where l.content_type = t.tipo and not l.acordes and l.n > 26) as outras_linhas_acima_26
from (values ('Chords'), ('Lyrics')) as t(tipo)
cross join alvo al
group by t.tipo
order by t.tipo;
