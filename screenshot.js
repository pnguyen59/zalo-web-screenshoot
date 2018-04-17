var censorMode = false , drawArrow = false, rectMode =false, textMode = false, hlMode = false, drawMode = false
var undoInHL =0;
var x =0, y = 0;
// var drawing = false;
var drawingEnable = false;
var pugImg = new Image();
var imgElement = new Image();
var htmlImg = document.getElementById('target');
var globalContext;
var pathArray = [];
var redoArray = [];
var pathArrayHL = [];
var redoArrayHL = [];

var clipRect1 = new fabric.Rect({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    selectable: true,
    hasRotatingPoint: false,
    fill: "transparent",
    transparentCorners: false,
    cornerSize: 25,
    id: 'clipRect1',
    lockScalingFlip: true
});

var canvas2 = new fabric.Canvas('c2',{
	originX: 'left',
	originY: 'top',
	left:0,
	top: 0,
	width: window.screen.width,
	height: window.screen.height,
	selectable: false,
    clipTo: function(ctx){
        ctx.rect(clipRect1.left, clipRect1.top, clipRect1.width, clipRect1.height);
    },
    uniScaleTransform: true,
    skipOffScreen: true
});
var highlighCanvas = new fabric.Canvas('c3',{
        width: 0,
        height: 0
})

//hide this canvas for now
$("div").has("#c3").css('display','none');   


//start point
function setScreenshotUrl(url){
    globalContext =canvas2.getContext('2d');
    htmlImg.src = url;
	pugImg.onload = function (img) {  
    var pug = new fabric.Image(pugImg, {
        width: window.screen.width,
        height: window.screen.height,
        originX:'left',
        originY: 'top',
        left: 0,
        top: 0,
        selectable: false,
        hasControls: false,
        hasRotatingPoint: false,
        lockMovementX:true,
        lockMovementY: true,
        objectCaching: true
    });
    canvas2.setBackgroundImage(pug, canvas2.renderAll.bind(canvas2));
    }; 
    pugImg.src = url;
    canvas2.add(crop);
}

function removeBtn(){
    $("#drawBtn").css('display','none');
    $("#dwnBtn").css('display','none');
    $("#undoBtn").css('display','none');
    $("#redoBtn").css('display','none');
    $("#textBtn").css('display','none');
    $("#censorBtn").css('display','none');
    $("#arrBtn").css('display','none');
    $("#rectBtn").css('display','none');
    $("#hlBtn").css('display','none');
}


//canvas2 event listener

canvas2.on('object:moving',(e) =>{
    function boudning(e){
    if(e.target.type == 'rect' && e.target.id =='clipRect1'){
            $('#toolBar').css('display','none');;
            var obj = e.target;
            if(obj.currentHeight > obj.canvas.height || obj.currentWidth > obj.canvas.width){
                return;
            }        
            obj.setCoords();        
            // top-left  corner
            if(obj.getBoundingRect().top < 0 || obj.getBoundingRect().left < 0){
                obj.top = Math.max(obj.top, obj.top-obj.getBoundingRect().top);
                obj.left = Math.max(obj.left, obj.left-obj.getBoundingRect().left);
            }
            // bot-right corner
            if(obj.getBoundingRect().top+obj.getBoundingRect().height  > obj.canvas.height || obj.getBoundingRect().left+obj.getBoundingRect().width  > obj.canvas.width){
                obj.top = Math.min(obj.top, obj.canvas.height-obj.getBoundingRect().height+obj.top-obj.getBoundingRect().top);
                obj.left = Math.min(obj.left, obj.canvas.width-obj.getBoundingRect().width+obj.left-obj.getBoundingRect().left);
            }
       }
    }
    boudning(e);
});

canvas2.on('object:selected', function(e){
    if(e.target.type == 'rect' && e.target.id == 'clipRect1'){
         $('#toolBar').css('display','inline');
        updateButton(e.target.oCoords.tr.x, e.target.oCoords.tr.y);
    }
});


