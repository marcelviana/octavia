-- D-0 pre-check, M1, consulta 3 — SÓ LEITURA. Nenhum texto sai: só tipo, contagens e datas.
-- O cruzamento: por tipo, quantos contents têm `annotations` (só o editor do site grava a chave) E dificuldade nula —
-- se houver, o salvar com dificuldade nula já funcionou em alguma data. As datas vêm partidas em antes/depois de
-- 2025-07-08 (o commit f0947c3, em que a rota passou a recusar `difficulty: ""`). Atenção: o `updated_at` de uma linha
-- também anda com o favoritar (o PUT de {id, is_favorite}), que não manda dificuldade — então "depois" não prova sozinho
-- um salvar do editor depois dessa data.
-- E, à parte: quantos têm `content_data` nulo (o desenho da div. 1149 em todo tipo de texto).
select c.content_type,
       count(*) filter (where c.content_data ? 'annotations')                               as com_annotations,
       count(*) filter (where c.content_data ? 'annotations' and c.difficulty is null)      as annotations_e_dificuldade_nula,
       min(c.updated_at) filter (where c.content_data ? 'annotations' and c.difficulty is null) as mais_antigo,
       max(c.updated_at) filter (where c.content_data ? 'annotations' and c.difficulty is null) as mais_recente,
       count(*) filter (where c.content_data ? 'annotations' and c.difficulty is null
                          and c.updated_at >= '2025-07-08')                                  as destes_desde_2025_07_08,
       count(*) filter (where c.content_data is null)                                        as content_data_nulo,
       count(*) filter (where c.content_data is null and c.file_url is null)                 as content_data_nulo_sem_arquivo
from content c
group by c.content_type
order by c.content_type;
