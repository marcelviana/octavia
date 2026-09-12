#!/usr/bin/env python3
"""Fixtures do aceite da tela 1 (N1-PR7).

Cada fixture aqui existe porque **o dado real não serve**, e o motivo está
escrito em cada função. Nada disto entra no bundle do app: são dois papéis,
os dois de HOST —

  1. `cache`: reescreve o cache local do device (`files/octavia-<uid>/*.json`)
     a partir do cache real puxado por `run-as`. É o instrumento dos aceites
     que precisam de dados que a conta de audit não tem.
  2. `servidor`: um mock HTTP de `/api/setlists` e `/api/content` para os
     aceites de FALHA — não há como pedir a prod que devolva 500 na página 2.

Python e não TypeScript de propósito: é script de host, e um `.mts` dentro de
`apps/native/src/` entraria no `tsc --noEmit` do app (que não tem tipos de
Node) só para servir a um protocolo de device.

Uso:
  python3 aceite.py cache <entrada.json> <saida.json> <modo> [args]
  python3 aceite.py servidor <porta> <modo> <setlists.json> <content.json>

Receitas dos estados do design que NÃO se alcançam com o dado real
(V1-PRECHECK §4.3 — nenhuma exige `pm clear` nem senha; o cache JSON e a
persistência do Firebase Auth são armazenamentos distintos). Em todas, o
Metro sobe com `EXPO_PUBLIC_API_BASE_URL=http://localhost:8788` **inline** e
`adb reverse tcp:8788 tcp:8788`:

  S1a  "sincronizando pela primeira vez"  store apagado  + servidor `atraso`
  S1d  "offline sem cache"                store apagado  + modo avião
  S1e  "falha com cache"                  cache real     + servidor `500-pagina-1`
  S1f  "vazia após sync"                  cache real     + servidor normal com
                                          um `{"setlists": []}` como entrada
  S3   placeholder inválido               cache `invalidos-content`
                                          + `invalidos-songs`, em modo avião

"Store apagado" é `run-as rocks.octavia.app rm files/octavia-<uid>/*.json`,
com backup e restauro por `cp -r` — a sessão sobrevive.
"""
from __future__ import annotations

import copy
import datetime
import json
import sys
import time

#: Segundos que o modo `atraso` segura cada resposta (S1a).
ATRASO_S = 45

# --------------------------------------------------------------- fixtures

def com_bis(setlists: list, nome: str) -> list:
    """A12 — "mesmo content em duas posições = duas telas" (T1-R24).

    Por que fixture: **nenhuma setlist da conta de audit tem bis** (60/60, 8/8
    e 1/1 `content_id` distintos, medido na N1-PR4), e o editor do web **não
    lista músicas que já estão na setlist**, embora o backend aceite
    `content_id` repetido em `position` distintas (decisão do Marcel,
    2026-09-10: o defeito do editor vai para a herança do Bloco D).

    Duplica a música da posição 1 no fim da setlist, com `notes` PRÓPRIAS — é
    isso que o T1-R24 quer provar: a identidade é `setlist_songs.id`, não
    `content_id`, e cada posição carrega a sua nota.
    """
    out = copy.deepcopy(setlists)
    for setlist in out:
        if setlist["name"] != nome:
            continue
        songs = sorted(setlist["setlist_songs"], key=lambda s: s["position"])
        if not songs:
            continue
        bis = copy.deepcopy(songs[0])
        bis["id"] = "fixture-a12-bis"
        bis["position"] = songs[-1]["position"] + 1
        bis["notes"] = "BIS: repetir so o refrao, meio tom acima"
        setlist["setlist_songs"].append(bis)
    return out


def com_data_amanha(setlists: list, nome: str, hoje: str) -> list:
    """A10 — "setlist com `performance_date` amanhã → baixa em background".

    Por que fixture: as 3 setlists da conta de audit têm `performance_date:
    null` (medido no pre-check A3), então o plano de 7 dias real é sempre
    vazio. A prova com data REAL é do aceite no Tab S6 com a conta principal
    (H17), que tem uma setlist datada — esta fixture cobre o emulador.
    """
    d = datetime.date.fromisoformat(hoje) + datetime.timedelta(days=1)
    out = copy.deepcopy(setlists)
    for setlist in out:
        if setlist["name"] == nome:
            setlist["performance_date"] = d.isoformat()
    return out