canvas2.on('object:scaling',function(e){
    var minWidth = 1;
    var minHeight = 1;
    if(e.target.type == 'rect' && e.target.id == 'clipRect1')
    {
        if(drawingEnable){
            started =false;
        }
      
        $('#toolBar').css('display','none');
        console.log('scaling');
        var obwidth = e.target.width;
        var obheight = e.target.height;
        var newWidth = Math.round(obwidth*e.target.scaleX);
        var newHeight = Math.round(obheight*e.target.scaleY);
        if(newHeight<minHeight || newWidth<minWidth){
            clipRect1.set({width: minWidth, height:minHeight, scaleY: 1, scaleX:1});
            canvas2.clipTo = function(ctx){
                ctx.rect(clipRect1.left,clipRect1.top, minWidth, minHeight);
            }
        }else{
             clipRect1.set({width: newWidth, height:newHeight, scaleY: 1, scaleX:1});
            canvas2.clipTo = function(ctx){
                ctx.rect(clipRect1.left,clipRect1.top, newWidth, newHeight);
            }
        }
        if(hlMode || drawMode){
            highlighCanvas.setWidth(clipRect1.width)
            highlighCanvas.setHeight(clipRect1.height);
            if (drawMode){
                $("div").has("#c3").css('display', 'none');
            }
            if (hlMode){
                highlighCanvas.contextTop.globalAlpha= 0.5;
                highlighCanvas.contextTop.globalCompositeOperation = 'xor';
            }
        }
        canvas2.requestRenderAll();
    }
})


canvas2.on('object:modified',function(e){
    if(e.target.type == 'rect' && e.target.id == 'clipRect1')
    {
        if(drawingEnable || censorMode || rectMode) started = true;
        $('#toolBar').css('display','inline');
        updateButton(e.target.oCoords.tr.x, e.target.oCoords.tr.y);
        if(hlMode || drawMode){
            $("div").has("#c3").css('display', '');
        }
    }
});

canvas2.on('before:selection:cleared',function(){
    canvas2.setActiveObject(clipRect1);
})

//helper functions
function addToArray(obj){
    if(pathArray.length <=20){
        pathArray.push(obj);
    }else{
        pathArray.shift();
        pathArray.push(obj);
    }
}


function addHLtoArray(){
    pathGroup.cloneAsImage(function(clone){
                clone.set({
                    left: clipRect1.left+ pathGroup.left,
                    top: clipRect1.top+ pathGroup.top,
                    selectable: false,
                    hasControls: false,
                    hasRotatingPoint: false,
                    hasControls: false,
                    objectCaching: true
                })
                canvas2.add(clone);
                addToArray(clone);
                pathGroup = new fabric.Group();
                redoArrayHL = [];
                pathArrayHL = [];
                highlighCanvas.clear();
                highlighCanvas.isDrawingMode = false;
                highlighCanvas.add(pathGroup);
            })
}

function updateButton(x,y) {
    // if(clipRect1.width+34 >= window.screen.width){
    //      $('#toolBar').css({'left':clipRect1.left-34, 'top':y, 'display':'flex'});
    // }
    if(x+34 >= window.screen.width){
        $('#toolBar').css({'left':clipRect1.left-34, 'top':y, 'display':'block'});
    }else{
        $('#toolBar').css({'left':x, 'top':y, 'display':'block'});
    }
    checkButton();
}


function addDownloadBtn(){
		$("#dwnBtn").remove();
		var dwnBtn = '<div class = \"btn\" id=\"dwnBtn\"  style="height: 24px; width: 24px; margin-top: 3px;padding: 5px"><img src="downloadicon.png"</div>'
		$('#toolBar').append(dwnBtn);
}

function addDrawBtn(){
        $("#drawBtn").remove();
        var drawBtn = '<div class ="btn" id=\"drawBtn\" style="cursor:pointer; height:24px; width: 24px; border-color: red; text-align:center;margin-top: 3px;padding: 5px"> <img src = "res/capture_icon_doodle.png"></div>'
        $('#toolBar').append(drawBtn);
}
function addHighBtn(){
    $('#hlBtn').remove();
    var hlBtn = '<div class = \"btn\" id=\"hlBtn\" style="cursor:pointer;height: 24px; width: 24px; text-align:center; margin-top: 3px;padding: 5px"><img src="res/capture_icon_paint.png"></div>'
    $('#toolBar').append(hlBtn);
}


