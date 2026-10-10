create table content (id uuid primary key, user_id text, content_type text, content_data jsonb);
-- a conta principal: quatro Letras (77/50; 56; 55; 60 com 2 > 48), uma Cifra longa, uma Letra nula
insert into content values
 ('aaaaaaaa-0000-0000-0000-000000000001','xVDJRBh1WpPOatbfWahOLttYn1E3','Lyrics', jsonb_build_object('lyrics', repeat('x',77)||E'\n'||repeat('y',50)||E'\n'||repeat('z',49)||E'\n\n'||repeat('w',48))),
 ('bbbbbbbb-0000-0000-0000-000000000002','xVDJRBh1WpPOatbfWahOLttYn1E3','Lyrics', jsonb_build_object('lyrics', repeat('x',56)||E'\n'||repeat('y',10))),
 ('cccccccc-0000-0000-0000-000000000003','xVDJRBh1WpPOatbfWahOLttYn1E3','Lyrics', jsonb_build_object('lyrics', repeat('x',55)||E'\n'||repeat('y',54))),
 ('dddddddd-0000-0000-0000-000000000004','xVDJRBh1WpPOatbfWahOLttYn1E3','Lyrics', jsonb_build_object('lyrics', repeat('é',60)||E'\n'||repeat('y',49)||E'\n'||repeat('q',3))),
 ('eeeeeeee-0000-0000-0000-000000000005','xVDJRBh1WpPOatbfWahOLttYn1E3','Chords', jsonb_build_object('chords', repeat('C ',60))),
 ('ffffffff-0000-0000-0000-000000000006','xVDJRBh1WpPOatbfWahOLttYn1E3','Lyrics', null),
-- outra conta: uma Letra de 90 que não pode contar
 ('99999999-0000-0000-0000-000000000007','outraContaQueNaoConta0000000','Lyrics', jsonb_build_object('lyrics', repeat('x',90)));
