// Modules to control application life and create native browser window
const { app, BrowserWindow, dialog, Menu } = require('electron')
const fs = require('fs')
const path = require('path')
const settings = require('electron-settings')
const isDev = require('electron-is-dev')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    },
    titleBarStyle: 'hidden',
  })
  
  const template = [
    {
      label: 'File',
      submenu: [
        // {
        //   label: 'Open File',
        //   accelerator: 'CmdOrCtrl+O',
        //   click () {
        //     openFile()
        //   },
        // },
        {
          label: 'Open Folder',
          accelerator: 'CmdOrCtrl+O',
          click () {
            openDir()
          },
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click () {
            mainWindow.webContents.send('save-file')
          }
        },
        {
          label: 'Close Folder',
          click () {
            const dir = settings.get('directory')
            if (dir) {
              mainWindow.webContents.send('closed-dir')
            }
          }
        },
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteandmatchstyle' },
        { role: 'delete' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forcereload' },
        // { role: 'toggledevtools' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      role: 'window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click () { require('electron').shell.openExternal('https://electronjs.org') }
        }
      ]
    },
    {
      label: 'Developer',
      submenu: [
        {
          label: 'Toggle Developer Tools',
          accelerator:
            process.platform === 'darwin' ? 'Cmd+Alt+I' : 'Ctrl+Shift+I',
          click () {
            mainWindow.webContents.toggleDevTools()
          },
        }
      ]
    }
  ]
  
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    })
    
    // Window menu
    template[4].submenu = [
      { role: 'close' },
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' }
    ]
  }
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
  
  // and load the index.html of the app.
  mainWindow.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, 'index.html')}`)
  
  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
  
  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

function openFile () {
  const files = dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Markdown Files', extensions: ['md'] },
      { name: 'All Files', extensions: ['*'] },
    ]
  })

  // We don't need to do anything if there are no files
  if (!files) {
    return
  }

  const contents = fs.readFileSync(files[0]).toString()
  console.log(contents)
  mainWindow.webContents.send('new-file', contents)
}

function openDir () {
  const directory = dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  })

  if (!directory) {
    return
  }

  const dir = directory[0]
  mainWindow.webContents.send('new-dir', dir)
}
