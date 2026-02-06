#!/usr/bin/env bash
set -euo pipefail

APP_NAME="upGrad Interviewer"
APP_ID="com.projectinterviewer.app"
LAUNCHD_LABEL="com.projectinterviewer.server"
PORT="${PORT:-5001}"

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
LAUNCHD_DIR="$HOME/Library/LaunchAgents"
LOG_PATH="$HOME/Library/Logs/ProjectInterviewer.log"

echo "Installing $APP_NAME for macOS..."
echo "Project directory: $PROJECT_DIR"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "This installer supports macOS only."
  exit 1
fi

echo "Checking Node and npm..."
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found. Please install Node.js >= 18 first (brew install node)."
  exit 1
fi
if ! command -v npm >/dev/null 2>&1; then
  echo "npm not found. Please install npm first."
  exit 1
fi

NODE_VERSION="$(node -v | sed 's/^v//')"
REQUIRED_MAJOR=18
if [[ "${NODE_VERSION%%.*}" -lt "$REQUIRED_MAJOR" ]]; then
  echo "Node.js >= $REQUIRED_MAJOR is required, found v$NODE_VERSION"
  exit 1
fi

echo "Installing dependencies..."
cd "$PROJECT_DIR"
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

echo "Building application (client + server)..."
npm run build

echo "Creating LaunchAgent to run server in background..."
mkdir -p "$LAUNCHD_DIR"
PLIST_PATH="$LAUNCHD_DIR/$LAUNCHD_LABEL.plist"
cat > "$PLIST_PATH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>$LAUNCHD_LABEL</string>

    <key>ProgramArguments</key>
    <array>
      <string>/bin/zsh</string>
      <string>-lc</string>
      <string>cd "$PROJECT_DIR" && PORT=$PORT npm run start</string>
    </array>

    <key>EnvironmentVariables</key>
    <dict>
      <key>NODE_ENV</key>
      <string>production</string>
      <key>PORT</key>
      <string>$PORT</string>
      <key>PATH</key>
      <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
    </dict>

    <key>WorkingDirectory</key>
    <string>$PROJECT_DIR</string>

    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>

    <key>StandardOutPath</key>
    <string>$LOG_PATH</string>
    <key>StandardErrorPath</key>
    <string>$LOG_PATH</string>
  </dict>
</plist>
EOF

echo "Reloading LaunchAgent..."
launchctl unload "$PLIST_PATH" >/dev/null 2>&1 || true
launchctl load -w "$PLIST_PATH"

echo "Creating application shortcut in /Applications..."
TARGET_APP="/Applications/$APP_NAME.app"
if command -v osacompile >/dev/null 2>&1; then
  osacompile -o "$TARGET_APP" -e "do shell script \"open http://localhost:$PORT\""
else
  echo "osacompile not available; creating minimal app bundle."
  mkdir -p "$TARGET_APP/Contents/MacOS"
  mkdir -p "$TARGET_APP/Contents/Resources"
  cat > "$TARGET_APP/Contents/Info.plist" <<EOPLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>CFBundleName</key>
    <string>$APP_NAME</string>
    <key>CFBundleIdentifier</key>
    <string>$APP_ID</string>
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
EOPLIST
  cat > "$TARGET_APP/Contents/MacOS/launcher" <<'EOSH'
#!/usr/bin/env bash
open "http://localhost:5001"
EOSH
  chmod +x "$TARGET_APP/Contents/MacOS/launcher"
fi

echo ""
echo "Installation complete."
echo "- Server will run in background via launchd: $LAUNCHD_LABEL"
echo "- App icon installed: $TARGET_APP"
echo "- Open the app from Launchpad, or visit http://localhost:$PORT"
echo ""
echo "To stop the background server:"
echo "  launchctl unload \"$PLIST_PATH\""
echo "To view logs:"
echo "  tail -f \"$LOG_PATH\""

