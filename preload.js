const { ipcRenderer,shell,remote } = require('electron')
var viewMode = 1
var setPos =false;
var posX,posY,screenX,screenY;
var selected;
var delMenu =false
var dragEnter = false,lastenter = null;
//这两个flag很关键，决定了dragEnter不出现问题。

window.onload = ()=> {


 //加载用户设置
 if(localStorage.item !==  "[]" && localStorage.item !==  undefined){


    //send init msg to main renderer for setting window position
    ipcRenderer.send('init', localStorage)

    var itemData = JSON.parse(localStorage.item)
    var source='';

    for(var i=0;i<itemData.length;i++){
      var item = JSON.parse(itemData[i])
      source += '<div class="item" path="'+item.path+'" style="background-image:'+item.img.replace(/"/g,'\'')+';background-size:'+item.scale+';background-position:'+item.position+'"><div class="spinner"></div><div class="name" draggable="false">'+item.text+'</div></div>'
    }

  }else{
    source = '<div class="item" path style="" id="newItem"><div class="spinner"></div><div class="add">+</div></div>'
  }
  
  document.querySelector('.container').innerHTML = source
  //加载用户设置 end
  bind()

  //拖拽编辑图片位置
  document.documentElement.onmousemove = getDirect

  function getDirect(e){
    if(setPos && !viewMode){

      var x=e.clientX - screenX;
      var y=e.clientY - screenY;

      document.querySelectorAll('.item')[selected].style.backgroundPositionX =posX + x +'px'
      document.querySelectorAll('.item')[selected].style.backgroundPositionY =posY + y +'px'
    }
  }
  document.onmouseup = (e)=>{
    if(!viewMode && setPos && e.which==1 && (e.clientY > window.innerWidth || e.clientY<0 || e.clientX<0 ||e.clientX>window.innerHeight)){
      //release()
    }
  };

  document.onmouseup = (e) => {
    if(setPos && !viewMode) release();
  }
  //拖拽编辑图片位置 end

//document图片、程序（添加、更新内容）
//这个是图标拖入时，不仍在任意的ITEM项时的函数，从直观的操作流程来看，产生概率不大

document.ondrop = (e) => {
  if(!viewMode){
    dropped(e,newItem)
  }
};

document.ondragover = (e) => {
  e.preventDefault();
  e.stopPropagation();
};


//添加项目，拖拽至面板，新增item
//但是，如果没有项目，只有预置的 + ，就不新增item

document.ondragenter = (e) => {
  if(!viewMode){
    lastenter = e.target;

    e.preventDefault();
    e.stopPropagation();

    console.log('enter:', lastenter)
    if(!dragEnter) {
      dragEnter = true
      console.log('enter')

      

    
  
      if(!defaultItem()) {
      var ele = document.createElement('div')
      ele.className = 'item'
      ele.id= 'newItem'
      ele.innerHTML = '<div class="spinner"></div><div class="add">+</div>'
      document.querySelector('.container').appendChild(ele)
      }

      

      var item = document.querySelectorAll('.item'),
      len = item.length;

      item[len-1].ondrop = (e) =>{
        e.stopPropagation();
        e.preventDefault();
        if(!viewMode){
          dropped(e,item[len-1])
        }
      }
      item[len-1].ondragenter = (e) => {
        item[len-1].classList.add('item-add')
      };
      item[len-1].ondragleave = (e) => {
        item[len-1].classList.remove('item-add')
      };
    }

  }
};

document.ondragleave = (e) => {
  console.log('leave:', e.target)
  e.preventDefault();
  e.stopPropagation();
  if(dragEnter && lastenter === e.target && !viewMode) {
    console.log('leave')

    dragEnter = false
    lastenter = null


    if(!defaultItem()){
    var ele = document.querySelector('#newItem')
    ele.parentNode.removeChild(ele);
    }

  }

};


document.querySelector('ul').onclick=(e)=>{
  e.stopPropagation()
  e.preventDefault()
  var t = e.target
  var item = document.querySelectorAll('.item')



  if (t.innerText == '删除') {

    menu.style.display = "none";
    if(item.length === 1){
      remote.dialog.showMessageBox({title  : '错误'
  , type  : 'error'
  ,message:"再删就没有了~不喜欢可以换嘛"})
      return
    }

    document.querySelector('.container').removeChild(item[selected])

    //重新绑定item事件，因为selected已经改变，比如共4项，删除了第2项，这时第4项的删除操作就无效了。
    bind();
  }
}

}
//DOM ready end


function bind(){
//加载各种绑定
var children = document.querySelectorAll('.item')


for (let i = children.length - 1; i >= 0; i--) {
//直接覆盖事件绑定函数
      //缩放
      children[i].onmousewheel=(e)=>{

        if(!viewMode){
          var size = parseInt(getComputedStyle(children[i]).backgroundSize)

          if(e.deltaY >0){
            size += 10;
          }else{
            size -= 10;
          }
          children[i].style.backgroundSize = size + "%" ;
          
        }

      }

      //单击启动
      children[i].onclick=function(e){
       if(this.lastChild.innerText === "+"){
         alert("进入编辑模式添加内容")
       }else if(viewMode){
        this.firstChild.style.display='flex';
        shell.openItem(this.getAttribute("path"))
        setTimeout(()=>{
          this.firstChild.style.display='none';
        },3000)
      }else{
        if(delMenu){
          delMenu = false;
          menu.style.display = "none";
        }

      }

    }


//按下鼠标
children[i].onmousedown=(e)=>{
  if(!viewMode){
    selected = i;

    if(e.which == 3){

      var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      menu.style.display = "block";
      menu.style.left = e.clientX + "px";
      menu.style.top = e.clientY + scrollTop + "px";

      delMenu = true;

    }

    if(e.which == 1){
      posX = parseInt(getComputedStyle(children[i]).backgroundPositionX)
      posY = parseInt(getComputedStyle(children[i]).backgroundPositionY)
      screenX = e.clientX
      screenY = e.clientY;

      setPos = true;
    }
  }

  

}

/*  //松开鼠标
  children[i].onmouseup',(e)=>{
    if(!viewMode && e.which == 1){
      release()
    }
  })
  */

  //图片或文档拖拽到item
  children[i].ondrop = (e)=>{
    if(!viewMode){
      console.log(e.srcElement)
      console.log(e.srcElement.id)
      dropped(e,children[i])
    }
  }

  children[i].ondragenter = (e) => {
    if(!viewMode) children[i].classList.add('item-add')
  };
children[i].ondragleave = (e) => {
  if(!viewMode) children[i].classList.remove('item-add')
};


children[i].lastChild.onmousedown =(e) =>{
  e.stopPropagation();
}



if(!viewMode){
  children[i].lastChild.contentEditable = 'true'
  children[i].lastChild.classList.add('outline')
}
}
//for循环赋值结束
}
//bind end

//通用放置函数，除了newItem本身，因为不能新添加项后再删掉自身。
function dropped(e,node){
  e.preventDefault();
  e.stopPropagation();

  var _name = e.dataTransfer.files[0].name

  var pos = _name.lastIndexOf('.')
  var ext = _name.slice(pos+1)
  _name  = _name.slice(0,pos)
  var path = e.dataTransfer.files[0].path.replace(/\\/g,'/')

  if(ext=== 'jpg' || ext=== 'jpeg' || ext=== 'png' || ext=== 'gif'){
      //设置为背景
      node.style.backgroundImage='url('+path+')'
      node.style.backgroundSize = '100%'
    }else{
      //设置为启动
      //node.path == path
      node.setAttribute('path',path)
      node.innerHTML = '<div class="spinner"></div><div class="name" draggable="false">'+_name+'</div>'
    }



    bind()


    if(e.srcElement.id === 'newItem')
    { 
      node.id = ''
    }else{
      var ele = document.querySelector('#newItem')
      ele.parentNode.removeChild(ele);
    }

    dragEnter = false;
    lastenter = null;
    node.classList.remove('item-add')

  }
//end

//编辑模式切换
require('electron').ipcRenderer.on('changeMode', (event, message) => {
  viewMode = message

  if(!viewMode){
   document.documentElement.classList.add("edit-no-drag")
   document.querySelector('.bar').classList.add("edit-drag")


   var text = document.querySelectorAll('.name')
   for (var i = text.length - 1; i >= 0; i--) {
    text[i].contentEditable = 'true'
    text[i].classList.add('outline')
  }
}else{
  document.documentElement.classList.remove("edit-no-drag")
  document.querySelector('.bar').classList.remove("edit-drag")

  var text = document.querySelectorAll('.name')
  for (var i = text.length - 1; i >= 0; i--) {
    text[i].contentEditable = 'false'
    text[i].classList.remove('outline')
  }
}
})

function release(){
  selected = null;
  setPos = false;
}

function defaultItem(){
  if(document.querySelectorAll('.item').length === 1 && document.querySelectorAll('.item')[0].lastChild.innerText === "+"){
    return true
  }
}



//保存用户设置
ipcRenderer.on('saveChange', (event, message) => {

  if(!defaultItem()){

  localStorage.left = message.x
  localStorage.top = message.y
  localStorage.width = message.width
  localStorage.height = message.height

  var item = document.querySelectorAll('.item')

  var itemData =[]

  for(let i=0;i<item.length;i++){
   var obj ={}
   obj.img = item[i].style.backgroundImage
   obj.path = item[i].getAttribute('path')
   obj.text = item[i].lastElementChild.innerText
   obj.scale = getComputedStyle(item[i]).backgroundSize
   obj.position = getComputedStyle(item[i]).backgroundPosition

   itemData.push(JSON.stringify(obj))
 }

 localStorage.item = JSON.stringify(itemData)

}else{
  
 }

})



ipcRenderer.on('getInfo', (event, message) => {

  if(localStorage.length > 0) {
    ipcRenderer.send('init', localStorage)
  }else {
    ipcRenderer.send('init', 0)
  }
})