#!/bin/sh
# amostra a carga do host a cada 5 s: época em ms, os 5 processos de mais CPU (div. 1276)
while true; do
  t=$(python3 -c 'import time;print(int(time.time()*1000))')
  ps -Ao pcpu=,comm= | sort -rn | head -5 | awk -v t=$t '{c=$1; $1=""; printf "%s %s%s\n", t, c, $0}'
  sleep 5
done