function addCensorBtn(){
    $('#censorBtn').remove();
    var censorBtn = '<div class = \"btn\" id=\"censorBtn\" style="cursor:pointer;height: 24px; width: 24px;text-align:center;margin-top: 3px;padding: 5px"><img src="res/capture_icon_censored.png"></div>'
    $('#toolBar').append(censorBtn);
}

function addTextBtn(){
    $('#textBtn').remove();
    var textBtn = '<div class = \"btn\" id=\"textBtn\" style="cursor:pointer;height: 24px; width: 24px; text-align:center;margin-top: 3px;padding: 5px"><img src = "res/capture_icon_text.png"></div>'
    $('#toolBar').append(textBtn);
}

function addRectBtn(){
    $('#rectBtn').remove();
    var rectBtn = '<div class = \"btn\" id=\"rectBtn\" style="cursor:pointer;height: 24px; width: 24px; text-align:center;margin-top: 3px;padding: 5px"><img src="res/capture_icon_rec.png"></div>'
    $('#toolBar').append(rectBtn);
}

function addArrowBtn(){
        $("#arrBtn").remove();
        var arrBtn = '<div class = \"btn\" id=\"arrBtn\"  style="cursor:pointer;height: 24px; width: 24px;text-align:center; margin-top: 3px;padding: 5px"><img src ="res/capture_icon_arrow.png"></div>'
        $('#toolBar').append(arrBtn);
}

function addUndoBtn(){
    $('#undoBtn').remove();
    var undoBtn = '<div class = \"btn\" id=\"undoBtn\" style="cursor:pointer;height: 24px, width: 24px;text-align:center;margin-top: 3px;padding: 5px"><img src="res/capture_icon_redo.png" style="transform: scaleX(-1)"/></div>'
    $('#toolBar').append(undoBtn);
}
function addRedoBtn(){
    $('#redoBtn').remove();
    if(redoArray.length > 0){
    var redoBtn = '<div class = \"btn\" id=\"redoBtn\" style="cursor:pointer;height: 24px, width: 24px;text-align:center;margin-top: 3px; margin-bottom: 3px; padding: 5px"><img src="res/capture_icon_redo.png"></div>'
    $('#toolBar').append(redoBtn);
    }
}


var pathGroup = new fabric.Group();
highlighCanvas.add(pathGroup);


$(document).ready(function() {
  $(".canvas-container").css("position","absolute");
});


$(document).on('click','#dwnBtn',function(){
    canvas2.clipTo =null;
    clipRect1.set({fill: 'black',
    globalCompositeOperation:'destination-in'});
    chrome.downloads.download({url:canvas2.toDataURL({
        left: clipRect1.left,
        top: clipRect1.top,
        width: clipRect1.width,
        height: clipRect1.height
    }), saveAs: true}, function(){
      setTimeout(window.close, 500);
    });
    canvas2.clipTo = function(ctx){
        ctx.rect(clipRect1.left,clipRect1.top, clipRect1.width, clipRect1.height);
    }
    clipRect1.set({fill: 'transparent',
    globalCompositeOperation:'source-over'});
});



highlighCanvas.on('path:created',function(e){
    e.path.hasControls = false;
    e.path.hasBorders = false;
    e.path.selectable =false;
    if (hlMode){
        e.path.globalCompositeOperation = 'xor';
        e.path.opacity = 0.5
        console.log(e);
        highlighCanvas.remove(e.path);
        e.path.clone(function(clone){
            pathGroup.addWithUpdate(clone);
            if (pathArrayHL.length <= 20){
                pathArrayHL.push(clone);
            }
            else{
                pathArrayHL.shift();
                pathArrayHL.push(clone);
            }
        })
        highlighCanvas.requestRenderAll();
        return
    }
    if (drawMode){
        e.path.clone(function(clone){
            clone.left= e.path.left+ clipRect1.left //offset
            clone.top = e.path.top + clipRect1.top
            clone.selectable = false
            clone.hasBorders = false
            clone.hasControls = false
            canvas2.add(clone);
            addToArray(clone);
        })
        highlighCanvas.remove(e.path);
    }
    
})


