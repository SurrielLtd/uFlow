const ColourValues = [ 
    "FF0000", "00FF00", "0000FF", "FFFF00", "FF00FF", "00FFFF", "000000", 
    "800000", "008000", "000080", "808000", "800080", "008080", "808080", 
    "C00000", "00C000", "0000C0", "C0C000", "C000C0", "00C0C0", "C0C0C0", 
    "400000", "004000", "000040", "404000", "400040", "004040", "404040", 
    "200000", "002000", "000020", "202000", "200020", "002020", "202020", 
    "600000", "006000", "000060", "606000", "600060", "006060", "606060", 
    "A00000", "00A000", "0000A0", "A0A000", "A000A0", "00A0A0", "A0A0A0", 
    "E00000", "00E000", "0000E0", "E0E000", "E000E0", "00E0E0", "E0E0E0", 
];

var idcounter = 0;

const random_integer = (min,max) => {
    return Math.floor(Math.random() * (max - min) ) + min;
};

const random_element = (array) => {
    return array[Math.floor(Math.random() * array.length )];
};

const VARIANCE_FACTOR = 0.8;

const generate_areas = (totalArea,count) => {
    var remainingArea = totalArea;
    var areas = [];
    var i=0;
    while (i<count-1){
        areas[i] = Math.floor(remainingArea/(count-i));
        var r = Math.random()-0.5;
        var variance;
        if (r>0.5)
            variance = Math.floor(r*areas[i]*VARIANCE_FACTOR);
        else 
            variance = 0 - Math.floor(r*areas[i]*VARIANCE_FACTOR);
        
        // Adjust the area
        areas[i] += variance;
        remainingArea -= areas[i++];
    }
    areas[i] = remainingArea;
    areas.sort(() => Math.random() - 0.5);
    return areas;
};

const construct_geography = (object) => {
    
};

const generate_uuid = ()=>{
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c)=>{
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const generate_shapes = (requirement) => {
    //TODO: Adding support for other shapes;
    if (!requirement.shapes){
        requirement.shapes = [];
        for (i=0; i<requirement.count; i++){
            idcounter++;
            var shape = new Object();
            //shape.id = generate_uuid();
            shape.id = "node-"+idcounter;
            shape.requirement = requirement;
            requirement.shapes.push(shape);
            shapes.push(shape);
        }
    }
    areas = generate_areas(requirement.area,requirement.count);
    for (i=0; i<requirement.count; i++){
        requirement.shapes[i].area = areas[i];
        requirement.shapes[i].color = requirement.color;
        requirement.shapes[i].shapeType = requirement.requiredShape;
    }
};