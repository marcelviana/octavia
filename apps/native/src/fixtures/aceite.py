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
     **N2-PR2**: ganha as SEIS rotas de escrita do `docs/api/SETLISTS.md`, com
     um modelo em memória (criar, editar, apagar, adicionar, remover,
     reordenar) e os modos de falha que prod não produz sob encomenda. O
     modelo existe porque a releitura do T2-R9 (`GET /api/setlists` depois de
     todo 2xx) só prova alguma coisa se o `GET` seguinte mostrar o que a
     escrita fez — um mock que responde 201 e não muda nada faria o
     `cmp` do cache passar por acaso.

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


# ------------------------------------------------------- escrita (N2-PR2)
#
# As SEIS rotas do `docs/api/SETLISTS.md`, sobre um MODELO EM MEMÓRIA. O
# modelo não é luxo: a releitura do T2-R9 só prova alguma coisa se o `GET`
# seguinte mostrar o que a escrita fez. Um mock que responde 201 e não muda
# nada faria o `cmp` do cache passar por acaso, e faria passar também o
# caso que a N2-D18 existe para cobrir ("gravou e a resposta não chegou").
#
# Os modos de falha, todos de escrita (o `GET` continua normal, salvo onde
# dito) — são os que prod não produz sob encomenda sem custar linha na
# janela `setlist-mutate`:
#
#   escrita              tudo funciona (o modo dos testes de sucesso)
#   escrita-404          toda escrita → 404 NOT_FOUND
#   escrita-400          toda escrita → 400 VALIDATION_ERROR com `details`
#   escrita-500          toda escrita → 500 INTERNAL_ERROR
#   escrita-401          toda escrita → 401 AUTH_REQUIRED; o GET segue 200
#                        (é o CN da N2-D9: o logout não pode ser chamado)
#   401                  TUDO → 401, inclusive o GET (o controle POSITIVO da
#                        mesma decisão: no caminho de LEITURA o logout é
#                        chamado)
#   escrita-429          toda escrita → 429 com `Retry-After` e `retryAfter`
#   escrita-429-sem-prazo  429 SEM o header e SEM o campo — o ramo
#                        `retryAfter: null` que a div. 225 deixou aberto
#   escrita-corta        GRAVA no modelo, responde 201/200 com
#                        `content-length` e FECHA a conexão antes do corpo.
#                        É a N2-D18 literal: o servidor gravou e o cliente
#                        não soube. O `GET` seguinte mostra o item gravado.
#   escrita-resync-500   a escrita grava e responde 2xx; o `GET
#                        /api/setlists` SEGUINTE devolve 500 (o primeiro
#                        depois da primeira escrita). É a N2-D22:
#                        "salvo; não foi possível recarregar".
#   escrita-corta-lento  (N2-PR3) o `escrita-corta` com o `GET` seguinte
#                        SEGURADO por 600 ms. Existe por causa de UM estado
#                        do congelado: `N2-F-falhou` com a releitura ainda em
#                        voo — `Tentar de novo` inativo com o motivo
#                        `relendo a lista…`. Sem o atraso essa janela fecha
#                        dentro do mesmo `act()` do teste e o estado nunca é
#                        observável; um teste que dependesse da corrida não
#                        seria teste. Os 600 ms são os mesmos do
#                        `escrita-releitura-fora-de-ordem`.
#
# Por que `escrita-corta` fecha a conexão em vez de demorar: o que se quer
# medir é a espécie `rede` com gravação FEITA, e um timeout mediria a mesma
# espécie sem a gravação — o oposto do caso.

def _envelope(code: str, error: str, extra: dict | None = None) -> dict:
    corpo = {"error": error, "code": code}
    corpo.update(extra or {})
    return corpo


def _agora() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="milliseconds")