$(document).on('click','#undoBtn',function(){
    if(hlMode){
        if(pathArrayHL.length ==0){
            if (pathArray.length ==0) return
            var removeE = pathArray.pop();
            console.log(pathArray);
            canvas2.remove(removeE);
            redoArray.push(removeE);
            undoInHL++;
            canvas2.requestRenderAll();
        }else{
            var removeE = pathArrayHL.pop();
            pathGroup.removeWithUpdate(removeE);
            redoArrayHL.push(removeE);
            highlighCanvas.requestRenderAll();
        }   
    }else{
        if (pathArray.length ==0) return
        var removeE = pathArray.pop();
        canvas2.remove(removeE);
        redoArray.push(removeE);
        canvas2.requestRenderAll();
    }
    checkButton();
})

$(document).on('click','#redoBtn',function(){
    if (hlMode){
        if (undoInHL>0){
            undoInHL--;
            var redoE = redoArray.pop();
            if(redoE.id == 'censorImg')
            {   
                canvas2.add(redoE);
                canvas2.moveTo(redoE,0);
            }else{
                canvas2.add(redoE)
            }
            addToArray(redoE);
            checkButton();
            return;
        }
        if(redoArrayHL.length == 0){
            if (redoArray.length == 0)
                return;
            var redoE = redoArray.pop();
            if(redoE.id == 'censorImg')
            {   
                canvas2.add(redoE);
                canvas2.moveTo(redoE,0);
            }else{
                canvas2.add(redoE)
            }
            addToArray(redoE);
            checkButton();
            return
        }
        var redoE = redoArrayHL.pop();
        highlighCanvas.add(redoE);
        pathArrayHL.push(redoE);
        pathGroup.addWithUpdate(redoE);
    }else{
        var redoE = redoArray.pop();
        if(redoE.id == 'censorImg')
        {   
            canvas2.add(redoE);
            canvas2.moveTo(redoE,0);
        }else{
            canvas2.add(redoE)
        }
        addToArray(redoE);
    }
    checkButton();
})


$(document).on('click','#drawBtn',function(){
    if (hlMode){
        addHLtoArray();
        $("div").has("#c3").css('display','none');
        highlighCanvas.freeDrawingBrush.width =3;
        highlighCanvas.freeDrawingBrush.color = 'red'
        highlighCanvas.isDrawingMode =true
        drawArrow =false;
        censorMode =false;
        rectMode = false;
        hlMode = false;
        drawingEnable =true
        drawMode = true;
        textMode= false;
        $("#drawBtn > img").attr("src", "res/capture_icon_doodle_selected.png");
    }else{
        highlighCanvas.isDrawingMode = !highlighCanvas.isDrawingMode
        highlighCanvas.freeDrawingBrush.width =3;
        highlighCanvas.freeDrawingBrush.color = 'red'
        if (highlighCanvas.isDrawingMode){
            $("#drawBtn > img").attr("src", "res/capture_icon_doodle_selected.png");
            $("div").has("#c3").css('display','');
            $("div").has("#c3").css('position','absolute');
            $("div").has("#c3").css('left', clipRect1.left);
            $("div").has("#c3").css('top', clipRect1.top);
            highlighCanvas.setWidth(clipRect1.width-2)
            highlighCanvas.setHeight(clipRect1.height-2);
            drawArrow =false;
            censorMode =false;
            rectMode = false;
            hlMode = false;
            drawingEnable =true
            drawMode = true;
            textMode= false;
        }else
            {
                $("div").has("#c3").css('display','none');
                highlighCanvas.clear();
                drawingEnable = false;
                drawMode = false;
                clipRect1.selectable =true;
                clipRect1.lockMovementX =false;
                clipRect1.lockMovementY = false;
                $("#drawBtn > img").attr("src", "res/capture_icon_doodle.png");
            }
    }
    canvas2.requestRenderAll();
    checkButton();
});


