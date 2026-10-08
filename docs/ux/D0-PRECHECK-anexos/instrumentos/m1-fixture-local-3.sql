-- D-0 pre-check, M1, consulta 3 — fixture FABRICADA a mais para o Postgres local (rastro; nunca roda em prod).
-- Soma-se à m1-fixture-local.sql: linhas com `annotations` e dificuldade nula, antes e depois de 2025-07-08, e uma
-- Letra com content_data nulo.
insert into content (user_id, title, content_type, difficulty, content_data, file_url, updated_at) values
 ('uid-x', 'MARCADOR-TITULO-9',  'Lyrics', null, '{"lyrics":"MARCADOR-L9","annotations":[]}', null, '2025-07-05T10:00:00Z'),
 ('uid-x', 'MARCADOR-TITULO-10', 'Lyrics', null, '{"lyrics":"MARCADOR-L10","annotations":[]}', null, '2026-09-21T10:00:00Z'),
 ('uid-x', 'MARCADOR-TITULO-11', 'Lyrics', 'Beginner', '{"lyrics":"MARCADOR-L11","annotations":[]}', null, '2026-09-22T10:00:00Z'),
 ('uid-x', 'MARCADOR-TITULO-12', 'Lyrics', null, null, null, '2025-06-02T10:00:00Z');
