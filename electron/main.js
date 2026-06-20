const { app, BrowserWindow } = require('electron');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "ANV Sport",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // THAY ĐỔI URL NÀY THÀNH LINK THẬT CỦA BẠN
  mainWindow.loadURL('https://anvsport.xyz');
  
  // Ẩn thanh menu mặc định của trình duyệt để giống App hơn
  mainWindow.setMenuBarVisibility(false);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
