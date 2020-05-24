const Two = require('two.js');

var renderedShapes = [];
var currentlySelectedShape = null;

const calculate_bounds = (arrayOfShapes)=>{
    var topLeft = {'x':0,'y':0};
    var bottomRight = {'x':0,'y':0};
    var bottomLeft = {'x':0,'y':0};
    var topRight = {'x':0,'y':0};
    for (i in arrayOfShapes){
        if (arrayOfShapes[i].center.x-arrayOfShapes[i].radius<topLeft.x)
            topLeft.x = arrayOfShapes[i].center.x-arrayOfShapes[i].radius;
        if (arrayOfShapes[i].center.y+arrayOfShapes[i].radius>topLeft.y)
            topLeft.y = arrayOfShapes[i].center.y+arrayOfShapes[i].radius;
        if (arrayOfShapes[i].center.x+arrayOfShapes[i].radius>bottomRight.x)
            bottomRight.x = arrayOfShapes[i].center.x+arrayOfShapes[i].radius;
        if (arrayOfShapes[i].center.y-arrayOfShapes[i].radius<bottomRight.y)
            bottomRight.y = arrayOfShapes[i].center.y-arrayOfShapes[i].radius;
    }
    bottomLeft.x = topLeft.x;
    bottomLeft.y = bottomRight.y;
    topRight.x = bottomRight.x;
    topRight.y = topLeft.y;
    return {'topLeft':topLeft,'bottomRight':bottomRight,'topRight':topRight,"bottomLeft":bottomLeft};
}

const generateRenderedShapes = (arrayOfShapes)=>{
    console.log("Shapes generated",arrayOfShapes);
    var bounds=calculate_bounds(arrayOfShapes);
    console.log("Boundary :",bounds);
    canvasWidth = two.width;
    canvasHeight = two.height;
    canvasCenterPoint = {'x':canvasWidth/2,'y':canvasHeight/2};
    var shapeWidth = bounds.bottomRight.x-bounds.bottomLeft.x;
    var shapeHeight = bounds.topLeft.y-bounds.bottomLeft.y;
    var shapeCenterPoint = {'x':shapeWidth/2,'y':shapeHeight/2};
    var ratioWidth = canvasWidth/shapeWidth;
    var ratioHeight = canvasHeight/shapeHeight;
    //Calculate render ratio and add some padding
    renderRatio = ratioWidth>ratioHeight?ratioHeight:ratioWidth;
    renderRatio *= 0.95;
    var centerOffset = {'x':canvasCenterPoint.x-shapeCenterPoint.x*renderRatio,'y':canvasCenterPoint.y-shapeCenterPoint.y*renderRatio};
    console.log("canvasCenterPoint :",canvasCenterPoint,"shapeCenterPoint :",shapeCenterPoint,"centerOffset :",centerOffset);
    for (i in arrayOfShapes){
        // Translate the calculated shapes to rendered shapes based on canvas
        var tempCenter = {'x':arrayOfShapes[i].center.x,'y':arrayOfShapes[i].center.y}
        var shape = {'id':arrayOfShapes[i].id,'color':arrayOfShapes[i].color,'center':tempCenter,'radius':arrayOfShapes[i].radius}; 
        shape.center.x += -bounds.topLeft.x;
        shape.center.y += -bounds.topLeft.y;
        shape.center.x *= renderRatio;
        shape.center.y *= -renderRatio;
        shape.radius *= renderRatio;
        // Center Align
        shape.center.x += centerOffset.x;
        shape.center.y += centerOffset.y;
        renderedShapes.push(shape);
    }
    console.log("renderRatio : ",renderRatio);
    console.log("Shapes generated",renderedShapes);
};

const renderFrame = ()=>{
    if (shapeModified){
        renderedShapes = [];
        generateRenderedShapes(fixedShapes);
        shapeModified = false;
    }
/*     if (mainGroup.children.length>0)
        mainGroup.clear(); */
    for (i in renderedShapes){
        var shape = renderedShapes[i];
        if (!shapesList[shape.id]){
            //console.log("TWO.JS input circle :",shape.center.x,shape.center.y,shape.radius)
            var circle = two.makeCircle(shape.center.x,shape.center.y,shape.radius);
            //console.log("TWO.JS output circle :",circle);
            //console.log("Position x,y :",circle.position.x,circle.position.y);
            shapesList[shape.id]=circle;
            circle.fill = "#"+shape.color;
            circle.id = shape.id;
            mainGroup.add(circle);
        }else{
            var circle = shapesList[shape.id];
            circle.position.x = shape.center.x;
            circle.position.y = shape.center.y;
            circle.radius = shape.radius;
        }
    }
    console.log("shapelist :",shapesList);
    //mainGroup.remove(mainGroup.children);
    console.log("maingroup :",mainGroup.children);
}