$(document).on('click', '#textBtn', function(){
   if (hlMode || drawMode){
        if(hlMode)
            addHLtoArray();
        hlMode = false;
        drawMode =false;
        $("div").has("#c3").css('display','none');
    }
    textMode = !textMode;
    if(textMode){
        $("#textBtn > img").attr("src", "res/capture_icon_text_selected.png");
        drawingEnable =true;
        censorMode = false;
        rectMode = false
        drawArrow = false
        canvas2.isDrawingMode = false
        clipRect1.selectable =false;
        clipRect1.lockMovementX =true;
        clipRect1.lockMovementY = true;
    }else{
        $("#textBtn > img").attr("src", "res/capture_icon_text.png");
        clipRect1.selectable = true;
        clipRect1.lockMovementX =false;
        clipRect1.lockMovementY = false
        drawingEnable = false;
      
    }
    checkButton();
});

$(document).on('click','#censorBtn',function(){
     if (hlMode || drawMode){
        if(hlMode) addHLtoArray();
        hlMode = false;
        drawMode =false;
        $("div").has("#c3").css('display','none');
    }
    censorMode = !censorMode;
    if(censorMode){
        $("#censorBtn > img").attr("src", "res/capture_icon_censored_selected.png");
        clipRect1.selectable =false;
        clipRect1.lockMovementX =true;
        clipRect1.lockMovementY = true;
        drawArrow = false;
        textMode =false;
        drawMode = false;
        drawingEnable = true;
        rectMode =false
    }else {
         $("#censorBtn > img").attr("src", "res/capture_icon_censored.png");
        clipRect1.selectable = true;
        clipRect1.lockMovementX =false;
        clipRect1.lockMovementY = false
        drawingEnable = false;
    }
   checkButton();
})

$(document).on('click','#rectBtn',function(){
    if (hlMode || drawMode){
        if(hlMode) addHLtoArray();
        hlMode = false;
        drawMode =false;
        $("div").has("#c3").css('display','none');
    }
    rectMode = !rectMode;
    if(rectMode){
        $("#rectBtn > img").attr("src", "res/capture_icon_rec_selected.png");
        drawingEnable = true;
        clipRect1.selectable =false;
        clipRect1.lockMovementX =true;
        clipRect1.lockMovementY = true;
        drawArrow = false;
        censorMode = false;
        textMode = false;
        drawMode = false;
    }else {
        $("#rectBtn > img").attr("src", "res/capture_icon_rec.png");
        drawingEnable = false;
        clipRect1.selectable = true;
        clipRect1.lockMovementX =false;
        clipRect1.lockMovementY = false
    }
    checkButton()
})


$(document).on('click',"#arrBtn",function(){
   if (hlMode || drawMode){
        if(hlMode) addHLtoArray();
        hlMode = false;
        drawMode =false;
        $("div").has("#c3").css('display','none');
    }
    drawArrow = !drawArrow;
    if(drawArrow){
         $("#arrBtn > img").attr("src", "res/capture_icon_arrow_selected.png");
        drawingEnable =true;
        clipRect1.selectable =false;
        clipRect1.lockMovementX =true;
        clipRect1.lockMovementY = true;
        censorMode = false;
        rectMode = false;
        textMode = false;
        drawMode = false;
    }else {
        $("#arrBtn > img").attr("src", "res/capture_icon_arrow.png");
        drawingEnable = false
        clipRect1.selectable = true;
        clipRect1.lockMovementX =false;
        clipRect1.lockMovementY = false
    }
    checkButton();
})


