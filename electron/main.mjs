import { app, BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";


async function startServer() {
  process.env.NODE_ENV = "production";
  process.env.MANUAL_START = "true";
  
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const distPath = path.resolve(__dirname, "..", "dist", "index.cjs");
  const fileUrl = pathToFileURL(distPath).href;
  
  console.log("Importing server module...");
  const module = await import(fileUrl);
  
  // Handle CJS/ESM interop
  const serve = module.serve || (module.default && module.default.serve);
  
  if (!serve) {
    throw new Error("Failed to find 'serve' export in server module");
  }

  console.log("Starting server...");
  const port = await serve(5001);
  console.log(`Server started on port ${port}`);
  
  process.env.PORT = port.toString();
  return port;
}

function createWindow(port) {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: "#0b0f1a",
    titleBarStyle: "hiddenInset",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: "upGrad Project Interviewer",
  });
  win.setMenuBarVisibility(false);
  win.loadURL(`http://localhost:${port}`);
}

app.whenReady().then(async () => {
  try {
    const port = await startServer();
    createWindow(port);
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow(port);
    });
  } catch (error) {
    console.error("Failed to start application:", error);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