const contains = (group,elemId)=>{
    return (group.children.ids[elemId])?true:false;
}

var shapeModified = true;
var shapesList = {};
var graphicDiv = document.getElementById("graphicsCanvas");
console.log("container dimensions : ",graphicDiv.offsetWidth,graphicDiv.offsetHeight);

var two = new Two({
    width:graphicDiv.offsetWidth,
    height:graphicDiv.offsetHeight,
    autostart: true
}).appendTo(document.getElementById("graphicsCanvas"));

var canvasWidth = two.width;
var canvasHeight = two.height;
var canvasCenterPoint = {'x':canvasWidth/2,'y':canvasHeight/2};
var renderRatio = null;
var mainGroup = two.makeGroup();
var splitGroup = two.makeGroup();


const highlightSelectedShape = (offsetPosition) =>{
    if (currentlySelectedShape)
        currentlySelectedShape.linewidth = 1;
    var shape = null;
    var shapeId = null;
    for (i in shapesList){
        shape = shapesList[i];
        if (calculateLengthBetweenTwoPoints(shape.position,offsetPosition)<=shape.radius){
            //console.log("2 points and radius :",shape.position,offsetPosition,shape.radius);
            shapeId=i;
            break;
        }
    }
    if (shapeId){
        shape = shapesList[shapeId];
        shape.linewidth=2;
        console.log("Clicked shape is :",shape);
        currentlySelectedShape=shape;
        for (i in shapes){
            if (shapes[i].id==shapeId)
                document.getElementById("currentSelectedText").innerHTML=shapes[i].requirement.subtype + " , " + shapes[i].area + " sqm";
        }
        console.log(getTreeNodeDependantIdList(getTreeNode(shapesNodes,shapeId)));
    }else{
        currentlySelectedShape=null;
        document.getElementById("currentSelectedText").innerHTML="Nothing Selected";
    }
}

var clicked = false;

const handleDragEvent = (event)=>{
    if (contains(mainGroup,currentlySelectedShape.id)){
        
    }
};

const bindButtons = ()=>{
    graphicDiv.onclick = (event) =>{
        console.log("Mouse Clicked event :",event);
    };
    graphicDiv.onmousedown = (event) => {
        console.log("Mouse Down event :",event);
        clicked=true;
        highlightSelectedShape({'x':event.offsetX,'y':event.offsetY});
    }
    graphicDiv.onmousemove = (event) => {
        if (clicked && currentlySelectedShape){
            console.log("Mouse Move event :",event);
            handleDragEvent(event);
        }
    }
    graphicDiv.onmouseup = (event) => {
        console.log("Mouse Up event :",event);
        clicked=false;
    }

    document.body.onresize = () => {
        console.log("Resize event found");
        two.height=graphicDiv.offsetHeight;
        two.width=graphicDiv.offsetWidth;
        canvasHeight = two.height;
        canvasWidth = two.width;
        canvasCenterPoint = {'x':canvasWidth/2,'y':canvasHeight/2};
        shapeModified=true;
    };
    document.getElementById("generateButton").onclick = ()=>{
        constructShapes();
        shapeModified = true;
    };
/*     document.getElementById("shiftLeftButton").onclick = ()=>{
        if (currentlySelectedShape){

        }
    };
    document.getElementById("shiftRightButton").onclick = ()=>{
        if (currentlySelectedShape){
            
        }
    }; */
    document.getElementById("enlargeButton").onclick = ()=>{
        if (currentlySelectedShape){
            
        }
    };
    document.getElementById("shrinkButton").onclick = ()=>{
        if (currentlySelectedShape){
            
        }
    };
}

const populateRequirementTable = () => {
    var html = "";
    html+="<thead>";
    html+="<tr>";
    html+="<th>"+headers_text.type+"</th>"+"<th>"+headers_text.subtype+"</th>"+"<th>"+headers_text.area+"</th>"+"<th>"+headers_text.count+"</th>";
    html+="</tr>";
    html+="</thead>";
    html+="<tbody>";
    html+="<tr>";
    for (i in requirements){
        var requirement = requirements[i];
        html+="<tr>";
        html+="<td>"+requirement.type+"</td>"+"<td>"+requirement.subtype+"</td>"+"<td>"+requirement.area+"</td>"+"<td>"+requirement.count+"</td>";
        html+="</tr>";
    }
    html+="</tr>";
    html+="</tbody>";
    document.getElementById("requirementTable").innerHTML=html;
}

bindButtons();
populateRequirementTable();

two.bind('update',()=>{
    if (shapeModified)
        renderFrame();
/*     shapesList[renderedShapes[0].id].position.x+=(Math.random()-0.5)*2;
    shapesList[renderedShapes[0].id].position.y+=(Math.random()-0.5)*2;  */
});

two.bind('resize',()=>{

});
