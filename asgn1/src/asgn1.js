// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_Size;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  } `

// Globlal Variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let isDragging = false;

function setupWebGL(){
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
}

function connectVariablesToGLSL(){
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
}

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

let g_selectedColor;
let g_selectedSize;
let g_selectedType = POINT;
let g_selectedSegmentCount;
let g_prevPoint = null;

// Set up actions for HTML UI elements
function addActionsForHtmlUI(){

  // Set default values based on the current slider positions
  g_selectedColor = [
    parseFloat(document.getElementById('redSlider').value) / 100,
    parseFloat(document.getElementById('greenSlider').value) / 100,
    parseFloat(document.getElementById('blueSlider').value) / 100,
    1.0
  ];
  g_selectedSize = parseFloat(document.getElementById('sizeSlider').value);
  g_selectedSegmentCount = parseInt(document.getElementById('segmentSlider').value); 

  //document.getElementById('green').onclick = function() { g_selectedColor = [0.0,1.0,0.0,1.0]; };
  //document.getElementById('red').onclick = function() { g_selectedColor = [1.0,0.0,0.0,1.0]; };
  document.getElementById('clear').onclick = function() {g_shapesList = []; renderAllShapes();};

  document.getElementById('pointButton').onclick = function() {g_selectedType = POINT};
  document.getElementById('triButton').onclick = function() {g_selectedType = TRIANGLE};
  document.getElementById('cirButton').onclick = function() {g_selectedType = CIRCLE};

  document.getElementById('redSlider').addEventListener('mouseup', function() { g_selectedColor[0] = this.value/100; })
  document.getElementById('greenSlider').addEventListener('mouseup', function() { g_selectedColor[1] = this.value/100;})
  document.getElementById('blueSlider').addEventListener('mouseup', function() { g_selectedColor[2] = this.value/100;})

  document.getElementById('sizeSlider').addEventListener('mouseup', function() { g_selectedSize = this.value; })
  document.getElementById('segmentSlider').addEventListener('input', function() { g_selectedSegmentCount = this.value; });
  
  document.getElementById('showDrawingButton').onclick = showDrawing;
}

function main() {
 
  setupWebGL();
  connectVariablesToGLSL();

  // Set up actions for HTML UI elements
  addActionsForHtmlUI();

  // Register function (event handler) to be called on a mouse press
canvas.onmousedown = function(ev) {
  isDragging = true;
  click(ev); // also calls interpolation
};

canvas.onmousemove = function(ev) {
  if (isDragging) {
    click(ev); // fills between previous and current point
  }
};

canvas.onmouseup = function(ev) {
  isDragging = false;
  g_prevPoint = null; // reset prev point on mouse release
};

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}

/*
var g_points = [];  // The array for the position of a mouse press
var g_colors = [];  // The array to store the color of a point
var g_sizes = [];
*/

var g_shapesList = [];

function click(ev) {
  let [x, y] = convertCoordinatesEventToGL(ev);
  let newPoint = [x, y];

  // Only interpolate if dragging
  if (isDragging && g_prevPoint) {
    let [x0, y0] = g_prevPoint;
    let dx = x - x0;
    let dy = y - y0;
    let distance = Math.sqrt(dx * dx + dy * dy);
    let steps = Math.ceil(distance / 0.02);

    for (let i = 1; i <= steps; i++) {
      let interpX = x0 + (dx * i / steps);
      let interpY = y0 + (dy * i / steps);

      let shape = createShape([interpX, interpY]);
      g_shapesList.push(shape);
    }
  } else {
    // Just a single click — add one shape
    let shape = createShape(newPoint);
    g_shapesList.push(shape);
  }

  g_prevPoint = newPoint;
  renderAllShapes();
}

function createShape(position) {
  let shape;
  if (g_selectedType == POINT) {
    shape = new Point();
  } else if (g_selectedType == TRIANGLE) {
    shape = new Triangle();
  } else {
    shape = new Circle();
    shape.segments = g_selectedSegmentCount;
  }

  shape.position = position;
  shape.color = g_selectedColor.slice();
  shape.size = g_selectedSize;

  return shape;
}


function convertCoordinatesEventToGL(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return([x,y]);
}

function renderAllShapes(){
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  var len = g_shapesList.length;

  for(var i = 0; i < len; i++) {

    g_shapesList[i].render();

  }
}

function showDrawing() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  // === SKY ===
  gl.uniform4f(u_FragColor, 0.6, 0.85, 1.0, 1.0);
  drawTriangle([-1, 0, 1, 0, -1, 1]);
  drawTriangle([1, 0, 1, 1, -1, 1]);

  // === FENCE (gray strip) ===
  gl.uniform4f(u_FragColor, 0.8, 0.8, 0.8, 1.0);
  drawTriangle([-1, 0, 1, 0, -1, 0.15]);
  drawTriangle([1, 0, 1, 0.15, -1, 0.15]);

  // === GROUND ===
  gl.uniform4f(u_FragColor, 0.2, 0.5, 0.3, 1.0);
  drawTriangle([-1, -1, 1, -1, -1, 0]);
  drawTriangle([1, -1, 1, 0, -1, 0]);

  // === PAINTED KEY AREA (orange outer) ===
  gl.uniform4f(u_FragColor, 1.0, 0.5, 0.3, 1.0);
  drawTriangle([-0.4, -0.7, 0.4, -0.7, -0.4, -0.05]);
  drawTriangle([0.4, -0.7, 0.4, -0.05, -0.4, -0.05]);

  // === Key white border
  gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);
  drawTriangle([-0.36, -0.66, 0.36, -0.66, -0.36, -0.09]);
  drawTriangle([0.36, -0.66, 0.36, -0.09, -0.36, -0.09]);

  // === Key orange inner again
  gl.uniform4f(u_FragColor, 1.0, 0.5, 0.3, 1.0);
  drawTriangle([-0.34, -0.64, 0.34, -0.64, -0.34, -0.11]);
  drawTriangle([0.34, -0.64, 0.34, -0.11, -0.34, -0.11]);

  // === HOOP POLE ===
  gl.uniform4f(u_FragColor, 0.2, 0.2, 0.2, 1.0);
  drawTriangle([-0.03, -0.09, 0.03, -0.09, -0.03, 0.325]);
  drawTriangle([0.03, -0.09, 0.03, 0.325, -0.03, 0.325]);

  // === BACKBOARD ===
  gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);
  drawTriangle([-0.15, 0.2, 0.15, 0.2, -0.15, 0.4]);
  drawTriangle([0.15, 0.2, 0.15, 0.4, -0.15, 0.4]);

  // === INNER RED OUTLINE ON BACKBOARD ===
  gl.uniform4f(u_FragColor, 1.0, 0.2, 0.2, 1.0);
  drawTriangle([-0.05, 0.22, 0.05, 0.22, -0.05, 0.32]);
  drawTriangle([0.05, 0.22, 0.05, 0.32, -0.05, 0.32]);

  // === INNER WHITE BOX ON BACKBOARD ===
  gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);
  drawTriangle([-0.04, 0.23, 0.04, 0.23, -0.04, 0.31]);
  drawTriangle([0.04, 0.23, 0.04, 0.31, -0.04, 0.31]);

  // === RIM ===
  gl.uniform4f(u_FragColor, 1.0, 0.2, 0.2, 1.0);
  drawTriangle([-0.04, 0.19, 0.04, 0.19, -0.04, 0.215]);
  drawTriangle([0.04, 0.19, 0.04, 0.215, -0.04, 0.215]);
}