#!/bin/sh
# uso: roteiro.sh <serial> <prefixo> <wrapper tab|avd> — os estados do §3.1 sobre o bundle final, com o mock
S=$(dirname $0); D=$1; P=$2; W=$3
LOG=$S/log/$W.txt
ADB="$HOME/Library/Android/sdk/platform-tools/adb -s $D"
marca() { N0=$(wc -l < $LOG); }
novas() { sleep ${1:-2.5}; tail -n +$((N0+1)) $LOG | sed 's/.*OCTAVIA: /    log: /'; }
dump() { echo "  [dump $P-$1]"; $S/dump.sh $D $P-$1 --todos > $S/dumps/$P-$1.txt; grep -E "$2" $S/dumps/$P-$1.txt | sed 's/^/    /'; }
t() { $S/toque.sh $D "$@" | sed 's/^/  /' || { echo "  ABORTA: sem $1"; exit 1; }; }
kb() { $ADB shell dumpsys input_method | grep -o "mInputShown=[a-z]*" | head -1; }
semkb() { [ "$(kb)" = "mInputShown=true" ] && { $ADB shell input keyevent KEYCODE_BACK; sleep 0.8; }; true; }
mock() { echo "  [mock $1]"; $S/mock.sh $1 | sed 's/^/    /'; }
IDS='^(voltar|buscar|criar-setlist|picker-abrir|reordenar|setlist-|remover-1 |song-1 |aviso|picker-(estado-1|adicionar-1|rodape|total|concluir)|form-)'

echo "== 01 S1 (escrita)"; dump 01-s1 "$IDS"
echo "== 02 S2e"; t setlist-aaaaaaaa; sleep 1.5; dump 02-s2e "$IDS"
echo "== 03/04 E8 — folha com data, Limpar"; t setlist-editar; sleep 1.5; semkb; dump 03-e8-folha '^form-'
t form-data-limpar; sleep 1; dump 04-e8-limpo '^form-|dd / mm'
marca; t form-salvar; novas
echo "== 05/06 sem rede (avião)"; echo "  avião antes: $($ADB shell settings get global airplane_mode_on)"
$ADB shell cmd connectivity airplane-mode enable; sleep 5
echo "  avião: $($ADB shell settings get global airplane_mode_on) · ping: $($ADB shell ping -c 1 -W 3 8.8.8.8 2>&1 | tail -1)"
dump 05-s2-sem-rede "$IDS|Sem conexão"
$ADB exec-out screencap -p > $S/png/$P-05-full.png
marca; t picker-abrir; sleep 0.8; t remover-1; t setlist-editar; t reordenar; t setlist-apagar; echo "  toques nos inertes:"; novas 1; echo "    (fim)"
marca; t song-1; novas 2; $ADB shell input keyevent KEYCODE_BACK; sleep 1.5
t voltar; sleep 1.5; dump 06-s1-sem-rede "$IDS|Sem conexão"
marca; t criar-setlist; novas 1; echo "    (fim)"
$ADB shell cmd connectivity airplane-mode disable; sleep 6; [ "$W" = avd ] && $ADB shell svc data enable && sleep 3
echo "  avião: $($ADB shell settings get global airplane_mode_on) · ping: $($ADB shell ping -c 1 -W 5 8.8.8.8 2>&1 | tail -1)"
echo "== 07 S1 salvo-não-relido"; mock escrita-resync-500
t criar-setlist; sleep 1.2; $ADB shell input text "Aceite%sPR7%s$W"; sleep 0.5; semkb
marca; t form-salvar; novas 3; dump 07-s1-salvo-nao-relido "$IDS"
echo "== 08 S2 salvo-não-relido (remover)"; t setlist-aaaaaaaa; sleep 1.5
marca; t remover-1; novas 3; dump 08-s2-salvo-nao-relido "$IDS"
echo "== 09 picker salvo-não-relido"; t picker-abrir; sleep 1.2; $ADB shell input text romance; sleep 1.5
marca; t picker-adicionar-1; novas 3; dump 09-picker-salvo-nao-relido "$IDS"
semkb; marca; t picker-concluir; novas 3
echo "== 10 S2 falhou (500) com Tentar de novo depois da releitura"; mock escrita-500
marca; t aviso-acao; novas 2
marca; t remover-1; novas 3; dump 10-s2-falhou "$IDS"
echo "== 11 picker falhou (500)"; t picker-abrir; sleep 1.2; $ADB shell input text romance; sleep 1.5
marca; t picker-adicionar-1; novas 3; dump 11-picker-falhou "$IDS"
semkb; t picker-concluir; sleep 2
echo "== 12 (conserto) S2: 500 e releitura 500"; mock escrita-500-releitura-500
marca; t remover-1; novas 3; dump 12-s2-falhou-sem-releitura "$IDS"
echo "== 13/14 (conserto, N2-E21) 404 e releitura 500 → S1"; mock escrita-404-releitura-500
marca; t remover-1; novas 3; dump 13-s1-sumiu-nao-relido "$IDS"
mock escrita; marca; t aviso-acao; novas 2; dump 14-s1-sumiu-relido "$IDS"
echo "== 15 limite (429, Retry-After 30)"; mock escrita-429
t setlist-aaaaaaaa; sleep 1.5; marca; t remover-1; novas 2; dump 15-s2-limite "$IDS"
echo "== 16/17 acima de 100 (depois de 31 s: a janela do 429 fecha)"; sleep 31; mock escrita
t voltar; sleep 1.5; t setlist-bbbbbbbb; sleep 1.5; dump 16a-s2-100 "$IDS"
echo "  100 → 101 pelo picker (adicionar segue ativo no teto)"
t picker-abrir; sleep 1.5; t picker-campo; sleep 0.8; $ADB shell input text romance; sleep 1.5
marca; t picker-adicionar-1; novas 3; dump 16b-picker-101 "$IDS"
semkb; t picker-concluir; sleep 2; dump 16c-s2-101 "$IDS"
marca; t reordenar; novas 1
t setlist-editar; sleep 1.5; semkb; dump 17-e8-sem-data '^form-|dd / mm'; t form-cancelar; sleep 1
echo "== 18 (E19) picker: rede (escrita-pendurada, 20 s)"; mock escrita-pendurada
t voltar; sleep 1.5; t setlist-aaaaaaaa; sleep 1.5; t picker-abrir; sleep 1.5; t picker-campo; sleep 0.8; $ADB shell input text romance; sleep 1.5
marca; t picker-adicionar-1; novas 26; dump 18-picker-sem-resposta "$IDS"
semkb; t picker-concluir; sleep 2; mock escrita
echo "== fim"
