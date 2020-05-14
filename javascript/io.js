const path = require('path');
const XLSX = require('xlsx');

//TODO: Rewrite read functionality for non-node environments
var excelFile = XLSX.readFile(path.join(__dirname,'../assets/excel/Urban.xlsx'));
var worksheet = excelFile.Sheets['Sheet1'];
var headers_text = new Object();
var requirements = [];
var totalArea = 0;
var possible_shapes = ['circle','square','rectangle','trapezium','triangle'];
var renderedShapes = [];
var fixedShapes = [];
var unfixedShapes = [];
var shapes = [];
var shapesNodes = new Object();

const parseExcelFile = ()=>{
    //console.log(worksheet);
    var startCell = XLSX.utils.decode_cell(worksheet['!ref'].split(":")[0]);
    var endCell = XLSX.utils.decode_cell(worksheet['!ref'].split(":")[1]);
    endCell.c = 3;
    headers_text.type = worksheet[XLSX.utils.encode_cell({'c':0,'r':startCell.r})].v;
    headers_text.subtype = worksheet[XLSX.utils.encode_cell({'c':1,'r':startCell.r})].v;
    headers_text.area = worksheet[XLSX.utils.encode_cell({'c':2,'r':startCell.r})].v;
    headers_text.count = worksheet[XLSX.utils.encode_cell({'c':3,'r':startCell.r})].v;
    headers_text.requiredShape = "Required Shaped";
    var lastType;
    var lastColor;
    var colorCount = 0;
    for (r=startCell.r+1;r<=endCell.r;r++){
        var requirement = new Object();
        if (!worksheet[XLSX.utils.encode_cell({'c':3,'r':r})])
            continue;
        if (!worksheet[XLSX.utils.encode_cell({'c':0,'r':r})]){
            requirement.type = lastType;
            //requirement.color = lastColor;
        }else{
            requirement.type = worksheet[XLSX.utils.encode_cell({'c':0,'r':r})].v;
            //requirement.color = ColourValues[colorCount++];
            lastType = requirement.type;
            //lastColor = requirement.color;
        }
        requirement.subtype = worksheet[XLSX.utils.encode_cell({'c':1,'r':r})].v;
        requirement.area = worksheet[XLSX.utils.encode_cell({'c':2,'r':r})].v;
        requirement.count = worksheet[XLSX.utils.encode_cell({'c':3,'r':r})].v;
        requirement.color = ColourValues[colorCount++];
        if (colorCount>=ColourValues.length)
            colorCount = 0;
        requirement.generated = false;
        requirement.requiredShape = 'circle';
        totalArea += requirement.area;
        requirements.push(requirement);
    }
    console.log("Parsed headers text",headers_text);
    console.log("Parsed requirements",requirements);
    console.log("Start",startCell,"end",endCell);
    console.log("Total required Area",totalArea,"sqm")
    //console.log(XLSX.utils.decode_cell(startCell));
};

const constructShapes = () => {
    for (i in requirements)
        generate_shapes(requirements[i]);
    shapes.sort((a,b)=>{
        return a.area>b.area ? -1 : 1;
    });
    //shapes[0].center = {x:0, y:0};
    for (i in shapes){
        shapes[i].radius = Math.sqrt(shapes[i].area/Math.PI);
        //console.log(shapes[i].area,shapes[i].color,shapes[i].radius,shapes[i].requirement.subtype);
    }
    generatePossibleOverallShape();
    //printTreeNodes(shapesNodes);
}

const getTreeNode = (node,nodeId) =>{
    if (node.id==nodeId)
        return node;
    for (i in node.edges){
        var n = getTreeNode(node.edges[i],nodeId);
        if (n)
            return n;
    }
    return null;
}

const getTreeNodeDependantIdList = (node) =>{
    var results = [node.id];
    for (i in node.edges){
        var temp = getTreeNodeDependantIdList(node.edges[i]);
        results = results.concat(temp);
    }
    return results;
}

const printTreeNodes = (node)=>{
    if (node.edges.length==0)
        return;
    var s = "[";
    for (i in node.edges){
        s+=" "+node.edges[i].id+" ";
    }
    s+="]";
    console.log("Node",node.id,"has",node.edges.length,"children :",s);
    for (i in node.edges){
        printTreeNodes(node.edges[i]);
    }
}

