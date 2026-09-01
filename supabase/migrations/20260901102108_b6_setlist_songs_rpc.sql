-- ---------------------------------------------------------------------------
-- B6 PR-3a — migração: as QUATRO funções de escrita de setlist_songs
-- (docs/ux/B6-DESENHO.md §2; decisões B6-D2, D9, D10, D11; versionamento
-- por B6-D8 — aplicação em prod é passo do Marcel; dump/types regenerados
-- são a prova, nunca a fonte).
--
-- Mecanismo do invariante contíguo 1..N de setlist_songs: os quatro
-- escritores de produção pós-criação (reorder, remove, addSong,
-- delete-de-content) serializam no lock FOR UPDATE da linha-pai
-- (setlists) — e o delete-de-content trava ANTES a linha de content
-- (FOR UPDATE × FOR KEY SHARE da FK do addSong).
--
-- NOTA (regra das quatro): as funções-tabela devolvem colunas homônimas
-- às da tabela (id, position) — TODA referência a coluna nos corpos sai
-- QUALIFICADA (ss./s./c./t./o./d./u./a.), nunca nua, para não colidir
-- com os nomes de saída.
--
-- Errcodes (SQLSTATE custom, traduzidos POR error.code nas rotas —
-- nunca por mensagem): OB601 mismatch/invariante interno · OB602
-- setlist sumiu · OB603 song sumiu · OB604 content sumiu.
-- ---------------------------------------------------------------------------

-- NOTA (as quatro funções): os OUT-params/colunas de retorno id/position
-- colidem com nomes de coluna de setlist_songs — manter TODA referência
-- a coluna qualificada (ss./s./o./t.), nunca nua.
-- O OUT-param chama-se "position" ENTRE ASPAS: position é keyword
-- (col_name_keyword) e itens de RETURNS TABLE são parâmetros OUT (regra
-- de type_function_name) — sem aspas é erro 42601. No corpo, os usos em
-- SET position = e na lista de colunas do INSERT são contexto de COLUNA
-- e não sofrem substituição de variável.
create or replace function public.reorder_setlist_songs(
  p_setlist_id uuid,
  p_song_ids   uuid[]
) returns table (id uuid, "position" integer)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_n    integer := coalesce(array_length(p_song_ids, 1), 0);
  v_rows integer;
begin
  -- lock único do invariante (D10): TODO escritor de setlist_songs
  -- serializa aqui
  perform 1 from setlists s where s.id = p_setlist_id for update;
  if not found then
    raise exception 'SETLIST_NOT_FOUND' using errcode = 'OB602';
  end if;

  -- permutação exata: mesma contagem, todos os IDs da setlist, sem
  -- duplicata (defesa em profundidade — o Zod já barrou duplicata antes)
  if (select count(*) from setlist_songs ss
       where ss.setlist_id = p_setlist_id) <> v_n
     or (select count(distinct u) from unnest(p_song_ids) u) <> v_n
     or exists (
       select 1 from unnest(p_song_ids) u(sid)
       left join setlist_songs ss
         on ss.id = u.sid and ss.setlist_id = p_setlist_id
       where ss.id is null)
  then
    raise exception 'ORDER_MISMATCH' using errcode = 'OB601';
  end if;

  -- fase 1: tira todo mundo da faixa 1..N. A UNIQUE (setlist_id,
  -- position) não é DEFERRABLE (dump:140) e NÃO há CHECK de sinal na
  -- coluna (§0 — medido): negativos são legais e nunca colidem entre si
  -- porque as positions de partida são únicas.
  update setlist_songs ss set position = -ss.position
   where ss.setlist_id = p_setlist_id;
  get diagnostics v_rows = row_count;
  if v_rows <> v_n then
    -- com a D10 este ramo vira inalcançável (nenhum escritor entra sem
    -- o lock); fica como cinto — se disparar, invariante interno quebrou
    raise exception 'ORDER_MISMATCH' using errcode = 'OB601';
  end if;

  -- fase 2: ordem do array = ordem final, 1..N contíguo por construção
  update setlist_songs ss
     set position = o.ord
    from unnest(p_song_ids) with ordinality as o(sid, ord)
   where ss.id = o.sid and ss.setlist_id = p_setlist_id;
  get diagnostics v_rows = row_count;
  if v_rows <> v_n then
    raise exception 'ORDER_MISMATCH' using errcode = 'OB601';
  end if;

  -- cinto final: nenhuma linha pode restar fora de 1..N
  if exists (select 1 from setlist_songs ss
              where ss.setlist_id = p_setlist_id and ss.position < 1) then
    raise exception 'ORDER_MISMATCH' using errcode = 'OB601';
  end if;

  -- a mudança de músicas muda a setlist (regra do PR-5 do B2, agora
  -- DENTRO da transação — o bump não pode mais se perder sozinho)
  update setlists s set updated_at = now() where s.id = p_setlist_id;

  return query
    select ss.id, ss.position from setlist_songs ss
     where ss.setlist_id = p_setlist_id order by ss.position;
