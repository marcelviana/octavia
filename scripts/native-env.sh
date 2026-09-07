# Ambiente do nativo (N0-D8): `source scripts/native-env.sh` — só exports, sem efeitos colaterais.
# Por quê: ANDROID_HOME/PATH não estão no shell (N0-PRECHECK div. 5); o adb enxerga um "emulator-5562 offline"
# fantasma (NTKDaemon na porta 5563, div. 8) → limitar a varredura a 5555; JDK 17 é o requisito da doc do Expo (B3).
export ANDROID_HOME="$HOME/Library/Android/sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
export JAVA_HOME="/Library/Java/JavaVirtualMachines/amazon-corretto-17.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
export ADB_LOCAL_TRANSPORT_MAX_PORT=5555
