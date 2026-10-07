#!/usr/bin/env python3
"""N4-PR8 — a fixture da VISUALIZAÇÃO (V), num diretório PRÓPRIO: a da base do G-inv não se toca.

  python3 fixture-visualizacao.py <dir-da-fixture-da-biblioteca> <dir-saida>

Lê a fixture da biblioteca da N4-PR7 (`fixture-biblioteca.py`: os ids `b1b1XXXX-…`, os três itens extras) e escreve em
<dir-saida> a mesma biblioteca com o que V mostra — os campos que o site salva de verdade (N4-R14) nas músicas que as
molduras `N4-*-V-*` desenham, com os valores da folha — e os estados de corpo que faltavam:
  - `Manhã de ensaio` (`V-letra`): álbum, tom, andamento, dificuldade, gênero, etiquetas, as notas, as datas; favorita;
  - `Segunda do ensaio` (`V-cifra`, `V-favoritando`): tom, andamento, dificuldade; NÃO favorita (o favoritar a enche);
  - `Sétima do ensaio` (`V-cifra-secoes`): a Cifra com `sections` (Intro · Verse 1 · Content), álbum, tom, andamento;
  - `Terceira do ensaio` (`V-tab`), `Partitura de doze páginas` (`V-partitura`), `Décima do ensaio` (`V-sem-artista`);
  - o título longo (`V-titulo-longo`): o álbum e as etiquetas da folha;
  - `Partitura escaneada de fixture` (`V-formato`): um `.jpg` — o formato que o app ainda não mostra;
  - `Oitava do ensaio` (`V-campos-vazios`): nenhum campo, nenhuma nota — só as datas.
E `compasso`, `capo` e `afinação` GRAVADOS na `Manhã de ensaio` (o site não os salva de verdade: V não pode mostrá-los).
Os arquivos são os da biblioteca mais o `.jpg`. Todo texto é escrito pelo projeto (regra 10).
"""
import json, os, shutil, sys

sys.path.insert(0, os.path.dirname(__file__))
from fixture import UID, ARQ  # noqa: E402

base, saida = sys.argv[1], sys.argv[2]
os.makedirs(os.path.join(saida, "arquivos"), exist_ok=True)
for f in os.listdir(os.path.join(base, "arquivos")):
    shutil.copy2(os.path.join(base, "arquivos", f), os.path.join(saida, "arquivos", f))
# um JPEG mínimo (SOI … EOI) — o app não o abre (N4-D43): só a extensão importa
open(os.path.join(saida, "arquivos", "partitura-escaneada.jpg"), "wb").write(b"\xff\xd8\xff\xe0" + b"\x00" * 860_000 + b"\xff\xd9")

content = json.load(open(os.path.join(base, "content.json")))
por_titulo = {c["title"]: c for c in content}

def datas(c, criado, alterado):
    c["created_at"] = f"{criado}T12:00:00.000+00:00"
    c["updated_at"] = f"{alterado}T12:00:00.000+00:00"

m = por_titulo["Manhã de ensaio"]
m.update(album="Disco de fixture", key="G", bpm=92, difficulty="Intermediate", genre="Toada de fixture",
         tags=["ensaio", "voz e violão"], is_favorite=True,
         notes="Entrar depois da contagem de quatro do metrônomo. Segunda voz só no refrão; no fim, segurar o último acorde até a sala apagar.",
         time_signature="3/4", capo=2, tuning="DADGAD")
datas(m, "2026-03-14", "2026-09-30")
s2 = por_titulo["Segunda do ensaio"]
s2.update(key="C", bpm=78, difficulty="Beginner", is_favorite=False)
datas(s2, "2026-04-02", "2026-04-02")
s7 = por_titulo["Sétima do ensaio"]
s7.update(album="Disco de fixture", key="Am", bpm=104)
s7["content_data"] = {"chords": "C G Am F", "sections": [
    {"id": 1, "name": "Intro", "chords": "C Am F G", "lyrics": ""},
    {"id": 2, "name": "Verse 1", "chords": "C               Am", "lyrics": "Primeira linha da cifra de fixture"},
    {"id": 3, "name": "Content", "chords": "", "lyrics": "\n".join(f"C   G   Am   F   linha {n} da progressão de fixture" for n in range(1, 13))},
]}
datas(s7, "2026-05-09", "2026-08-17")
t3 = por_titulo["Terceira do ensaio"]
t3.update(key="E", difficulty="Advanced", tags=["dedilhado"])
datas(t3, "2026-04-11", "2026-07-30")
p12 = por_titulo["Partitura de doze páginas"]
p12.update(key="F", difficulty="Advanced")
datas(p12, "2026-05-15", "2026-05-15")
d10 = por_titulo["Décima do ensaio"]
d10.update(key="D")
datas(d10, "2026-06-03", "2026-06-03")
longo = next(c for t, c in por_titulo.items() if t.startswith("Uma música de título bem comprido"))
longo.update(album="Disco de nome comprido da fixture do N3", tags=["pior caso", "comprimento", "fixture"])
datas(longo, "2026-09-22", "2026-09-22")
oito = por_titulo["Oitava do ensaio"]
datas(oito, "2026-06-11", "2026-06-11")
content.append({"id": "b1b10017-0000-4000-8000-000000030017", "user_id": UID, "title": "Partitura escaneada de fixture",
                "artist": "Orquestra de fixture", "album": None, "content_type": "Sheet", "content_data": None,
                "file_url": ARQ + "partitura-escaneada.jpg", "created_at": "2026-05-20T12:00:00.000+00:00",
                "updated_at": "2026-05-20T12:00:00.000+00:00"})

shutil.copy2(os.path.join(base, "setlists.json"), os.path.join(saida, "setlists.json"))
json.dump(content, open(os.path.join(saida, "content.json"), "w"), ensure_ascii=False, indent=1)
print(f"fixture da visualização: content={len(content)} id8 distintos={len({c['id'][:8] for c in content})} "
      f"arquivos={sorted(os.listdir(os.path.join(saida, 'arquivos')))}")
