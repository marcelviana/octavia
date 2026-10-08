-- D-0 pre-check, M1 — a fixture FABRICADA do Postgres local descartável que prova a consulta (rastro; nunca roda em prod).
-- A tabela é a do `supabase/schema.dump.sql` (as colunas que a consulta lê). Os textos são marcadores fabricados
-- (MARCADOR-*), para provar que nenhum deles aparece na saída.
create table content (
  id uuid default gen_random_uuid() not null, user_id text not null, title varchar(255) not null, artist varchar(255),
  content_type varchar(50) not null, difficulty varchar(20), content_data jsonb, file_url text,
  updated_at timestamptz default now()
);
insert into content (user_id, title, artist, content_type, difficulty, content_data, file_url, updated_at) values
 ('uid-principal', 'MARCADOR-TITULO-1', 'MARCADOR-ARTISTA-1', 'Tab', null, '{"tablature":"MARCADOR-TAB-lote"}', null, '2026-10-01T10:00:00Z'),
 ('uid-principal', 'MARCADOR-TITULO-2', null, 'Tab', 'Beginner', '{"tablature":"MARCADOR-TAB-2","annotations":[],"measures":[{"id":1,"strings":["E|--0--3--0--2--0--|","B|--1--1--1--1--1--|","G|--0--0--0--0--0--|","D|--2--2--2--2--2--|","A|--3-------------|","E|----------------|"]}]}', null, '2026-10-02T10:00:00Z'),
 ('uid-audit', 'MARCADOR-TITULO-3', null, 'Tab', 'Beginner', '{"tablature":"MARCADOR-TAB-3","annotations":[],"measures":[{"id":1,"strings":["E|--0--3--0--2--0--7|","B|--1--1--1--1--1--|","G|--0--0--0--0--0--|","D|--2--2--2--2--2--|","A|--3-------------|","E|----------------|"]}]}', null, '2026-10-03T10:00:00Z'),
 ('uid-audit', 'MARCADOR-TITULO-4', null, 'Tab', null, '{"tablature":""}', null, '2026-10-04T10:00:00Z'),
 ('uid-audit', 'MARCADOR-TITULO-5', null, 'Tab', null, null, 'https://exemplo.invalid/MARCADOR-ARQUIVO', '2026-10-05T10:00:00Z'),
 ('uid-audit', 'MARCADOR-TITULO-6', null, 'Tab', null, '{"tablature":["MARCADOR-LINHA-1","MARCADOR-LINHA-2"]}', null, '2026-10-06T10:00:00Z'),
 ('uid-principal', 'MARCADOR-TITULO-7', null, 'Lyrics', null, '{"lyrics":"MARCADOR-LETRA"}', null, '2026-10-06T11:00:00Z'),
 ('uid-principal', 'MARCADOR-TITULO-8', null, 'Chords', 'Advanced', '{"chords":"MARCADOR-CIFRA","annotations":[],"sections":[]}', null, '2026-10-06T12:00:00Z');
