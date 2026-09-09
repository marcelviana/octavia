# B7 — Anexo D5: chaves reais de `content_data` (conta principal + demais perfis)

> **Data**: 2026-09-08 · **Quem**: Marcel, SQL de **leitura** no console do
> Supabase · **Escopo**: `public.content` inteira — conta principal + demais
> perfis (5 profiles, todos do Marcel; B5 §2.3). Insumo da decisão **B7-D5**
> (forma b), **D5b** e **D5c** ([`B7-D5-ADENDO.md`](../B7-D5-ADENDO.md)).
> Verbatim; zero escrita.

## Query 1 — chaves por tipo

```sql
select c.content_type, k as chave, count(*) as n
from public.content c, jsonb_object_keys(c.content_data) k
where jsonb_typeof(c.content_data) = 'object'
group by 1, 2 order by 1, 3 desc;
```

| content_type | chave | n |
|---|---|---|
| Chords | chords | 18 |
| Chords | artist, sections, capo, title, annotations, key | 4 cada |
| Chords | tags, time_signature, notes, genre, content_type, file_url, id, content_data, user_id, album, created_at, is_public, updated_at, is_favorite, thumbnail_url, bpm, difficulty, tuning | 3 cada |
| Lyrics | lyrics | 146 |
| Lyrics | annotations | 14 |
| Lyrics | notes, key, updated_at, content_type, bpm, content_data, id, is_public, album, file_url, time_signature, tags, is_favorite, artist, created_at, user_id, difficulty, thumbnail_url, tuning, capo, genre, title | 6 cada |
| Sheet | file | 3 |
| Sheet | annotations | 1 |
| Tab | tablature | 10 |

## Query 2 — linhas por tipo

```sql
select content_type,
       count(*) total,
       count(*) filter (where content_data is null) data_null,
       count(*) filter (where jsonb_typeof(content_data) = 'object'
                        and not (content_data ? case content_type
                          when 'Lyrics' then 'lyrics' when 'Chords' then 'chords'
                          when 'Tab' then 'tablature' else '__none__' end)) sem_chave_do_tipo,
       count(*) filter (where file_url is null) file_url_null,
       count(*) filter (where content_data ? 'content_data') poluido
from public.content group by 1 order by 1;
```

| content_type | total | data_null | sem_chave_do_tipo | file_url_null | poluido |
|---|---|---|---|---|---|
| Chords | 25 | 5 | 2 | 22 | 3 |
| Lyrics | 147 | 0 | 0 | 147 | 6 |
| Sheet | 7 | 4 | 3 | 2 | 0 |
| Tab | 15 | 5 | 0 | 15 | 0 |

## Query 3 — Sheet: `file_url` × `content_data.file`

```sql
select file_url is not null tem_file_url, content_data ? 'file' tem_file_em_data, count(*)
from public.content where content_type = 'Sheet' group by 1, 2;
```

| tem_file_url | tem_file_em_data | count |
|---|---|---|
| true | true | 3 |
| true | null | 2 |
| false | null | 2 |
