const canvasID = "wgl-canvas";

const vertexShaderRaw = 
'attribute vec3 coordinates;' +
'attribute vec4 color;' +

'varying vec4 vertexColor;' +
'void main(void) {' +
    'gl_Position = vec4(coordinates, 1.0);' +
    'vertexColor = color;' +
'}';

const fragementShaderRaw = 
'precision mediump float;' +
'varying vec4 vertexColor;' +
'void main(void) {' +
    ' gl_FragColor = vertexColor;' +
'}';

const clearColor = [0.0,0.0,0.0,1.0];

// Values of the pseudoshere (TIE-Fighter Body)
const pseudosphereScale = 100;
const pseudosphereMinU = -Math.PI;
const pseudosphereMaxU = Math.PI;
const pseudosphereUResolution = 14;
const pseudosphereMinV = 0.10;
const pseudosphereMaxV = 3.05;
const pseudosphereVResolution = 10;
const pseudospherePositionOffset = [0,0,0.6];
let pseudosphereDeltaU = (pseudosphereMaxU - pseudosphereMinU) / pseudosphereUResolution;
let pseudosphereDeltaV= (pseudosphereMaxV - pseudosphereMinV) / pseudosphereVResolution;


// Values of the shere (TIE-Fighter Lense)
const sphereResolution = 16;
const sphereScale = 80;
const sphereMinU = 0;
const sphereMaxU = Math.PI *2;
const sphereMinV = 0;
const sphereMaxV = Math.PI * 2;
const spherePositionOffset = [0,0,0];
let sphereDeltaU = (sphereMaxU - sphereMinU) / sphereResolution;
let sphereDeltaV= (sphereMaxV - sphereMinV) / sphereResolution;

// Values of the left rect (TIE-Fighter left wing)
const rectHeight = 700;
const rectWidth = 15;
const leftRectPosOffset = [-305,0,0];

// Values of the right rect (TIE-Fighter left wing)
const rightRectPosOffset = [305,0,0];

const generalLineColor = [0.2,0.2,0.2,1.0];
const bodyAreaColor = [0.8,0.8,0.8,1.0];
const wingsAreaColor = [0.3,0.3,0.3,1.0];
const lenseAreaColor = [0.7,0.7,0.9,1.0];

let vertices = [];
let triangleIndices = [];
let linesIndices = [];
let colors = [];
let lineColors = [];

let canvas = document.getElementById(canvasID);
let gl = canvas.getContext('webgl');

let canvasHeight = canvas.getBoundingClientRect().height;
let canvasWidth = canvas.getBoundingClientRect().width;

let vertexBuffer = null;
let lineIndicesBuffer = null
let colorBuffer = null;
let lineColorBuffer = null;
let triangleIndicesBuffer = null;

let vertexShader = null;
let fragmentShader = null;
let program = null;
let coordinates = null;
let shaderColors = null;

let startIndex = 0;

createMeshes();
initWGL();
draw();

//console.log(canvasHeight);
//console.log(canvasWidth);

function createMeshes()
{
    createPseudosphere();
    createSphere();
    createLeftRect();
    createRightRect();
    
    //console.log(vertices);
    //console.log(linesIndices);
    //console.log(colors);
}

function getMaxIndex()
{
    return Math.max(Math.max(...linesIndices), -1) + 1;
}

function createPseudosphere()
{
    let indexOffset = getMaxIndex();
    for(let i = 0; i<=pseudosphereVResolution; i++)
    {
        for(let j = 0; j<pseudosphereUResolution; j++)
        {
            let u = pseudosphereMinU + j*pseudosphereDeltaU;
            let v = pseudosphereMinV + i*pseudosphereDeltaV;

            //Quelle http://www.3d-meier.de/tut3/Seite40.html
            let x = Math.cos(v) + Math.log(Math.tan(v/2)) * pseudosphereScale + pseudospherePositionOffset[0];
            let y = Math.cos(u) * Math.sin(v) * pseudosphereScale + pseudospherePositionOffset[1];
            let z = Math.sin(u) * Math.sin(v) + pseudospherePositionOffset[2];
            let colorOffset = 1 - (Math.sin(u) * Math.sin(v) + 1)/2;
            let col = [bodyAreaColor[0]*colorOffset, bodyAreaColor[1]*colorOffset, bodyAreaColor[2]*colorOffset, bodyAreaColor[3]];
            addVertice([x, y, z], generalLineColor, col);

            if(i < pseudosphereVResolution)
            {
                setIndices(i, j, pseudosphereUResolution, indexOffset);
            }
        }
    }
}