const generatePossibleOverallShape = ()=>{
    fixedShapes = [];
    unfixedShapes = [];
    shapes[0].center = {x:0, y:0};
    fixedShapes.push({'id':shapes[0].id,'center':shapes[0].center,'radius':shapes[0].radius,'area':shapes[0].area,'color':shapes[0].color});
    shapesNodes.id = shapes[0].id;
    shapesNodes.center = shapes[0].center;
    shapesNodes.radius = shapes[0].radius;
    shapesNodes.radian = null;
    shapesNodes.edges = [];
    for (i=1; i<shapes.length; i++){
        unfixedShapes.push({'id':shapes[i].id,'radius':shapes[i].radius, 'area':shapes[i].area,'color':shapes[i].color});
    }
    var counter = 0;
    while (unfixedShapes.length>0){
        var nextShapeIndex = getRandomizedShapeBasedOnProperties(unfixedShapes,'area');
        var nextShape = unfixedShapes[nextShapeIndex];
        var attachedShapeIndex = getRandomizedShapeBasedOnProperties(fixedShapes,'area');
        var attachedShape = fixedShapes[attachedShapeIndex];
        var attachedNode = findNode(attachedShape.id,shapesNodes);
        if (attachedNode==null)
            console.error("Cant find attached Node in the treeNodes. Id : ",attachedShape.id);
        var radian = Math.random()*2*Math.PI;
        var length = nextShape.radius+attachedShape.radius;
        var nextShapeCenterPoint = calculateCenterPoint(attachedShape.center,radian,length);
        if (!checkForIntersection(nextShapeCenterPoint,nextShape.radius)){
            //console.log("Point",nextShapeCenterPoint,"does not intersect current generate shapes");
            fixedShapes.push({'id':nextShape.id,'center':nextShapeCenterPoint,'radius':nextShape.radius,'area':nextShape.area,'color':nextShape.color});
            //unfixedShapes.pop(nextShape);
            unfixedShapes.splice(nextShapeIndex,1);
            attachedNode.edges.push({'id':nextShape.id,'center':nextShapeCenterPoint,'radius':nextShape.radius,'radian':radian,'edges':[]});
            //console.log("shapesNodes after",++counter,"round :",shapesNodes);
        }else{
            //console.log("Point",nextShapeCenterPoint,"INTERSECT current generate shapes",fixedShapes);
        }
    }
    console.log("Done generating shapes");
    print_debug();
};

const print_debug = ()=>{
    console.log("shapesNodes :", shapesNodes);
    console.log("fixedShapes :", fixedShapes);
    console.log("shapes",shapes);
};

const findNode = (id,nodes) => {
    //console.log("findNode nodes : ",nodes);
    if (nodes.id==id)
        return nodes;
    else {
        var result = null;
        for (i in nodes.edges){
            result=findNode(id,nodes.edges[i]);
            if (result!=null)
                return result;
        }
    }
    return null;
}

const calculateCenterPoint = (centerPoint,radian,length) => {
    var y = centerPoint.y+length*Math.sin(radian);
    var x = centerPoint.x+length*Math.cos(radian);
    return {'x':x,'y':y};
};

const checkForIntersection = (centerPoint,radius) => {
    for (i in fixedShapes){
        var cal_length = calculateLengthBetweenTwoPoints(centerPoint,fixedShapes[i].center);
        if (cal_length<radius+fixedShapes[i].radius){
            //console.log("Intersected. Calculated length :",cal_length," sum of radii",radius+fixedShapes[i].radius);
            return true;
        }
    }
    return false;
}

const calculateLengthBetweenTwoPoints = (a,b) => {
    //console.log(a,b);
    return Math.sqrt((a.x - b.x)*(a.x - b.x) + (a.y - b.y)*(a.y - b.y));
}

const getRandomizedShapeBasedOnProperties = (arrayOfObjects,property)=>{
    var total = 0;
    for (i = 0; i< arrayOfObjects.length; i++){
        total+=arrayOfObjects[i][property];
    }
    var randomValue = Math.random()*total;
    i = 0;
    while (randomValue>arrayOfObjects[i][property]){
        randomValue -= arrayOfObjects[i++][property];
    }
    //console.log("Selected randomized object is :",arrayOfObjects[i]);
    return i;
}
const insertIntoFixedShapes = (id,x,y,radius)=>{

};

const getRelevantValues = (shape)=>{
    return {'id':shape.id,'x':shape.center.x,'y':shape.center.y,'radius':shape.radius};
};

parseExcelFile();
constructShapes();

