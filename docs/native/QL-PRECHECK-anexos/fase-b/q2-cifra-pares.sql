-- QL pre-check · Fase B · consulta 2 — a Cifra e o par acorde/letra (QL-D3, QL-D14). Só leitura. Colar inteira no SQL
-- Editor. A conta principal está escrita na consulta (N1-h1): nada a substituir à mão; `conta` tem de sair `xVDJ`.
-- Nenhuma coluna imprime texto: só contagens e comprimentos.
--
-- TOKEN = cada pedaço da linha separado por espaço ou tab. Um token é
--   ACORDE    se casa ^[A-G](#|b)? + sufixo de m/maj/min/dim/aug/sus/add/M/°/º/+/-/dígito/()/#/b + baixo opcional /X
--             (ex.: C, Am, F#m7, Am7(9), D/F#, Bb, Gsus4);
--   SEPARADOR se não é acorde e casa ^([|:.-]+|x?[0-9]+x?|\([0-9]+x\))$ (ex.: |, :, -, x2, 2x, (2x)).
-- LINHA DE ACORDES (a heurística da Fase A, sem mudança): linha não vazia em que TODO token é acorde ou separador, com pelo
--   menos um acorde. Entram:  "Am  F  C  G"  ·  "C  |  G  x2"  ·  "Am  F  C  G  (2x)"  (o "(2x)" é separador).
-- PAR: a linha de acordes seguida de uma linha não vazia que não é de acordes.
-- LINHA QUASE ACORDE (o acréscimo da QL-D14): linha que a heurística RECUSA mas que tem ao menos um token acorde.
--   Entram:     "Intro: Am7(9)  E"  ·  "A  E  fim"  ·  "Refrão  C  G"  ·  e também TODA linha de letra com o artigo "A" ou
--               a conjunção "E" soltos: "A noite chega", "E o dia" — o "A" e o "E" são acordes pelo token (div. 1189).
--   Não entram: "Am  F  C  G  (2x)" (é linha de acordes) · "Eu vou cantar" (nenhum token acorde) · linha vazia.
-- QUASE ACORDE, MAIORIA (extra declarado, div. 1189): a linha quase acorde em que acordes + separadores são pelo menos a
--   metade dos tokens — "Intro: Am7(9)  E" e "A  E  fim" entram; "A noite chega" não.
-- Medida em Cifra e, para comparar, em Letra.
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
  select c.id, c.content_type, l.ord, l.linha, char_length(l.linha) as n, k.n_tok, k.n_acorde, k.n_sep
  from corpos c
  cross join lateral regexp_split_to_table(c.corpo, E'\n') with ordinality as l(linha, ord)
  cross join lateral (
    select count(*)                                              as n_tok,
           count(*) filter (where t.tok ~ '^[A-G](#|b)?(m|maj|min|dim|aug|sus|add|M|°|º|\+|-|[0-9]|\(|\)|#|b)*(/[A-G](#|b)?)?$')                 as n_acorde,
           count(*) filter (where t.tok !~ '^[A-G](#|b)?(m|maj|min|dim|aug|sus|add|M|°|º|\+|-|[0-9]|\(|\)|#|b)*(/[A-G](#|b)?)?$' and t.tok ~ '^([|:.\-]+|x?[0-9]+x?|\([0-9]+x\))$') as n_sep
    from regexp_split_to_table(btrim(l.linha), E'[ \t]+') t(tok)
    where btrim(l.linha) <> ''
  ) k
  where c.corpo is not null and c.corpo <> '' and c.content_type in ('Chords', 'Lyrics')
),
classes as (
  select l.*,
         (l.n_acorde > 0 and l.n_acorde + l.n_sep = l.n_tok)                                     as acordes,
         (l.n_acorde > 0 and l.n_acorde + l.n_sep < l.n_tok)                                     as quase,
         (l.n_acorde > 0 and l.n_acorde + l.n_sep < l.n_tok and 2 * (l.n_acorde + l.n_sep) >= l.n_tok) as quase_maioria
  from linhas l
),
pares as (
  select a.id, a.content_type, a.n as n_acordes, b.n as n_letra, greatest(a.n, b.n) as n_par
  from classes a
  join classes b on b.id = a.id and b.ord = a.ord + 1
  where a.acordes and not b.acordes and btrim(b.linha) <> ''
)
select
  min(left(al.user_id, 4))                                                                as conta,
  t.tipo,
  (select count(distinct l.id) from classes l where l.content_type = t.tipo)              as musicas_com_corpo,
  (select count(*) from classes l where l.content_type = t.tipo)                           as linhas,
  (select count(*) from classes l where l.content_type = t.tipo and l.acordes)             as linhas_de_acordes,
  (select count(distinct l.id) from classes l where l.content_type = t.tipo and l.acordes) as musicas_com_linha_de_acordes,
  (select count(*) from pares p where p.content_type = t.tipo)                             as pares,
  (select count(distinct p.id) from pares p where p.content_type = t.tipo)                 as musicas_com_par,
  (select count(*) from pares p where p.content_type = t.tipo and p.n_par > 26)            as pares_acima_26,
  (select count(*) from pares p where p.content_type = t.tipo and p.n_par > 48)            as pares_acima_48,
  (select count(*) from pares p where p.content_type = t.tipo and p.n_par > 55)            as pares_acima_55,
  (select count(*) from pares p where p.content_type = t.tipo and p.n_par > 80)            as pares_acima_80,
  (select count(*) from pares p where p.content_type = t.tipo and p.n_acordes > 26)        as linha_de_acordes_do_par_acima_26,
  (select max(p.n_par) from pares p where p.content_type = t.tipo)                         as maior_par,
  (select count(*) from classes l where l.content_type = t.tipo and l.acordes and l.n > 26) as linhas_de_acordes_acima_26,
  (select count(*) from classes l where l.content_type = t.tipo and not l.acordes and l.n > 26) as outras_linhas_acima_26,
  (select count(*) from classes l where l.content_type = t.tipo and l.quase)               as linhas_quase_acorde,
  (select count(distinct l.id) from classes l where l.content_type = t.tipo and l.quase)   as musicas_com_quase_acorde,
  (select count(*) from classes l where l.content_type = t.tipo and l.quase and l.n > 26)  as quase_acima_26,
  (select count(*) from classes l where l.content_type = t.tipo and l.quase and l.n > 48)  as quase_acima_48,
  (select count(*) from classes l where l.content_type = t.tipo and l.quase and l.n > 55)  as quase_acima_55,
  (select count(*) from classes l where l.content_type = t.tipo and l.quase and l.n > 80)  as quase_acima_80,
  (select round(count(*) filter (where l.quase)::numeric / nullif(count(*) filter (where l.acordes or l.quase), 0), 3)
     from classes l where l.content_type = t.tipo)                                         as fracao_quase,
  (select count(*) from classes l where l.content_type = t.tipo and l.quase_maioria)       as linhas_quase_maioria,
  (select round(count(*) filter (where l.quase_maioria)::numeric / nullif(count(*) filter (where l.acordes or l.quase_maioria), 0), 3)
     from classes l where l.content_type = t.tipo)                                         as fracao_quase_maioria
from (values ('Chords'), ('Lyrics')) as t(tipo)
cross join alvo al
group by t.tipo
order by t.tipo;
