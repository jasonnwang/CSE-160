// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
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
let u_ModelMatrix;
let u_GlobalRotateMatrix;

let g_headAngle = 0;
let g_tailAngle = 0;
let g_tailTipAngle = 0;

let g_frontLegAngle = 0;
let g_backLegAngle = 0;
let g_frontLowerLegAngle = 0; 
let g_backLowerLegAngle = 0;

let g_globalAngle = 5;

let g_headAnimation = false;
let g_tailAnimation = false;
let g_runningAnimation = false;

function setupWebGL(){
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  gl.enable(gl.DEPTH_TEST);
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

  // Get the storage location of u_ModelMatrix
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  // Get the storage location of u_GlobalRotateMatrix
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

// Set up actions for HTML UI elements
function addActionsForHtmlUI(){
  // Button events
  document.getElementById('animationHeadOffButton').onclick = function() {g_headAnimation = false;};
  document.getElementById('animationHeadOnButton').onclick = function() {g_headAnimation = true;};

  document.getElementById('animationTailOffButton').onclick = function() {g_tailAnimation = false;};
  document.getElementById('animationTailOnButton').onclick = function() {g_tailAnimation = true;};
  
  document.getElementById('animationRunOffButton').onclick = function() {g_runningAnimation = false;};
  document.getElementById('animationRunOnButton').onclick = function() {g_runningAnimation = true;};
  
  // Slider events
  document.getElementById('headSlide').addEventListener('mousemove', function() { g_headAngle = this.value; renderAllShapes(); });
  document.getElementById('tailSlide').addEventListener('mousemove', function() { g_tailAngle = this.value; renderAllShapes(); });
  document.getElementById('tailTipSlide').addEventListener('mousemove', function() { g_tailTipAngle = this.value; renderAllShapes(); });
  
  document.getElementById('frontLegSlide').addEventListener('mousemove', function() { 
    g_frontLegAngle = this.value; 
    if (!g_runningAnimation) g_frontLowerLegAngle = -this.value/2; // Default lower leg bend
    renderAllShapes(); 
  });
  document.getElementById('backLegSlide').addEventListener('mousemove', function() { 
    g_backLegAngle = this.value; 
    if (!g_runningAnimation) g_backLowerLegAngle = -this.value/2; // Default lower leg bend
    renderAllShapes(); 
  });
  document.getElementById('angleSlide').addEventListener('mousemove', function() { g_globalAngle = this.value; renderAllShapes(); });
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsForHtmlUI();
  gl.clearColor(0.8, 0.8, 1.0, 1.0); // Light blue background
  requestAnimationFrame(tick);
}

var g_startTime = performance.now()/1000.0;
var g_seconds=performance.now()/1000.0-g_startTime;

function tick() {
  g_seconds = performance.now()/1000.0 - g_startTime;
  updateAnimationAngles();
  renderAllShapes();
  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
  if (g_headAnimation) {
    g_headAngle = (20*Math.sin(g_seconds));
  }
  if (g_tailAnimation) {
    g_tailAngle = (-15*Math.sin(3*g_seconds));
    g_tailTipAngle = (10 * Math.sin(4 * g_seconds));
  }
  
  // Running animation - natural dog gait
  if (g_runningAnimation) {
    const speed = 5;
    const time = g_seconds * speed;
    
    // Front legs animation - opposite phase from back legs
    g_frontLegAngle = 25 * Math.sin(time);
    // Lower legs follow upper legs with delay and increased bend when moving backward
    g_frontLowerLegAngle = -15 * Math.sin(time - 0.2) - 20;
    // Back legs - opposite phase of front legs
    g_backLegAngle = 30 * Math.sin(time + Math.PI);
    // Back lower legs also have a delay and increased bend
    g_backLowerLegAngle = -20 * Math.sin(time + Math.PI - 0.2) - 20;

    g_headAngle = (20*Math.sin(g_seconds));
    g_tailAngle = (-15*Math.sin(3*g_seconds));
    g_tailTipAngle = (10 * Math.sin(4 * g_seconds));
  }
}

function renderAllShapes(){
  var startTime = performance.now();

  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var body = new Cube();
  body.color = [0.6, 0.4, 0.2, 1.0]; // Brown color for dog body
  body.matrix.translate(-0.3, -0.1, -0.1);
  body.matrix.scale(0.60, 0.3, 0.3);
  body.render();

  // Draw the head
  var head = new Cube();
  head.color = [0.65, 0.45, 0.2, 1.0]; // Slightly lighter brown for head
  head.matrix.setTranslate(0.3, 0.05, -0.05);
  head.matrix.rotate(g_headAngle, 0, 1, 0); // Head rotation control
  var headCoordMat = new Matrix4(head.matrix);
  head.matrix.scale(0.2, 0.2, 0.2);
  head.render();

  // Draw snout
  var snout = new Cube();
  snout.color = [0.7, 0.5, 0.25, 1.0];
  snout.matrix = new Matrix4(headCoordMat);
  snout.matrix.translate(0.12, -0.025, 0.025);
  snout.matrix.scale(0.1, 0.1, 0.15);
  snout.render();

  // Draw ears (left)
  var earLeft = new Cube();
  earLeft.color = [0.5, 0.3, 0.15, 1.0];
  earLeft.matrix = new Matrix4(headCoordMat);
  earLeft.matrix.translate(0.0, 0.05, 0.2);
  earLeft.matrix.scale(0.08, 0.15, 0.04);
  earLeft.render();

  // Draw ears (right)
  var earRight = new Cube();
  earRight.color = [0.5, 0.3, 0.15, 1.0];
  earRight.matrix = new Matrix4(headCoordMat);
  earRight.matrix.translate(0.0, 0.05, -0.05);
  earRight.matrix.scale(0.08, 0.15, 0.045);
  earRight.render();

  // Draw the base of the tail
  var tailBase = new Cube();
  tailBase.color = [0.6, 0.4, 0.2, 1.0];
  tailBase.matrix.setTranslate(-0.35, 0.05, 0.0);
  tailBase.matrix.rotate(g_tailAngle, 0, 0, 1); // Base tail rotation
  var tailBaseCoordMat = new Matrix4(tailBase.matrix);
  tailBase.matrix.scale(0.2, 0.06, 0.06);
  tailBase.matrix.translate(-0.5, 0, 0);
  tailBase.render();

  // Draw the tip of the tail
  var tailTip = new Cube();
  tailTip.color = [0.6, 0.4, 0.2, 1.0];
  tailTip.matrix = new Matrix4(tailBaseCoordMat);
  tailTip.matrix.translate(-0.15, 0.0, 0.0); // Attach at end of base
  tailTip.matrix.rotate(g_tailTipAngle, 0, 0, 1); // Slightly smaller swing for tip
  tailTip.matrix.scale(0.15, 0.05, 0.05);
  tailTip.matrix.translate(-0.5, 0, 0.05);
  tailTip.render();


  // Front Left Leg
  // Upper leg
  var frLegUpper = new Cube();
  frLegUpper.color = [0.55, 0.35, 0.15, 1.0];
  frLegUpper.matrix.setTranslate(0.15, -0.2, 0.1);
  frLegUpper.matrix.rotate(g_frontLegAngle, 0, 0, 1); // Upper leg rotation
  var frLegCoordMat = new Matrix4(frLegUpper.matrix);
  frLegUpper.matrix.scale(0.08, 0.15, 0.08);
  frLegUpper.render();
  
  // Lower leg - now with its own rotation
  var frLegLower = new Cube();
  frLegLower.color = [0.55, 0.35, 0.15, 1.0];
  frLegLower.matrix = new Matrix4(frLegCoordMat);
  frLegLower.matrix.translate(0, -0.1, 0);
  frLegLower.matrix.rotate(g_frontLowerLegAngle, 0, 0, 1); // Lower leg can bend independently
  frLegLower.matrix.scale(0.08, 0.12, 0.08);
  frLegLower.render();

  // Front Right Leg
  // Upper leg
  var flLegUpper = new Cube();
  flLegUpper.color = [0.55, 0.35, 0.15, 1.0];
  flLegUpper.matrix.setTranslate(0.15, -0.2, -0.1);
  flLegUpper.matrix.rotate(g_frontLegAngle, 0, 0, 1); // Upper leg rotation
  var flLegCoordMat = new Matrix4(flLegUpper.matrix);
  flLegUpper.matrix.scale(0.08, 0.15, 0.08);
  flLegUpper.render();
  
  // Lower leg - with independent rotation
  var flLegLower = new Cube();
  flLegLower.color = [0.55, 0.35, 0.15, 1.0];
  flLegLower.matrix = new Matrix4(flLegCoordMat);
  flLegLower.matrix.translate(0, -0.1, 0);
  flLegLower.matrix.rotate(g_frontLowerLegAngle, 0, 0, 1); // Lower leg can bend independently
  flLegLower.matrix.scale(0.08, 0.12, 0.08);
  flLegLower.render();

  // Back Left Leg
  // Upper leg
  var brLegUpper = new Cube();
  brLegUpper.color = [0.55, 0.35, 0.15, 1.0];
  brLegUpper.matrix.setTranslate(-0.25, -0.2, 0.1);
  brLegUpper.matrix.rotate(g_backLegAngle, 0, 0, 1); // Upper leg rotation
  var brLegCoordMat = new Matrix4(brLegUpper.matrix);
  brLegUpper.matrix.scale(0.08, 0.15, 0.08);
  brLegUpper.render();
  
  // Lower leg - with independent rotation
  var brLegLower = new Cube();
  brLegLower.color = [0.55, 0.35, 0.15, 1.0];
  brLegLower.matrix = new Matrix4(brLegCoordMat);
  brLegLower.matrix.translate(0, -0.1, 0);
  brLegLower.matrix.rotate(g_backLowerLegAngle, 0, 0, 1); // Lower leg can bend independently
  brLegLower.matrix.scale(0.08, 0.12, 0.08);
  brLegLower.render();

  // Back Right Leg
  // Upper leg
  var blLegUpper = new Cube();
  blLegUpper.color = [0.55, 0.35, 0.15, 1.0];
  blLegUpper.matrix.setTranslate(-0.25, -0.2, -0.1);
  blLegUpper.matrix.rotate(g_backLegAngle, 0, 0, 1); // Upper leg rotation
  var blLegCoordMat = new Matrix4(blLegUpper.matrix);
  blLegUpper.matrix.scale(0.08, 0.15, 0.08);
  blLegUpper.render();
  
  // Lower leg - with independent rotation
  var blLegLower = new Cube();
  blLegLower.color = [0.55, 0.35, 0.15, 1.0];
  blLegLower.matrix = new Matrix4(blLegCoordMat);
  blLegLower.matrix.translate(0, -0.1, 0);
  blLegLower.matrix.rotate(g_backLowerLegAngle, 0, 0, 1); // Lower leg can bend independently
  blLegLower.matrix.scale(0.08, 0.12, 0.08);
  blLegLower.render();

  var duration = performance.now() - startTime;
  sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot");
}

function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}