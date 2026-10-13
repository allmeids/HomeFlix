#!/usr/bin/env bash
set -e

export JAVA_HOME="/home/almeida/.android-toolchain/jdk-17"
export ANDROID_HOME="/home/almeida/.android-toolchain/android-sdk"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:/home/almeida/.android-toolchain/gradle-8.4/bin:$PATH"

PROJECT_DIR="/home/almeida/Documentos/Pessoal/HomeFlix/android"
DIST_DIR="/home/almeida/Documentos/Pessoal/HomeFlix/dist"

cd "$PROJECT_DIR"
chmod +x gradlew

echo "=== Iniciando compilação do APK HomeFlix ==="
./gradlew assembleRelease --no-daemon

APK_SRC="$PROJECT_DIR/app/build/outputs/apk/release/app-release.apk"
if [ ! -f "$APK_SRC" ]; then
    # Fallback se gerado como unaligned/unsigned
    APK_SRC=$(find "$PROJECT_DIR/app/build/outputs/apk" -name "*.apk" | head -n 1)
fi

if [ -f "$APK_SRC" ]; then
    mkdir -p "$DIST_DIR"
    cp "$APK_SRC" "$DIST_DIR/HomeFlix.apk"
    echo "=== APK compilado com sucesso! ==="
    ls -lh "$DIST_DIR/HomeFlix.apk"
    sha256sum "$DIST_DIR/HomeFlix.apk"
else
    echo "ERRO: APK não encontrado após a compilação."
    exit 1
fi