class Modelo:
    """O estado das setlists em memória, com a semântica dos handlers.

    Só o que as seis rotas mexem. O `updated_at` é o relógio do processo, como
    nos handlers (`route.ts:133-134` no POST, `[id]/route.ts:174-176` no PUT,
    e dentro das RPCs nas outras quatro) — é ele que faz o `invalidated` do
    T1-R10 valer 1 depois de uma escrita.
    """

    def __init__(self, setlists: list) -> None:
        self.setlists = setlists
        self.seq = 0

    def _id(self, prefixo: str) -> str:
        self.seq += 1
        # Forma de uuid v4 o bastante para o `<id8>` do log e para os
        # schemas de uuid do servidor real; o mock não valida.
        return f"{prefixo}{self.seq:04d}-0000-4000-8000-{self.seq:012d}"

    def achar(self, setlist_id: str) -> dict | None:
        for s in self.setlists:
            if s["id"] == setlist_id:
                return s
        return None

    def achar_song(self, song_id: str) -> tuple[dict, dict] | None:
        for s in self.setlists:
            for song in s["setlist_songs"]:
                if song["id"] == song_id:
                    return s, song
        return None

    def renumerar(self, setlist: dict) -> None:
        """O invariante contíguo 1..N do `SETLISTS.md` — o que as RPCs fazem."""
        for i, song in enumerate(sorted(setlist["setlist_songs"], key=lambda x: x["position"]), 1):
            song["position"] = i
        setlist["setlist_songs"].sort(key=lambda x: x["position"])

    def criar(self, corpo: dict) -> dict:
        nova = {
            "id": self._id("aa"),
            "name": corpo.get("name"),
            "performance_date": corpo.get("performance_date"),
            "venue": corpo.get("venue"),
            "description": corpo.get("description"),
            "notes": corpo.get("notes"),
            "created_at": _agora(),
            "updated_at": _agora(),
            "setlist_songs": [],
        }
        # `created_at desc`: a nova aparece no TOPO do GET (route.ts:38).
        self.setlists.insert(0, nova)
        return nova

    def editar(self, setlist: dict, corpo: dict) -> dict:
        # Semântica por campo: ausente = não mexe; null = limpa
        # (`[id]/route.ts:171-192`). `{}` é válido e só bumpa o updated_at.
        for campo in ("name", "performance_date", "venue", "description", "notes"):
            if campo in corpo:
                setlist[campo] = corpo[campo]
        setlist["updated_at"] = _agora()
        return setlist

    def apagar(self, setlist: dict) -> None:
        self.setlists.remove(setlist)

    def adicionar(self, setlist: dict, content_id: str) -> dict:
        # Append-only: a `position` é SEMPRE max+1 (B6-D3), e a `position`
        # que o cliente mandasse seria ignorada (C7).
        pos = max((s["position"] for s in setlist["setlist_songs"]), default=0) + 1
        linha = {
            "id": self._id("bb"),
            "setlist_id": setlist["id"],
            "content_id": content_id,
            "position": pos,
            "notes": None,
            "created_at": _agora(),
        }
        setlist["setlist_songs"].append(dict(linha, content=None))
        setlist["updated_at"] = _agora()
        return linha

    def remover(self, setlist: dict, song: dict) -> None:
        setlist["setlist_songs"].remove(song)
        self.renumerar(setlist)
        setlist["updated_at"] = _agora()

    def reordenar(self, setlist: dict, ordem: list) -> list | None:
        """Permutação EXATA, checada como a RPC checa (C8). `None` = 400."""
        atuais = [s["id"] for s in setlist["setlist_songs"]]
        if sorted(ordem) != sorted(atuais) or len(set(ordem)) != len(ordem):
            return None
        porid = {s["id"]: s for s in setlist["setlist_songs"]}
        setlist["setlist_songs"] = [porid[i] for i in ordem]
        for i, song in enumerate(setlist["setlist_songs"], 1):
            song["position"] = i
        setlist["updated_at"] = _agora()
        return [{"id": s["id"], "position": s["position"]} for s in setlist["setlist_songs"]]


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
    # `ThreadingHTTPServer` e não `HTTPServer` (N2-PR2, 2ª rodada): o
    # `HTTPServer` atende UMA conexão por vez, então um `sleep` num handler
    # congela todos os outros — e o que se quer medir é justamente DUAS
    # releituras SOBREPOSTAS. Com o servidor serial, a sobreposição não
    # existiria e o teste mediria a fila do mock em vez da trava do app.
    from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
    from urllib.parse import urlparse, parse_qs

    setlists = json.load(open(setlists_path))
    if isinstance(setlists, dict):
        setlists = setlists["setlists"]
    content = json.load(open(content_path))
    paginas = _paginas(content, modo)
    # N2-PR2: o estado que as seis escritas mexem. `setlists` passa a ser a
    # lista VIVA — o `GET /api/setlists` serve o que o modelo tem agora, que é
    # o que faz a releitura do T2-R9 medir alguma coisa.
    modelo = Modelo(setlists)
    estado = {"escritas": 0, "gets_pos_escrita": 0}

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

        def _corta(self, code: int) -> None:
            """N2-D18 literal: o servidor GRAVOU e o cliente não soube.

            Anuncia um corpo e não o manda — a conexão morre no meio. No
            cliente isso é falha de TRANSPORTE (o `fetch` do Node devolve
            `TypeError: terminated` ao ler o corpo), exatamente como a rede
            que cai depois do commit no banco. Um timeout mediria a mesma
            espécie SEM a gravação, que é o oposto do caso.
            """
            self.send_response(code)
            self.send_header("content-type", "application/json")
            self.send_header("content-length", "500")
            self.end_headers()
            self.close_connection = True

        def _corpo(self) -> dict:
            n = int(self.headers.get("content-length") or 0)
            if n == 0:
                return {}
            try:
                return json.loads(self.rfile.read(n).decode())
            except Exception:
                return {}

        def _falha_de_escrita(self) -> bool:
            """Os modos de falha, ANTES de qualquer mudança no modelo.

            A ordem importa: 401, 429 e 400 saem antes de o servidor real
            chegar ao banco (pre-check §7.1), e é por isso que o 401 de uma
            escrita nunca duplica nada (N2-D9).
            """
            if modo in ("401", "escrita-401"):
                self._json(401, _envelope("AUTH_REQUIRED", "Authentication required"),
                           {"WWW-Authenticate": "Bearer"})
                return True
            if modo == "escrita-429":
                self._json(429, _envelope("RATE_LIMITED", "Rate limit exceeded", {"retryAfter": 30}),
                           {"Retry-After": "30", "X-RateLimit-Scope": "user"})
                return True
            if modo == "escrita-429-sem-prazo":
                # O ramo que a div. 225 deixou aberto: 429 sem prazo nenhum.
                self._json(429, _envelope("RATE_LIMITED", "Rate limit exceeded"))
                return True
            if modo == "escrita-400":
                self._json(400, _envelope("VALIDATION_ERROR", "Validation failed", {
                    "details": [{"field": "name", "message": "Potentially unsafe content detected",
                                 "code": "custom"}]}))
                return True
            if modo == "escrita-404":
                self._json(404, _envelope("NOT_FOUND", "Setlist not found"))
                return True
            if modo == "escrita-500":
                self._json(500, _envelope("INTERNAL_ERROR", "Internal server error"))
                return True
            return False

        def _escreveu(self, code: int, corpo) -> None:
            estado["escritas"] += 1
            if modo in ("escrita-corta", "escrita-corta-lento"):
                self._corta(code)
                return
            self._json(code, corpo)

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

            if modo == "401":
                # O controle POSITIVO da N2-D9: no caminho de LEITURA o 401
                # chega ao `onAuthFailure` e o app DESLOGA. Sem este ramo o CN
                # do 401 de escrita não provaria nada — "o logout não foi
                # chamado" também é verdade num app que nunca desloga.
                self._json(401, _envelope("AUTH_REQUIRED", "Authentication required"),
                           {"WWW-Authenticate": "Bearer"})
                return

            if u.path == "/api/setlists":
                if modo == "escrita-releitura-fora-de-ordem" and estado["escritas"] > 0:
                    # **Inverte a ordem de chegada de duas releituras.** O
                    # PRIMEIRO `GET` depois de uma escrita chega 600 ms
                    # atrasado; os seguintes respondem na hora. Assim a
                    # releitura EMITIDA primeiro chega POR ÚLTIMO — que é o
                    # único jeito de medir se o cache acaba com o ÚLTIMO 200
                    # ou com o último a chegar.
                    #
                    # **A FOTO É TIRADA ANTES DO ATRASO**, e essa ordem é o
                    # instrumento inteiro. A primeira forma disto dormia e
                    # SÓ ENTÃO lia o modelo: a resposta lenta voltava com
                    # dado FRESCO, a inversão não existia, e o teste passava
                    # sem medir nada. Num servidor real a leitura acontece na
                    # hora do request e o atraso é de TRANSPORTE — a resposta
                    # que demora 600 ms carrega a foto de 600 ms atrás.
                    #
                    # Isto não encena um defeito: duas releituras sobrepostas
                    # são o que o congelado pede (`N2-P-relendo`: "as outras
                    # linhas seguem ativas"), e numa rede real a ordem de
                    # chegada não é a de emissão.
                    estado["gets_pos_escrita"] += 1
                    if estado["gets_pos_escrita"] == 1:
                        foto = copy.deepcopy(modelo.setlists)
                        time.sleep(0.6)
                        self._json(200, foto)
                        return
                if modo == "escrita-corta-lento" and estado["escritas"] > 0:
                    # A releitura que a folha dispara depois de falhar (regra
                    # 3) demora — é a janela do `relendo a lista…`.
                    time.sleep(0.6)
                    self._json(200, modelo.setlists)
                    return
                if modo == "escrita-resync-500" and estado["escritas"] > 0:
                    # N2-D22: a escrita gravou e a RELEITURA é que falhou.
                    # Só depois da primeira escrita — o sync da abertura
                    # precisa funcionar para haver cache anterior.
                    self._json(500, _envelope("INTERNAL_ERROR", "Internal server error"))
                    return
                self._json(200, modelo.setlists)
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

        # --- as seis escritas (N2-PR2) -----------------------------------
        # Os caminhos são os do `docs/api/SETLISTS.md`; os corpos de 2xx são
        # os de lá, coluna por coluna, porque o cliente NÃO os aplica ao cache
        # (N2-D13) mas o teste precisa ver que não aplicou.

        def _log_escrita(self, verbo: str) -> None:
            print(f"REQ {verbo} {self.path} auth={'sim' if self.headers.get('Authorization') else 'NAO'}",
                  flush=True)

        def do_POST(self) -> None:  # noqa: N802
            u = urlparse(self.path)
            self._log_escrita("POST")
            corpo = self._corpo()
            if self._falha_de_escrita():
                return

            if u.path == "/api/setlists":
                # 201: a linha inteira + `setlist_songs: []` (C1).
                self._escreveu(201, modelo.criar(corpo))
                return

            partes = u.path.strip("/").split("/")
            if len(partes) == 4 and partes[:2] == ["api", "setlists"] and partes[3] == "songs":
                setlist = modelo.achar(partes[2])
                if setlist is None:
                    self._json(404, _envelope("NOT_FOUND", "Setlist not found"))
                    return
                if not any(c["id"] == corpo.get("content_id") for c in content):
                    self._json(404, _envelope("NOT_FOUND", "Content not found"))
                    return
                # 201: a linha de `setlist_songs`, 6 colunas, com a position
                # REAL (C7) — e SEM o `updated_at` novo da setlist (§4.1).
                self._escreveu(201, modelo.adicionar(setlist, corpo["content_id"]))
                return

            self._json(404, _envelope("NOT_FOUND", "Not found"))

        def do_PUT(self) -> None:  # noqa: N802
            u = urlparse(self.path)
            self._log_escrita("PUT")
            corpo = self._corpo()
            if self._falha_de_escrita():
                return

            partes = u.path.strip("/").split("/")
            if len(partes) == 5 and partes[3:] == ["songs", "order"]:
                setlist = modelo.achar(partes[2])
                if setlist is None:
                    self._json(404, _envelope("NOT_FOUND", "Setlist not found"))
                    return
                ordem = modelo.reordenar(setlist, corpo.get("order") or [])
                if ordem is None:
                    # C8: falta, sobra, duplicata ou corrida → 400
                    # `field:"order"`, corpo único (não existe 409, div. 177).
                    self._json(400, _envelope("VALIDATION_ERROR", "Validation failed", {
                        "details": [{"field": "order",
                                     "message": "order must contain exactly the songs of the setlist",
                                     "code": "custom"}]}))
                    return
                self._escreveu(200, {"songs": ordem})
                return

            if len(partes) == 3 and partes[:2] == ["api", "setlists"]:
                setlist = modelo.achar(partes[2])
                if setlist is None:
                    self._json(404, _envelope("NOT_FOUND", "Setlist not found"))
                    return
                self._escreveu(200, modelo.editar(setlist, corpo))
                return

            self._json(404, _envelope("NOT_FOUND", "Not found"))

        def do_DELETE(self) -> None:  # noqa: N802
            u = urlparse(self.path)
            self._log_escrita("DELETE")
            if self._falha_de_escrita():
                return

            partes = u.path.strip("/").split("/")
            if len(partes) == 4 and partes[2] == "songs":
                achado = modelo.achar_song(partes[3])
                if achado is None:
                    self._json(404, _envelope("NOT_FOUND", "Song not found"))
                    return
                setlist, song = achado
                modelo.remover(setlist, song)
                self._escreveu(200, {"success": True})
                return

            if len(partes) == 3 and partes[:2] == ["api", "setlists"]:
                setlist = modelo.achar(partes[2])
                if setlist is None:
                    # N2-D12 (#307): inexistente, alheia OU já apagada → 404.
                    self._json(404, _envelope("NOT_FOUND", "Setlist not found"))
                    return
                modelo.apagar(setlist)
                self._escreveu(200, {"success": True})
                return

            self._json(404, _envelope("NOT_FOUND", "Not found"))

        def log_message(self, *_args) -> None:
            return

    print(f"fixture: servidor em :{porta} modo={modo} "
          f"setlists={len(modelo.setlists)} content={len(content)} paginas={[len(p) for p in paginas]}",
          flush=True)
    servidor_http = ThreadingHTTPServer(("127.0.0.1", porta), H)
    servidor_http.daemon_threads = True
    servidor_http.serve_forever()


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
