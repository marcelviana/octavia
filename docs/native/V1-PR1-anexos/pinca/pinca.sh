#!/system/bin/sh
# Pinça de dois dedos no AVD: o virtio expõe UM device por contato
# (virtio_input_multi_touch_1..11), então cada dedo é um /dev/input/eventN.
# Escala do ABS_MT_POSITION: 0..32767 sobre a resolução do display.
A=/dev/input/event1
B=/dev/input/event2
W=2560; H=1600
px() { echo $(( $1 * 32767 / $W )); }
py() { echo $(( $1 * 32767 / $H )); }
down() { # $1=dev $2=id $3=x $4=y
  sendevent $1 3 57 $2; sendevent $1 3 53 $(px $3); sendevent $1 3 54 $(py $4)
  sendevent $1 3 58 500; sendevent $1 1 330 1; sendevent $1 0 0 0
}
move() { # $1=dev $2=x $3=y
  sendevent $1 3 53 $(px $2); sendevent $1 3 54 $(py $3); sendevent $1 0 0 0
}
up() { sendevent $1 3 57 -1; sendevent $1 1 330 0; sendevent $1 0 0 0; }

AX1=$1; AY1=$2; AX2=$3; AY2=$4
BX1=$5; BY1=$6; BX2=$7; BY2=$8
down $A 111 $AX1 $AY1
down $B 222 $BX1 $BY1
N=12
I=1
while [ $I -le $N ]; do
  AX=$(( AX1 + (AX2 - AX1) * I / N )); AY=$(( AY1 + (AY2 - AY1) * I / N ))
  BX=$(( BX1 + (BX2 - BX1) * I / N )); BY=$(( BY1 + (BY2 - BY1) * I / N ))
  move $A $AX $AY
  move $B $BX $BY
  I=$(( I + 1 ))
done
up $A
up $B
echo PINCA-OK