$(document).on('click',"#hlBtn",function(){
    undoInHL = 0;
    drawMode = false;
    highlighCanvas.isDrawingMode = !highlighCanvas.isDrawingMode;
    if(highlighCanvas.isDrawingMode){
        $("div").has("#c3").css('display','');
        $("div").has("#c3").css('position','absolute');
        $("div").has("#c3").css('left', clipRect1.left);
        $("div").has("#c3").css('top', clipRect1.top);
        highlighCanvas.setWidth(clipRect1.width)
        highlighCanvas.setHeight(clipRect1.height);
        $("#hlBtn > img").attr("src", "res/capture_icon_paint_selected.png");
        hlMode = true
        highlighCanvas.freeDrawingBrush.color = 'red'; 
        highlighCanvas.freeDrawingBrush.width = 10;
        highlighCanvas.contextTop.globalAlpha= 0.5;
        highlighCanvas.contextTop.globalCompositeOperation = 'xor';
        censorMode = false;
        drawArrow = false;
        drawingEnable =true;
        textMode = false;
        rectMode =false;
    }else {
            addHLtoArray();
            $("div").has("#c3").css('display','none');
            highlighCanvas.setWidth(0);
            highlighCanvas.setHeight(0);
            hlMode = false
            drawingEnable = false;
            canvas2.renderAll();
            canvas2.setActiveObject(clipRect1);
            $("#hlBtn > img").attr("src", "res/capture_icon_paint.png");
    } 
    checkButton();
})


fabric.IText.prototype.mouseMoveHandler = function(options){
    if (!this.__isMousedown || !this.isEditing) {
        return;
      }
    var pointer = canvas2.getPointer(options.e);
    console.log(this);
    this.set({
        left : pointer.x - this.width/2,
        top: pointer.y - 20
    })
    this.restartCursorIfNeeded();
    canvas2.requestRenderAll();
}

$(document).keyup(function(e) {
     if (e.keyCode == 27) { // escape key maps to keycode `27`
        window.close();
    }
});

canvas2.on('mouse:down', (e) => mousedown(e));
canvas2.on('mouse:move', (e) => mousemove(e));
canvas2.on('mouse:up', (e) => mouseup(e));

var started = false;
var line, rect;
var forClip = false;
var clipX, clipY;
var isEditing = false


function mousedown(e) {
    var pointer = canvas2.getPointer(e.e);
    clipX = pointer.x;
    clipY = pointer.y
    if ((e.target == null || e.target.id != 'clipRect1') && drawingEnable == false && forClip == false){
        canvas2.remove(clipRect1);
        clipRect1.set({left: clipX , top: clipY , width: 0, height: 0});
        canvas2.clipTo = function(ctx){
            ctx.rect(clipRect1.left, clipRect1.top, clipRect1.width, clipRect1.height);
        }
        forClip = true
        canvas2.renderAll();
        return;
    }
    if(textMode && e.target == null){
        return false;
    }else if( textMode && e.target.id == 'textBox'){
        console.log('text here');
        return false
    }else if(textMode && e.target.id != 'textBox' && isEditing){
        isEditing =false;
        canvas2.setActiveObject(clipRect1);
    }else if(textMode && e.target.id !='textBox'  && !isEditing){
        var textBox = new fabric.IText("",{
            left: pointer.x-20,
            top: pointer.y-20,
            selectable:true,
            hasControls: false,
            id: 'textBox'
        });
        textBox.on('editing:entered',function(){
            this.hoverCursor ='move';
            isEditing =true;
        })
        textBox.on('editing:exited',function (e) {
            if(textBox.text ==""){
                canvas2.remove(textBox);
                return false;
            }else{
                  textBox.set({selectable: false});
                }
            });
        canvas2.add(textBox)
        addToArray(textBox)
        textBox.enterEditing();
        canvas2.setActiveObject(textBox);
    }
    
 
    if(drawArrow){
        canvas2.selection = false;
        canvas2.clipTo = function(ctx){
            ctx.rect(clipRect1.left, clipRect1.top,clipRect1.width,clipRect1.height);
        }
        started = true;
       
        var points = [ pointer.x, pointer.y, pointer.x, pointer.y ];
        line = new fabric.LineArrow(points, {
              strokeWidth: 5,
              fill: 'red',
              stroke: 'red',
              originX: 'center',
              originY: 'center',
              hasBorders: false,
              hasControls: false,
              selectable: false,
              objectCaching: false,
              selection: false
        });
        canvas2.add(line); 
        canvas2.requestRenderAll();
    }
    if(censorMode || rectMode){
     canvas2.clipTo = function(ctx){
            ctx.rect(clipRect1.left, clipRect1.top,clipRect1.width,clipRect1.height);
        }
    var mouse = canvas2.getPointer(e.e);
    started = true;
    x = mouse.x;
    y = mouse.y;

    var square = new fabric.Rect({ 
        width: 0, 
        height: 0, 
        left: x, 
        top: y, 
        fill: 'transparent',
        hasRotatingPoint: false,
        selectable: false,
        hasControls: false,
        hasBorders: false,
        strokeWidth: 5,
        stroke: 'red'
    });
        if(censorMode){
            square.set({id: 'censor', stroke:'blue'});
            canvas2.add(square)
            canvas2.setActiveObject(square); 
            canvas2.bringToFront(clipRect1);
        }else{
            canvas2.add(square);
            canvas2.setActiveObject(square);
            canvas2.bringToFront(clipRect1);
        }
    }
}