function createSphere()
{
    let indexOffset = getMaxIndex();
    for(let i = 0; i<=sphereResolution; i++)
    {
        for(let j = 0; j<sphereResolution; j++)
        {
            let u = sphereMinU + j*sphereDeltaU;
            let v = sphereMinV + i*sphereDeltaV;

            //Quelle http://www.3d-meier.de/tut3/Seite31.html
            let x = sphereScale * Math.sin(u) * Math.sin(v) + spherePositionOffset[0];
            let y = sphereScale * Math.cos(u) * Math.sin(v) + spherePositionOffset[1];
            let z = Math.cos(v) + spherePositionOffset[2];
            let colorOffset = 1 - (Math.cos(v) + 1)/2;
            let col = [lenseAreaColor[0]*colorOffset, lenseAreaColor[1]*colorOffset, lenseAreaColor[2]*colorOffset, lenseAreaColor[3]];
            addVertice([x, y, z], generalLineColor, col);

            if(i < sphereResolution)
            {
                setIndices(i, j, sphereResolution, indexOffset);
            }
            
        }
    }
    startIndex += (sphereResolution + 1)* sphereResolution;
}

function createLeftRect()
{
    createWing(leftRectPosOffset);
}

function createRightRect()
{
    createWing(rightRectPosOffset);
}

function createWing(offset)
{
    let dX = rectWidth /2;
    let dY = rectHeight /2;

    addVertice([offset[0]-dX,offset[1]-dY, 0], generalLineColor, wingsAreaColor);
    addVertice([offset[0]+dX,offset[1]-dY, 0], generalLineColor, wingsAreaColor);
    addVertice([offset[0]-dX,offset[1]+dY, 0], generalLineColor, wingsAreaColor);
    addVertice([offset[0]+dX,offset[1]+dY, 0], generalLineColor, wingsAreaColor);
    setIndices(0, 0, 2, getMaxIndex());
}

//Defines lines and triangles of an rectangle
function setIndices(i, j, jMax, indexOffset)
{
    let index1 = i*jMax+j+indexOffset;
    let index2 = i*jMax+(j+1)%jMax+indexOffset;
    let index3 = (i+1)*jMax+(j+1)%jMax+indexOffset;
    let index4 = (i+1)*jMax+j+indexOffset;

    // Line 1
    linesIndices.push(index1);
    linesIndices.push(index2);
    // Line 2
    linesIndices.push(index2);
    linesIndices.push(index3);
    // Line 3
    linesIndices.push(index3);
    linesIndices.push(index4);
    // Line 4
    linesIndices.push(index4);
    linesIndices.push(index1);

    //Triangle 1
    triangleIndices.push(index1);
    triangleIndices.push(index2);
    triangleIndices.push(index3);

    //Triangle 2
    triangleIndices.push(index1);
    triangleIndices.push(index3);
    triangleIndices.push(index4);
}

function degreeToRadians(degrees)
{
    return degrees * (Math.PI / 180);
}

function addVertice(coords, lineColor, areaColor)
{
    let x = coords[0]/canvasWidth;
    let y = coords[1]/canvasHeight;
    let z = coords[2];
    point = [x, y, z];
    vertices = vertices.concat(point);
    addColor(lineColor, areaColor);
}

function addColor(lineColor, areaColor)
{
    colors = colors.concat(areaColor);
    lineColors = lineColors.concat(lineColor);
}


function initWGL()
{
    initBuffers();
    initShader();
    initProgram();
    bindCoordinates();
    bindColors();
    initView();
}

function initBuffers()
{
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    lineColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, lineColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineColors), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    triangleIndicesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleIndicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangleIndices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    lineIndicesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineIndicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(linesIndices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}

function initShader()
{
    vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderRaw);
    gl.compileShader(vertexShader);

    fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragementShaderRaw);
    gl.compileShader(fragmentShader);

    //console.log(vertexShaderRaw);
    //console.log(fragementShaderRaw);
}

function initProgram()
{
    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);
}

function bindCoordinates()
{
    //Lines
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    coordinates = gl.getAttribLocation(program, "coordinates");
    gl.vertexAttribPointer(coordinates, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(coordinates);
}

function bindColors()
{
    //Color
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    shaderColors = gl.getAttribLocation(program, "color");
    gl.vertexAttribPointer(shaderColors, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shaderColors);
}

function initView()
{
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0,0,canvas.width,canvas.height);
}

function draw()
{
    // Drawing triangles
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleIndicesBuffer);
    gl.drawElements(gl.TRIANGLES, triangleIndices.length, gl.UNSIGNED_SHORT,0);

    // Drawing lines
    gl.bindBuffer(gl.ARRAY_BUFFER, lineColorBuffer);
    shaderColors = gl.getAttribLocation(program, "color");
    gl.vertexAttribPointer(shaderColors, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shaderColors);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineIndicesBuffer);
    gl.drawElements(gl.LINES, linesIndices.length, gl.UNSIGNED_SHORT,0);
}