#!/usr/bin/env python3
"""SY-PR3 — as fixtures da FOTO NA TELA (o 4.2; A-SY-6, A-SY-7, A-SY-8, A-SY-17). Instrumento de anexo (fora de CI,
N4-D117). Todo texto é do projeto (a fixture da QL-PR4 pelo `SY-PR1-anexos/instrumentos/fixture-sy.py`; regra 10).

  x  a A do custo, como está (a setlist "Ensaio da quebra", 8 músicas; a 3 é a "Letra longa da fixture")
  y  o que o sync traz com o palco aberto: a 3 com OUTRO corpo (`a` → `e`), outro título e outras notas; a setlist com
     outro nome, a nota da posição 3 trocada, as posições 1 e 2 trocadas e uma 9ª (um bis da 1) — tudo com `updated_at`
     novo
  z  para V aberta: o y com a 3 de corpo de novo trocado (`e` → `o`) e outro título
  w  a setlist APAGADA (o y sem ela)
  m  a música da posição 3 APAGADA (o y sem ela no conteúdo e na setlist, como o servidor apaga em cascata)
  v  (SY-PR3, a leitura do prefetch) o x com a 6 (a "Partitura da fixture QL", 12 páginas) apontando OUTRO arquivo — a
     `partitura-1p.pdf` do servidor de arquivos —, com `updated_at` novo: a partitura nova no site com o palco aberto

Uso:  python3 fixture-foto.py <dir-fixture-sy> <dir-saida>   → <saida>/{x,y,z,w,m,v}/{setlists,content}.json
"""
import copy, json, os, sys

fx, saida = sys.argv[1], sys.argv[2]
S = json.load(open(os.path.join(fx, "a", "setlists.json")))
C = json.load(open(os.path.join(fx, "a", "content.json")))
NOVO = "2026-10-12T00:00:00.000+00:00"
alvo = next(c for c in C if c["title"] == "Letra longa da fixture")


def gravar(nome, s, c):
    os.makedirs(os.path.join(saida, nome), exist_ok=True)
    json.dump(s, open(os.path.join(saida, nome, "setlists.json"), "w"), ensure_ascii=False)
    json.dump(c, open(os.path.join(saida, nome, "content.json"), "w"), ensure_ascii=False)


gravar("x", S, C)
y_s, y_c = copy.deepcopy(S), copy.deepcopy(C)
c3 = next(c for c in y_c if c["id"] == alvo["id"])
c3["content_data"] = {"lyrics": alvo["content_data"]["lyrics"].replace("a", "e")}
c3["title"] = "Letra longa da fixture, mudada no site"
c3["notes"] = "notas da letra longa, mudadas no site"
c3["updated_at"] = NOVO
sl = y_s[0]
sl["name"] = sl["name"] + ", renomeada no site"
sl["updated_at"] = NOVO
songs = sorted(sl["setlist_songs"], key=lambda x: x["position"])
for s in songs:
    if s["content_id"] == alvo["id"]:
        s["notes"] = "nota da posição, mudada no site"
songs[0]["position"], songs[1]["position"] = 2, 1
bis = copy.deepcopy(songs[0])
bis["id"] = bis["id"][:-4] + "9999"
bis["position"] = 9
sl["setlist_songs"] = songs + [bis]
gravar("y", y_s, y_c)
z_c = copy.deepcopy(y_c)
cz = next(c for c in z_c if c["id"] == alvo["id"])
cz["content_data"] = {"lyrics": alvo["content_data"]["lyrics"].replace("a", "o")}
cz["title"] = "Letra longa da fixture, mudada de novo"
cz["updated_at"] = "2026-10-12T01:00:00.000+00:00"
gravar("z", y_s, z_c)
gravar("w", [], y_c)
m_s, m_c = copy.deepcopy(y_s), [c for c in y_c if c["id"] != alvo["id"]]
m_s[0]["setlist_songs"] = [s for s in m_s[0]["setlist_songs"] if s["content_id"] != alvo["id"]]
m_s[0]["updated_at"] = "2026-10-12T02:00:00.000+00:00"
gravar("m", m_s, m_c)
v_c = copy.deepcopy(C)
c6 = next(c for c in v_c if c["title"] == "Partitura da fixture QL")
c6["file_url"] = c6["file_url"].replace("partitura-12p.pdf", "partitura-1p.pdf")
c6["updated_at"] = "2026-10-12T03:00:00.000+00:00"
gravar("v", S, v_c)
print(f"fixtures da foto: x y z w m v em {saida} · a 3 = {alvo['id'][:8]} · a setlist = {sl['id'][:8]} ({len(songs)} → {len(sl['setlist_songs'])} músicas)")