end;
$$;

revoke all on function public.reorder_setlist_songs(uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.reorder_setlist_songs(uuid, uuid[]) to service_role;

-- NOTA: colunas de retorno id/position homônimas às da tabela — toda
-- referência qualificada (ss./s./t.), nunca nua.
-- O OUT-param chama-se "position" ENTRE ASPAS: position é keyword
-- (col_name_keyword) e itens de RETURNS TABLE são parâmetros OUT (regra
-- de type_function_name) — sem aspas é erro 42601. No corpo, os usos em
-- SET position = e na lista de colunas do INSERT são contexto de COLUNA
-- e não sofrem substituição de variável.
create or replace function public.remove_setlist_song(
  p_song_id uuid
) returns table (id uuid, "position" integer)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_setlist_id uuid;
  v_del  integer;
  v_rem  integer;
  v_rows integer;
begin
  select ss.setlist_id into v_setlist_id
    from setlist_songs ss where ss.id = p_song_id;
  if not found then
    raise exception 'SONG_NOT_FOUND' using errcode = 'OB603';
  end if;

  -- lock único do invariante (D10)
  perform 1 from setlists s where s.id = v_setlist_id for update;
  if not found then
    -- rev. 2 do aval: setlist deletada entre a leitura acima e o lock
    -- (cascade levou a song junto) — mesmo 404 de song sumida na rota
    raise exception 'SETLIST_NOT_FOUND' using errcode = 'OB602';
  end if;

  delete from setlist_songs ss where ss.id = p_song_id;
  get diagnostics v_del = row_count;
  if v_del = 0 then
    -- double-delete (rev. 3 do aval): um remove concorrente da MESMA
    -- música commitou enquanto esta transação esperava o lock — 404
    -- canônico na rota. Idempotência de replay é pauta do B9, não
    -- deste bloco.
    raise exception 'SONG_NOT_FOUND' using errcode = 'OB603';
  end if;

  -- renumeração pelas MESMAS duas fases, com os MESMOS guards
  update setlist_songs ss set position = -ss.position
   where ss.setlist_id = v_setlist_id;
  get diagnostics v_rem = row_count;

  -- ordem original preservada: positions eram únicas; negadas, o desc
  -- reproduz o asc original — row_number renumera 1..N contíguo mesmo
  -- que houvesse gap herdado
  update setlist_songs ss
     set position = t.rn
    from (select ss2.id, row_number() over (order by ss2.position desc) as rn
            from setlist_songs ss2
           where ss2.setlist_id = v_setlist_id) t
   where ss.id = t.id;
  get diagnostics v_rows = row_count;
  if v_rows <> v_rem then
    raise exception 'ORDER_MISMATCH' using errcode = 'OB601';
  end if;
  if exists (select 1 from setlist_songs ss
              where ss.setlist_id = v_setlist_id and ss.position < 1) then
    raise exception 'ORDER_MISMATCH' using errcode = 'OB601';
  end if;

  update setlists s set updated_at = now() where s.id = v_setlist_id;

  return query
    select ss.id, ss.position from setlist_songs ss
     where ss.setlist_id = v_setlist_id order by ss.position;
end;
$$;

revoke all on function public.remove_setlist_song(uuid) from public, anon, authenticated;
grant execute on function public.remove_setlist_song(uuid) to service_role;

-- NOTA: returns setof setlist_songs evita OUT-params homônimos, mas a
-- regra das irmãs vale — referências a coluna sempre qualificadas.
create or replace function public.add_setlist_song(
  p_setlist_id uuid,
  p_content_id uuid,
  p_notes      text
) returns setof public.setlist_songs
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- lock único do invariante (D10): o addSong era o ÚNICO escritor sem
  -- ele — a janela do §2.3 fecha aqui, por serialização
  perform 1 from setlists s where s.id = p_setlist_id for update;
  if not found then
    raise exception 'SETLIST_NOT_FOUND' using errcode = 'OB602';
  end if;

  -- B6-D3 (fundida): max+1 calculado DENTRO da transação, sob o lock —
  -- append-only, gap impossível por construção
  return query
    insert into setlist_songs (setlist_id, content_id, position, notes)
    values (
      p_setlist_id,
      p_content_id,
      coalesce((select max(ss.position) from setlist_songs ss
                 where ss.setlist_id = p_setlist_id), 0) + 1,
      p_notes
    )
    returning *;

  update setlists s set updated_at = now() where s.id = p_setlist_id;
end;
$$;

revoke all on function public.add_setlist_song(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.add_setlist_song(uuid, uuid, text) to service_role;

-- NOTA: regra das quatro — toda referência a coluna qualificada
-- (ss./s./c./t./d.), nunca nua.
create or replace function public.delete_content_resequence(
  p_content_id uuid
) returns setof public.content
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_locked   uuid[] := '{}';
  v_new      uuid[];
  v_iter     integer := 0;
  v_affected uuid[];
  v_sid      uuid;
  v_fase1    integer;
  v_fase2    integer;
begin
  -- 0. (rev. 5 do aval) trava a linha do CONTENT antes de tudo: a
  -- checagem de FK do addSong toma FOR KEY SHARE nesta linha, que
  -- CONFLITA com FOR UPDATE — nenhuma referência NOVA a este content
  -- pode commitar a partir daqui. 0 linhas = content sumiu entre o
  -- gate da rota e a função → OB604 (404 canônico na rota).
  perform 1 from content c where c.id = p_content_id for update;
  if not found then
    raise exception 'CONTENT_NOT_FOUND' using errcode = 'OB604';
  end if;

  -- 1. locks das setlists afetadas, em ordem determinística de id
  -- (anti-deadlock). Com o lock do passo 0 o conjunto não pode crescer:
  -- a estabilização converge na PRIMEIRA passada por construção — o
  -- loop fica como CINTO, não como mecanismo (limite mantido; estouro
  -- → OB601 → 500, invariante interno).
  loop
    v_iter := v_iter + 1;
    if v_iter > 10 then
      raise exception 'ORDER_MISMATCH' using errcode = 'OB601';
    end if;
    -- order by DENTRO do agg: a igualdade v_new = v_locked não pode
    -- depender da ordem que o planner preservar (veto do checkpoint A)
    select coalesce(array_agg(t.id order by t.id), '{}'::uuid[]) into v_new
      from (select s.id from setlists s
             where s.id in (select ss.setlist_id from setlist_songs ss
                             where ss.content_id = p_content_id)
             order by s.id
             for update) t;
    exit when v_new = v_locked;
    v_locked := v_new;
  end loop;

  -- 2a. delete EXPLÍCITO das linhas de setlist_songs, com RETURNING —
  -- não confiar no cascade para saber quem foi afetado (ponto 2)
  with del as (
    delete from setlist_songs ss
     where ss.content_id = p_content_id
     returning ss.setlist_id
  )
  select coalesce(array_agg(distinct d.setlist_id), '{}'::uuid[])
    into v_affected from del d;

  -- (rev. 5) sem referência nova possível (lock do passo 0),
  -- v_affected ⊆ v_locked SEMPRE — o lock post-hoc da rev. 4 morreu;
  -- violação aqui = invariante interno quebrado
  if exists (select 1 from unnest(v_affected) a(sid)
              where not (a.sid = any(v_locked))) then
    raise exception 'ORDER_MISMATCH' using errcode = 'OB601';
  end if;

  -- 2b. delete do content, devolvendo a linha (shape do §0 byte a byte).
  -- O `if not found` virou CINTO inalcançável (linha travada e
  -- existente desde o passo 0) — mantido por simetria com as irmãs.
  return query
    delete from content c
     where c.id = p_content_id
     returning *;
  if not found then
    raise exception 'CONTENT_NOT_FOUND' using errcode = 'OB604';
  end if;

  -- 3. renumeração de CADA setlist afetada: duas fases + guards + cinto
  foreach v_sid in array v_affected loop
    update setlist_songs ss set position = -ss.position
     where ss.setlist_id = v_sid;
    get diagnostics v_fase1 = row_count;

    update setlist_songs ss
       set position = t.rn
      from (select ss2.id, row_number() over (order by ss2.position desc) as rn
              from setlist_songs ss2
             where ss2.setlist_id = v_sid) t
     where ss.id = t.id;
    get diagnostics v_fase2 = row_count;
    if v_fase2 <> v_fase1 then
      raise exception 'ORDER_MISMATCH' using errcode = 'OB601';
    end if;
    if exists (select 1 from setlist_songs ss
                where ss.setlist_id = v_sid and ss.position < 1) then
      raise exception 'ORDER_MISMATCH' using errcode = 'OB601';
    end if;

    update setlists s set updated_at = now() where s.id = v_sid;
  end loop;
end;
$$;

revoke all on function public.delete_content_resequence(uuid) from public, anon, authenticated;
grant execute on function public.delete_content_resequence(uuid) to service_role;