/* Mousemove */
function mousemove(e) {
    var pointer = canvas2.getPointer(e.e);
    if(forClip){
        var w = Math.abs(pointer.x - clipX),
        h = Math.abs(pointer.y - clipY);
        if(clipX > pointer.x && clipY > pointer.y){
            clipRect1.set({left:pointer.x, top: pointer.y, width: w, height: h})
        }
        else if (clipX > pointer.x && clipY < pointer.y)
        {
            clipRect1.set({left: pointer.x, top: clipY, width: w, height: h});
        }else if (clipX < pointer.x && clipY > pointer.y) {
            clipRect1.set({left:clipX, top: pointer.y, width: w, height: h});
        } else{
            clipRect1.set({width: w, height: h});
        }    
    }
    if(drawArrow && started){ 
        line.set({x2: pointer.x, y2: pointer.y });
        line.setCoords();
        canvas2.renderAll();
    }else if(started && (censorMode || rectMode)) {
        var w = Math.abs(pointer.x - x),
        h = Math.abs(pointer.y - y);
        var square = canvas2.getActiveObject(); 
        if(x > pointer.x && y > pointer.y)
            square.set({left:pointer.x, top: pointer.y, width: w, height: h})
        else if (x > pointer.x && y < pointer.y)
        {
            square.set({left: pointer.x, top: clipY, width: w, height: h});
        }else if (x < pointer.x && y > pointer.y) {
            square.set({left:clipX, top: pointer.y, width: w, height: h});
        } else{
            square.set({width: w, height: h});
        }   
        canvas2.requestRenderAll();
     }
}

/* Mouseup */
function mouseup(e) {
    var pointer = canvas2.getPointer(e.e);
    if(forClip){
        forClip = false;
        canvas2.add(clipRect1);
        canvas2.setActiveObject(clipRect1);
        canvas2.clipTo = function(ctx){
            ctx.rect(clipRect1.left, clipRect1.top, clipRect1.width, clipRect1.height);
        }
        canvas2.renderAll();
        addToolBar();
    }
    if(drawArrow){
        if (started) started =false;
        addToArray(line);
        canvas2.selection = true;
        return
    }
    if (censorMode || rectMode){
        if(started) {
            started = false;
        }
        var square = canvas2.getActiveObject();
        if(square.id == 'clipRect1') return;
        if (censorMode){
            var tempC = document.createElement('canvas');
            tempC.width = square.width;
            tempC.height =square.height;
            var tempCtx = tempC.getContext('2d');
            tempCtx.drawImage(htmlImg, square.left, square.top, square.width, square.height, 0, 0, square.width, square.height);
            fabric.Image.fromURL(tempC.toDataURL(), function(img){
                img.filters.push(new fabric.Image.filters.Pixelate({
                        blocksize: 3
                    }));
                img.set({
                    left: square.left,
                    top: square.top,
                    width: square.width,
                    height: square.height,
                    selectable: false,
                    hasControls:false,
                    hasBorders: false,
                    lockMovementX:true,
                    lockMovementY:true,
                    id: 'censorImg',
                    objectCaching: true
                })
                img.applyFilters();
                canvas2.add(img)
                canvas2.moveTo(img,0);
                addToArray(img);
            })
             canvas2.remove(square);
             canvas2.setActiveObject(clipRect1);
        }else{
            addToArray(square);
            canvas2.setActiveObject(clipRect1);
        }
    
    }
}



