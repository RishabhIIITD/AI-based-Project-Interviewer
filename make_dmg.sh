#!/usr/bin/env bash
set -euo pipefail

APP_NAME="upGrad Project Interviewer"
DMG_NAME="Project-Interviewer.dmg"
PORT="${PORT:-5001}"

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
RELEASE_DIR="$PROJECT_DIR/release"
APP_DIR="$RELEASE_DIR/$APP_NAME.app"
CONTENTS="$APP_DIR/Contents"
MACOS="$CONTENTS/MacOS"

echo "Building production bundle..."
cd "$PROJECT_DIR"
npm run build

echo "Preparing app bundle..."
rm -rf "$APP_DIR"
mkdir -p "$MACOS"

cat > "$CONTENTS/Info.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>CFBundleName</key>
    <string>$APP_NAME</string>
    <key>CFBundleIdentifier</key>
    <string>com.projectinterviewer.app</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleExecutable</key>
    <string>launcher</string>
  </dict>
</plist>
EOF

cat > "$MACOS/launcher" <<EOSH
#!/usr/bin/env bash
cd "$PROJECT_DIR"
export NODE_ENV=production
export PORT=$PORT
nohup node dist/index.cjs >/tmp/project-interviewer.log 2>&1 &
open "http://localhost:$PORT"
EOSH
chmod +x "$MACOS/launcher"

echo "Staging DMG contents..."
DMG_STAGING="$RELEASE_DIR/dmg"
rm -rf "$DMG_STAGING"
mkdir -p "$DMG_STAGING"
ln -s /Applications "$DMG_STAGING/Applications"
cp -R "$APP_DIR" "$DMG_STAGING/$APP_NAME.app"

echo "Creating DMG..."
hdiutil create -volname "$APP_NAME" -srcfolder "$DMG_STAGING" -ov -format UDZO "$RELEASE_DIR/$DMG_NAME" >/dev/null

echo "DMG ready at: $RELEASE_DIR/$DMG_NAME"
