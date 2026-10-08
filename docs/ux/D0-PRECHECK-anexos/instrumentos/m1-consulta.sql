-- D-0 pre-check, M1 — SÓ LEITURA. Para colar no SQL Editor do Supabase (console do Marcel).
-- Nenhum texto sai: nem título, nem artista, nem corpo. Só id truncado, nomes de chave, comprimentos, sim/não, contagens e datas.
-- Antes de rodar: troque <UID_PRINCIPAL> pelo uid da conta principal (a saída só mostra true/false, nunca o uid).

-- (1) por Tab
select left(c.id::text, 8)                                        as id8,
       c.user_id = '<UID_PRINCIPAL>'                              as principal,
       case when jsonb_typeof(c.content_data) = 'object'
            then (select string_agg(k, ',' order by k) from jsonb_object_keys(c.content_data) as k)
            else coalesce(jsonb_typeof(c.content_data), 'null') end as chaves,
       jsonb_typeof(c.content_data -> 'tablature')                as tipo_tablature,
       case when jsonb_typeof(c.content_data -> 'tablature') = 'string'
            then length(c.content_data ->> 'tablature') end       as len_tablature,
       c.content_data ? 'measures'                                as tem_measures,
       c.content_data -> 'measures' = '[{"id":1,"strings":["E|--0--3--0--2--0--|","B|--1--1--1--1--1--|","G|--0--0--0--0--0--|","D|--2--2--2--2--2--|","A|--3-------------|","E|----------------|"]}]'::jsonb
                                                                  as measures_eh_exemplo,
       c.file_url is not null                                     as tem_arquivo,
       c.difficulty is null                                       as dificuldade_nula,
       c.updated_at
from content c
where c.content_type = 'Tab'
order by c.updated_at desc;

-- (2) por tipo, contagens (a div. 1152: o editor só salva com dificuldade preenchida; `annotations` só o editor grava)
select c.content_type,
       count(*)                                                   as total,
       count(*) filter (where c.difficulty is null)               as dificuldade_nula,
       count(*) filter (where c.content_data ? 'annotations')     as salvas_pelo_editor,
       max(c.updated_at) filter (where c.content_data ? 'annotations') as ultima_salva_pelo_editor
from content c
group by c.content_type
order by c.content_type;
