// Modules to control application life and create native browser window
const electron = require('electron')
const {app, BrowserWindow, screen, ipcMain,shell ,dialog} = require('electron')
const path = require('path')


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
//用一个 Tray 来表示一个图标,这个图标处于正在运行的系统的通知区 ，通常被添加到一个 context menu 上.
const Menu = electron.Menu;
const Tray = electron.Tray;
//托盘对象

function createWindow() {

  mainWindow = new BrowserWindow({
    width: 540,
    height: 570,
    frame: false,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
    transparent:true,
    skipTaskbar:true
  })

  //调试
  //mainWindow.webContents.openDevTools()

  var width = screen.getPrimaryDisplay().workAreaSize.width
  mainWindow.setPosition( width - 550,  10)


    //系统托盘右键菜单
    var trayMenuTemplate = [
        {
            label: '编辑模式',
            type:'checkbox',
            checked: false, 
            click: function () {
                  if(contextMenu.items[0].checked){
                    mainWindow.webContents.send('changeMode', 0)
                    mainWindow.setResizable(true);

                  }else{
                    mainWindow.webContents.send('changeMode', 1)
                    mainWindow.setResizable(false);

                    var rect = mainWindow.getContentBounds()
                    mainWindow.webContents.send('saveChange', rect)
                  }
            } //打开相应页面
        },
        {
            label: '开机启动',
            type:'checkbox',
            checked: app.getLoginItemSettings().openAtLogin, 
            click: function () {
              app.setLoginItemSettings({
                openAtLogin: !app.getLoginItemSettings().openAtLogin
              })
            }
        },
        {
            label: '关于',
            click: function () {
              dialog.showMessageBoxSync({
                message:"个人主页：html50.github.io\n源码： github.com/html50/flav0r\n版本:1.0",
                type: "info"
              })
            }
        },
        {
            label: '退出',
             click: function () {
             app.quit();
             app.quit();//因为程序设定关闭为最小化，所以调用两次关闭，防止最大化时一次不能关闭的情况
             //shell.openItem(path.join(__dirname, ',close.exe'))
            }
        }
    ];


    //系统托盘图标目录
    trayIcon = path.join(__dirname, '/');//app是选取的目录
    appTray = new Tray(path.join(trayIcon, 'app.ico'));//app.ico是app目录下的ico文件
 
    const contextMenu = Menu.buildFromTemplate(trayMenuTemplate);

    //设置此托盘图标的悬停提示内容
    appTray.setToolTip('flav0r');
 
    //设置此图标的上下文菜单
    appTray.setContextMenu(contextMenu);

    //单击右下角小图标显示应用
    appTray.on('click',function(){
        mainWindow.show();
    })


    //图标的上下文菜单

    mainWindow.on('close',(e) => {  
    //回收BrowserWindow对象
    if(mainWindow.isMinimized()){
      mainWindow = null;
    }else{
      e.preventDefault();
      mainWindow.minimize();
    } 
    }); 

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })


  setTimeout(function(){
     shell.openItem( process.cwd()  + "\\opacity.exe")
   },1000)
}


//user window position
ipcMain.on('init', (event, arg) => {  
    console.log(arg)
    //return
    var _width = Number(arg.width),
        _height = Number(arg.height),
        _left = Number(arg.left),
        _top = Number(arg.top)
        
        mainWindow.setBounds({ x: _left, y: _top, width: _width, height: _height })
})


app.on('ready', createWindow)
app.on('window-all-closed', function () {
   app.quit()
})