def com_item_invalido(contents: list) -> list:
    """A6 — "item inválido mostra placeholder, nunca vazio" (T1-R7).

    Por que fixture: a conta de audit tem **0 inválidos** do T1-R7 (pre-check
    §0: os 9 inválidos da tabela estão no perfil legado `6b2da77b…`, não na
    audit nem na principal). Sem isto o aceite não teria o que renderizar.

    Três formas de inválido, uma por regra do T1-R7:
      (b) `no-body`      — Lyrics com `content_data: null` e sem arquivo;
      (c) `no-key`       — Chords com objeto que não traz `chords`;
      (d) `unknown-type` — `content_type` fora do enum do produto.
    """
    modelo = contents[0]
    base = {
        "user_id": modelo["user_id"],
        "artist": "Fixture A6",
        "album": None,
        "file_url": None,
        "created_at": modelo["created_at"],
        "updated_at": modelo["updated_at"],
    }
    return contents + [
        {**base, "id": "fixture-a6-nobody", "title": "[FIXTURE] Sem corpo (no-body)",
         "content_type": "Lyrics", "content_data": None},
        {**base, "id": "fixture-a6-nokey", "title": "[FIXTURE] Objeto sem a chave (no-key)",
         "content_type": "Chords", "content_data": {"annotations": []}},
        {**base, "id": "fixture-a6-tipo", "title": "[FIXTURE] Tipo desconhecido",
         "content_type": "Piano", "content_data": {"lyrics": "nao deve renderizar"}},
    ]


def com_content_ausente(setlists: list, nome: str) -> list:
    """A8 — "song com `content_id` ausente do cache aparece na posição certa
    com rótulo, sem buraco" (T1-R11).

    Por que fixture: pelo backend **toda** song aponta para content do mesmo
    usuário (o addSong valida a posse — `docs/api/SETLISTS.md`), então
    69/69 `content_id` da audit existem em `/api/content` (pre-check A3). O
    estado só ocorre por sync PARCIAL, que não se provoca em prod sem
    derrubar a rede no meio de duas requests.
    """
    out = copy.deepcopy(setlists)
    for setlist in out:
        if setlist["name"] != nome:
            continue
        pos = max((s["position"] for s in setlist["setlist_songs"]), default=0)
        setlist["setlist_songs"].append({
            "id": "fixture-a8-song", "setlist_id": setlist["id"],
            "content_id": "fixture-a8-content-que-nao-existe",
            "position": pos + 1, "notes": None, "content": None,
        })
    return out


def com_songs_dos_invalidos(setlists: list, nome: str) -> list:
    """Põe os três inválidos do A6 numa setlist, para o palco alcançá-los."""
    out = copy.deepcopy(setlists)
    for setlist in out:
        if setlist["name"] != nome:
            continue
        pos = max((s["position"] for s in setlist["setlist_songs"]), default=0)
        for i, cid in enumerate(("fixture-a6-nobody", "fixture-a6-nokey", "fixture-a6-tipo"), 1):
            setlist["setlist_songs"].append({
                "id": f"fixture-a6-song-{i}", "setlist_id": setlist["id"],
                "content_id": cid, "position": pos + i, "notes": None, "content": None,
            })
    return out


# --------------------------------------------------------------- servidor

def _paginas(content: list, modo: str) -> list[list]:
    """Divide a biblioteca em duas páginas de 100 (o teto real do handler).

    A conta de audit tem 67 itens depois da régua de 120 colunas, então uma
    página só. Para os aceites A21/A22 a fixture força DUAS páginas baixando o
    corte para 40 — é o mínimo que exercita `hasMore` e o `mergePages`.

    **Correção da divergência 23 (V1-PRECHECK §7.4)**: a versão anterior
    devolvia SEMPRE duas listas, então com `content` vazio a página 1 saía com
    `hasMore: true` e o app — obedecendo ao servidor, corretamente — pedia uma
    página a mais. Foi isso que produziu o `sync ok … pages=2 content=0` do
    S1f. A segunda página só existe quando há o que pôr nela.

    Não confundir com a errata do A4 no PRD (§7.4 do mesmo pre-check): a
    fórmula `1 + ⌈N/100⌉` erra com `N=0` mesmo contra um servidor perfeito,
    porque descobrir que `N=0` custa a request que devolve `N`. São duas
    coisas distintas e as duas são verdade; esta função conserta só a daqui.
    """
    corte = 40
    p1, p2 = content[:corte], content[corte:]
    if modo == "id-repetido" and p1:
        # A22 — "duas páginas com um `id` repetido → item uma vez no cache".
        # Por que fixture: o servidor real só duplicaria um item se houvesse
        # uma criação entre as duas páginas, corrida que não se provoca em
        # prod sem escrever (orçamento: escrita 0).
        p2 = [copy.deepcopy(p1[0])] + p2
    return [p1, p2] if p2 else [p1]