function addToolBar() {
    addDownloadBtn();
    addDrawBtn();
    addHighBtn();
    addCensorBtn();
    addTextBtn();
    addRectBtn()
    addArrowBtn();
    addUndoBtn();
    addRedoBtn();
}


/// Arrow class ////

fabric.LineArrow = fabric.util.createClass(fabric.Line, {

  type: 'lineArrow',

  initialize: function(element, options) {
    options || (options = {});
    this.callSuper('initialize', element, options);
  },

  toObject: function() {
    return fabric.util.object.extend(this.callSuper('toObject'));
  },

  _render: function(ctx) {

    this.callSuper('_render', ctx);

    // do not render if width/height are zeros or object is not visible
    if (this.width === 0 || this.height === 0 || !this.visible) return;

    ctx.save();

    var xDiff = this.x2 - this.x1;
    var yDiff = this.y2 - this.y1;
    var angle = Math.atan2(yDiff, xDiff);
    ctx.translate((this.x2 - this.x1) / 2, (this.y2 - this.y1) / 2);
    ctx.rotate(angle);
    ctx.beginPath();
    //move 10px in front of line to start the arrow so it does not have the square line end showing in front (0,0)
    ctx.moveTo(10, 0);
    ctx.lineTo(-20, 15);
    ctx.lineTo(-20, -15);
    ctx.closePath();
    ctx.fillStyle = this.stroke;
    ctx.fill();

    ctx.restore();
  }
});

fabric.LineArrow.fromObject = function(object, callback) {
  callback && callback(new fabric.LineArrow([object.x1, object.y1, object.x2, object.y2], object));
};

canvas2.on('mouse:right', function(e){
    textMode = false;
    drawingEnable = false;
    drawArrow = false;
    rectMode = false;
    censorMode = false;
    forClip =false
    if(hlMode || drawMode){
            highlighCanvas.isDrawingMode = false;
            if(hlMode){
             addHLtoArray();
            }
            $("div").has("#c3").css('display','none');
            highlighCanvas.setWidth(0)
            highlighCanvas.setHeight(0);
            canvas2.renderAll();
            hlMode = false;
            drawMode = false;
    }
    clipRect1.selectable =true;
    clipRect1.lockMovementX =false;
    clipRect1.lockMovementY = false
    checkButton();
})

window.addEventListener("contextmenu", function(e) { e.preventDefault();
    canvas2.fire('mouse:right', {});
})

fabric.LineArrow.async = true;
fabric.Textbox.prototype.selectable = false;
fabric.Group.prototype.hasControls = false
fabric.Group.prototype.selectable = false;
fabric.Group.prototype.hasBorders = false;
fabric.Object.prototype.objectCaching = true;

function checkButton(){
    if(!rectMode){
        $("#rectBtn > img").attr("src", "res/capture_icon_rec.png");
    }
    if(!hlMode) {
        $("#hlBtn > img").attr("src", "res/capture_icon_paint.png");
        redoArrayHL = [];   
    }
    if(!drawArrow) $("#arrBtn > img").attr("src", "res/capture_icon_arrow.png");
    if(!drawMode) $("#drawBtn > img").attr("src", "res/capture_icon_doodle.png");
    if(!censorMode) $("#censorBtn > img").attr("src", "res/capture_icon_censored.png");
    if(!textMode) $("#textBtn > img").attr("src","res/capture_icon_text.png");
    if(redoArray.length >0 || redoArrayHL.length >0){
        $('#redoBtn').remove();
        var redoBtn = '<div class = \"btn\" id=\"redoBtn\" style="cursor:pointer;height: 24px, width: 24px;text-align:center;margin-top: 3px; margin-bottom: 3px; padding: 5px"><img src="res/capture_icon_redo.png"></div>'
        $('#toolBar').append(redoBtn);
    }else{
        $('#redoBtn').remove();
    }
    canvas2.setActiveObject(clipRect1);
};