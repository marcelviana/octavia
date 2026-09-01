

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."setlist_songs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "setlist_id" "uuid" NOT NULL,
    "content_id" "uuid" NOT NULL,
    "position" integer NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."setlist_songs" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_setlist_song"("p_setlist_id" "uuid", "p_content_id" "uuid", "p_notes" "text") RETURNS SETOF "public"."setlist_songs"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."add_setlist_song"("p_setlist_id" "uuid", "p_content_id" "uuid", "p_notes" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "title" character varying(255) NOT NULL,
    "artist" character varying(255),
    "album" character varying(255),
    "genre" character varying(100),
    "content_type" character varying(50) NOT NULL,
    "key" character varying(10),
    "bpm" integer,
    "time_signature" character varying(10) DEFAULT '4/4'::character varying,
    "difficulty" character varying(20),
    "capo" integer,
    "tuning" character varying(50),
    "tags" "text"[],
    "notes" "text",
    "content_data" "jsonb",
    "file_url" "text",
    "thumbnail_url" "text",
    "is_favorite" boolean DEFAULT false,
    "is_public" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."content" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_content_resequence"("p_content_id" "uuid") RETURNS SETOF "public"."content"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."delete_content_resequence"("p_content_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_setlist_song"("p_song_id" "uuid") RETURNS TABLE("id" "uuid", "position" integer)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."remove_setlist_song"("p_song_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reorder_setlist_songs"("p_setlist_id" "uuid", "p_song_ids" "uuid"[]) RETURNS TABLE("id" "uuid", "position" integer)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."reorder_setlist_songs"("p_setlist_id" "uuid", "p_song_ids" "uuid"[]) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."annotations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "annotation_data" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."annotations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "text" NOT NULL,
    "email" character varying(255) NOT NULL,
    "full_name" character varying(255),
    "first_name" character varying(255),
    "last_name" character varying(255),
    "avatar_url" "text",
    "primary_instrument" character varying(100),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "bio" "text",
    "website" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."setlists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "performance_date" "date",
    "venue" character varying(255),
    "notes" "text",
    "is_public" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."setlists" OWNER TO "postgres";


ALTER TABLE ONLY "public"."annotations"
    ADD CONSTRAINT "annotations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content"
    ADD CONSTRAINT "content_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."setlist_songs"
    ADD CONSTRAINT "setlist_songs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."setlist_songs"
    ADD CONSTRAINT "setlist_songs_setlist_id_position_key" UNIQUE ("setlist_id", "position");



ALTER TABLE ONLY "public"."setlists"
    ADD CONSTRAINT "setlists_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_annotations_content_id" ON "public"."annotations" USING "btree" ("content_id");



CREATE INDEX "idx_content_content_type" ON "public"."content" USING "btree" ("content_type");



CREATE INDEX "idx_content_user_id" ON "public"."content" USING "btree" ("user_id");



CREATE INDEX "idx_setlist_songs_setlist_id" ON "public"."setlist_songs" USING "btree" ("setlist_id");



CREATE INDEX "idx_setlists_user_id" ON "public"."setlists" USING "btree" ("user_id");



ALTER TABLE ONLY "public"."annotations"
    ADD CONSTRAINT "annotations_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."annotations"
    ADD CONSTRAINT "annotations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content"
    ADD CONSTRAINT "content_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."setlist_songs"
    ADD CONSTRAINT "setlist_songs_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."setlist_songs"
    ADD CONSTRAINT "setlist_songs_setlist_id_fkey" FOREIGN KEY ("setlist_id") REFERENCES "public"."setlists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."setlists"
    ADD CONSTRAINT "setlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Service role access to content" ON "public"."content" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role access to profiles" ON "public"."profiles" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role access to setlist songs" ON "public"."setlist_songs" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role access to setlists" ON "public"."setlists" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "User can insert own content" ON "public"."content" FOR INSERT WITH CHECK (("user_id" = ("auth"."jwt"() ->> 'uid'::"text")));



CREATE POLICY "User can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("id" = ("auth"."jwt"() ->> 'uid'::"text")));



CREATE POLICY "User can insert own setlists" ON "public"."setlists" FOR INSERT WITH CHECK (("user_id" = ("auth"."jwt"() ->> 'uid'::"text")));



CREATE POLICY "User can insert setlist songs" ON "public"."setlist_songs" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."setlists"
  WHERE (("setlists"."id" = "setlist_songs"."setlist_id") AND ("setlists"."user_id" = ("auth"."jwt"() ->> 'uid'::"text"))))));



CREATE POLICY "User can read content referenced in setlists" ON "public"."content" FOR SELECT USING ((("user_id" = ("auth"."jwt"() ->> 'uid'::"text")) OR (EXISTS ( SELECT 1
   FROM ("public"."setlist_songs"
     JOIN "public"."setlists" ON (("setlists"."id" = "setlist_songs"."setlist_id")))
  WHERE (("setlist_songs"."content_id" = "content"."id") AND ("setlists"."user_id" = ("auth"."jwt"() ->> 'uid'::"text")))))));



CREATE POLICY "User owns content" ON "public"."content" USING (("user_id" = ("auth"."jwt"() ->> 'uid'::"text")));



CREATE POLICY "User owns profile" ON "public"."profiles" USING (("id" = ("auth"."jwt"() ->> 'uid'::"text")));



CREATE POLICY "User owns setlist songs" ON "public"."setlist_songs" USING ((EXISTS ( SELECT 1
   FROM "public"."setlists"
  WHERE (("setlists"."id" = "setlist_songs"."setlist_id") AND ("setlists"."user_id" = ("auth"."jwt"() ->> 'uid'::"text")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."setlists"
  WHERE (("setlists"."id" = "setlist_songs"."setlist_id") AND ("setlists"."user_id" = ("auth"."jwt"() ->> 'uid'::"text"))))));



CREATE POLICY "User owns setlists" ON "public"."setlists" USING (("user_id" = ("auth"."jwt"() ->> 'uid'::"text"))) WITH CHECK (("user_id" = ("auth"."jwt"() ->> 'uid'::"text")));



ALTER TABLE "public"."annotations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."setlist_songs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."setlists" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TABLE "public"."setlist_songs" TO "anon";
GRANT ALL ON TABLE "public"."setlist_songs" TO "authenticated";
GRANT ALL ON TABLE "public"."setlist_songs" TO "service_role";



REVOKE ALL ON FUNCTION "public"."add_setlist_song"("p_setlist_id" "uuid", "p_content_id" "uuid", "p_notes" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."add_setlist_song"("p_setlist_id" "uuid", "p_content_id" "uuid", "p_notes" "text") TO "service_role";



GRANT ALL ON TABLE "public"."content" TO "anon";
GRANT ALL ON TABLE "public"."content" TO "authenticated";
GRANT ALL ON TABLE "public"."content" TO "service_role";



REVOKE ALL ON FUNCTION "public"."delete_content_resequence"("p_content_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."delete_content_resequence"("p_content_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."remove_setlist_song"("p_song_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."remove_setlist_song"("p_song_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."reorder_setlist_songs"("p_setlist_id" "uuid", "p_song_ids" "uuid"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reorder_setlist_songs"("p_setlist_id" "uuid", "p_song_ids" "uuid"[]) TO "service_role";



GRANT ALL ON TABLE "public"."annotations" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."setlists" TO "anon";
GRANT ALL ON TABLE "public"."setlists" TO "authenticated";
GRANT ALL ON TABLE "public"."setlists" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






