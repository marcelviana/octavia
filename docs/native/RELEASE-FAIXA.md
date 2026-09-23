# RELEASE-FAIXA — a série do build de release, local

**A fonte dos números do build de release** (W4-b3, 2026-09-23). Arquivo próprio, e
não uma seção do [`CI-FAIXA.md`](CI-FAIXA.md), porque aquele se declara a fonte de todo
número **de CI** do APK. Esta série é **local**, e o [`APARATO.md`](APARATO.md) já registra
que APK local não se compara com a série do CI (div. 253). As duas não se misturam.

**A regra é a do `CI-FAIXA.md`**: todo número daqui se cita **com `n` e o nível**. Um
número sem `n` é uma medição, não uma referência (div. 80).

## Como se mede

`sh docs/native/W4B3-anexos/builds.sh <saida.tsv> R1 R2 …`, da raiz da árvore. Cada
corrida parte limpa: `apps/native/android` apagado e refeito pelo prebuild, e os
`build/`, `.cxx/` e `.gradle/` que o Gradle gera dentro de `node_modules` apagados. Roda
com `./gradlew assembleRelease --no-daemon --no-build-cache`. Ficam quentes o
`~/.gradle/caches` e o **`$TMPDIR/metro-cache`**; este último o script **não** apaga, e
na W4-b3 ele estava quente (ver "Limites"). O nível é **prebuild + gradle** (tempo de
parede do script), sem `pnpm install` e sem setup de runner.

Assinatura: **chave de debug** (`signingConfigs.debug` do template do prebuild,
`CN=Android Debug`). Não existe chave de release no repositório, e nenhuma foi criada.
APK **universal** com as quatro ABIs (`reactNativeArchitectures` do
`gradle.properties`). O tamanho "por ABI" é a soma de `lib/<abi>/` no `unzip -l`
(bytes descomprimidos).

## A série

Máquina: Apple M1, 8 núcleos, 16 GB, macOS 26.6.2, JDK Corretto 17. Árvore `w4b/palco`
com o conserto do W4-b3.

| # | rótulo | quando | prebuild | gradle | total | APK | armeabi-v7a | arm64-v8a | x86 | x86_64 |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | R1 | 2026-09-23 18:05 | 2 s | 356 s | **5m58s** | 105.129.893 B | 16.783.136 | 24.296.128 | 25.297.232 | 25.078.448 |
| 2 | R2 | 2026-09-23 18:21 | 5 s | 327 s | **5m32s** | 105.129.893 B | idem | idem | idem | idem |
| 3 | R3 | 2026-09-23 18:36 | 5 s | 382 s | **6m27s** | 105.129.893 B | idem | idem | idem | idem |

```
n=3   mín 5m32s   máx 6m27s   mediana 5m58s   (nível: prebuild + gradle, local)
```

Os três têm **conteúdo idêntico**: o CRC de toda entrada é igual. O sha256 difere pelo
envelope do zip e da assinatura. Para comparar, o APK debug universal da mesma árvore
tem 234.114.536 B (`W4B3-anexos/BUILDS-analise.txt`).

## O que o release faz diferente do dev client `[medido: W4B3-anexos/RELEASE-aparelho.txt]`

- **Tela**: todo nó do palco é idêntico em dp. O release só não tem os 10 nós do botão
  flutuante do dev client.
- **Navegação**: `nav t=18–19` ms no release, contra `t=68–78` ms no dev client.
- **`http://` não passa**: o release não tem `usesCleartextTraffic`, que o prebuild só
  põe nos manifests de debug. O mock do `aceite.py` (`http://localhost:8788`) **não**
  serve para aceite com release. Prod é `https`.
- **`EXPO_PUBLIC_*` inline não basta**: com o `metro-cache` quente, o bundle embutido
  saiu com a URL velha. Trocar variável de ambiente para um build de release exige
  apagar o `$TMPDIR/metro-cache` antes.

## Limites

O `metro-cache` estava quente nas três corridas, e no CI ele é frio. O passo
`createBundleReleaseJsAndAssets` pode estar abaixo do que seria num build frio. O
tempo dele não foi separado.
