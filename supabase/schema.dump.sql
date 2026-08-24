

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


CREATE TABLE IF NOT EXISTS "public"."annotations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "annotation_data" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."annotations" OWNER TO "postgres";


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


CREATE TABLE IF NOT EXISTS "public"."setlist_songs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "setlist_id" "uuid" NOT NULL,
    "content_id" "uuid" NOT NULL,
    "position" integer NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."setlist_songs" OWNER TO "postgres";


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
    ADD CONSTRAINT "setlist_songs_setlist_id_content_id_key" UNIQUE ("setlist_id", "content_id");



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



CREATE POLICY "Service role access to setlist songs" ON "public"."setlist_songs" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role access to setlists" ON "public"."setlists" USING (("auth"."role"() = 'service_role'::"text"));



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
  WHERE (("setlists"."id" = "setlist_songs"."setlist_id") AND ("setlists"."user_id" = ("auth"."jwt"() ->> 'uid'::"text"))))));



CREATE POLICY "User owns setlists" ON "public"."setlists" USING (("user_id" = ("auth"."jwt"() ->> 'uid'::"text")));



ALTER TABLE "public"."content" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."setlist_songs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."setlists" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TABLE "public"."annotations" TO "anon";
GRANT ALL ON TABLE "public"."annotations" TO "authenticated";
GRANT ALL ON TABLE "public"."annotations" TO "service_role";



GRANT ALL ON TABLE "public"."content" TO "anon";
GRANT ALL ON TABLE "public"."content" TO "authenticated";
GRANT ALL ON TABLE "public"."content" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."setlist_songs" TO "anon";
GRANT ALL ON TABLE "public"."setlist_songs" TO "authenticated";
GRANT ALL ON TABLE "public"."setlist_songs" TO "service_role";



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