def servidor(porta: int, modo: str, setlists_path: str, content_path: str) -> None:
    from http.server import BaseHTTPRequestHandler, HTTPServer
    from urllib.parse import urlparse, parse_qs

    setlists = json.load(open(setlists_path))
    if isinstance(setlists, dict):
        setlists = setlists["setlists"]
    content = json.load(open(content_path))
    paginas = _paginas(content, modo)

    class H(BaseHTTPRequestHandler):
        def _json(self, code: int, body, extra: dict | None = None) -> None:
            raw = json.dumps(body).encode()
            self.send_response(code)
            self.send_header("content-type", "application/json")
            self.send_header("cache-control", "private, no-store")
            for k, v in (extra or {}).items():
                self.send_header(k, v)
            self.send_header("content-length", str(len(raw)))
            self.end_headers()
            self.wfile.write(raw)

        def do_GET(self) -> None:  # noqa: N802
            u = urlparse(self.path)
            q = parse_qs(u.query)
            page = int(q.get("page", ["1"])[0])
            print(f"REQ {self.path} auth={'sim' if self.headers.get('Authorization') else 'NAO'}"
                  f" sortBy={q.get('sortBy', ['-'])[0]}", flush=True)

            if modo == "atraso":
                # S1a — "sincronizando pela primeira vez, sem cache". O estado
                # vive só ENTRE o `sync start` e o primeiro 200, e contra prod
                # isso dura ~4 s (medido: `sync ok … t=4010`): curto demais
                # para `uiautomator dump` + `screencap`. Segurar a resposta é o
                # único jeito de o estado ficar parado para ser medido.
                time.sleep(ATRASO_S)

            if modo == "429":
                # A3 — 429 com `Retry-After: 30`. Por que fixture: provocar um
                # 429 real exigiria 300 requests em 1 min contra prod.
                self._json(429, {"error": "Rate limit exceeded", "code": "RATE_LIMITED",
                                 "retryAfter": 30},
                           {"Retry-After": "30", "X-RateLimit-Scope": "user"})
                return

            if u.path == "/api/setlists":
                self._json(200, setlists)
                return

            if u.path == "/api/content":
                if modo == "500-pagina-1" and page == 1:
                    # Controle negativo do D-d (N1-PR8): a MESMA falha na
                    # página 1 tem de sair como `page=1`. Sem este modo, o
                    # `page=<p>` passaria por acaso — o valor antigo era 1.
                    self._json(500, {"error": "Internal error", "code": "INTERNAL_ERROR"})
                    return
                if modo == "500-pagina-2" and page == 2:
                    # A21 — "mock de 500 na página 2 → cache byte a byte
                    # inalterado + indicador de falha" (T1-R9).
                    # `INTERNAL_ERROR` é o code REAL do `CONTRATO-DE-ERRO.md`; na
                    # N1-PR7 o mock devolvia `INTERNAL`, que o `KIND_BY_CODE` do
                    # core não conhece — o aceite passou (o cache ficou intacto),
                    # mas pelo caminho do erro GENÉRICO, não pelo de servidor.
                    self._json(500, {"error": "Internal error", "code": "INTERNAL_ERROR"})
                    return
                dados = paginas[page - 1] if page <= len(paginas) else []
                self._json(200, {"data": dados, "total": len(content), "page": page,
                                 "pageSize": 100, "hasMore": page < len(paginas),
                                 "totalPages": len(paginas)})
                return

            self._json(404, {"error": "Not found", "code": "NOT_FOUND"})

        def log_message(self, *_args) -> None:
            return

    print(f"fixture: servidor em :{porta} modo={modo} "
          f"setlists={len(setlists)} content={len(content)} paginas={[len(p) for p in paginas]}",
          flush=True)
    HTTPServer(("127.0.0.1", porta), H).serve_forever()


# ------------------------------------------------------------------- cli

def main() -> None:
    if len(sys.argv) < 2:
        print(__doc__)
        raise SystemExit(2)
    cmd = sys.argv[1]

    if cmd == "servidor":
        servidor(int(sys.argv[2]), sys.argv[3], sys.argv[4], sys.argv[5])
        return

    if cmd == "cache":
        entrada, saida, modo = sys.argv[2], sys.argv[3], sys.argv[4]
        dados = json.load(open(entrada))
        if modo == "bis":
            dados["setlists"] = com_bis(dados["setlists"], sys.argv[5])
        elif modo == "data-amanha":
            dados["setlists"] = com_data_amanha(dados["setlists"], sys.argv[5], sys.argv[6])
        elif modo == "invalidos-songs":
            dados["setlists"] = com_songs_dos_invalidos(dados["setlists"], sys.argv[5])
        elif modo == "content-ausente":
            dados["setlists"] = com_content_ausente(dados["setlists"], sys.argv[5])
        elif modo == "invalidos-content":
            dados = com_item_invalido(dados)
        else:
            raise SystemExit(f"modo desconhecido: {modo}")
        json.dump(dados, open(saida, "w"), ensure_ascii=False)
        print(f"fixture {modo} → {saida}")
        return

    raise SystemExit(f"comando desconhecido: {cmd}")


if __name__ == "__main__":
    main()
