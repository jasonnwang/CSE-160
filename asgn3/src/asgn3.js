// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform int u_whichTexture;

  void main() {

    if (u_whichTexture == -2) {
      gl_FragColor = u_FragColor;

    } else if (u_whichTexture == -1) {
      gl_FragColor = vec4(v_UV, 1.0, 1.0);

    } else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    
    } else if (u_whichTexture == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);

    } else if (u_whichTexture == 2) {
      gl_FragColor = texture2D(u_Sampler2, v_UV);
    
    } else {
      gl_FragColor = vec4(1,.2,.2,1);
    }

  } `

// Global Variables
let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix;
let u_whichTexture;
let u_Sampler0; // sky texture
let u_Sampler1; // ground/grass texture
let u_Sampler2; // stone texture
let camera;

let g_globalAngle = 5;
let g_targetBlock = [0, 0];

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
    return;
  }

  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }

  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  }

  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if (!u_whichTexture) {
    console.log('Failed to get the storage location of u_whichTexture');
    return;
  }

  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if (!u_Sampler0) {
    console.log('Failed to get the storage location of u_Sampler0');
    return;
  }

  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  if (!u_Sampler1) {
    console.log('Failed to get the storage location of u_Sampler1');
    return;
  }

  u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
  if (!u_Sampler2) {
    console.log('Failed to get the storage location of u_Sampler2');
    return;
  }

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

function initTextures() {
  var image = new Image();  // Create the image object
  if (!image) {
    console.log('Failed to create the image object');
    return false;
  }
  // Register the event handler to be called on loading an image
  image.onload = function () { sendImageToTEXTURE0(image); };
  // Tell the browser to load an image
  image.src = 'sky.jpg';

  return true;
}

function initFloorTexture() {
  var image = new Image();
  if (!image) {
    console.log('Failed to create the image object');
    return false;
  }
  image.onload = function () { sendImageToTEXTURE1(image); };
  image.src = 'grass.jpg';
  return true;
}

function initStoneTexture() {
  var image = new Image();
  if (!image) {
    console.log('Failed to create the image object');
    return false;
  }
  image.onload = function () { sendImageToTEXTURE2(image); };
  image.src = 'stone.png';
  return true;
}

function sendImageToTEXTURE0(image) {
  var texture = gl.createTexture();   // Create a texture object
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  // Enable texture unit0
  gl.activeTexture(gl.TEXTURE0);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  // Set the texture unit 0 to the sampler
  gl.uniform1i(u_Sampler0, 0);

  gl.clear(gl.COLOR_BUFFER_BIT);   // Clear <canvas>

  //gl.drawArrays(gl.TRIANGLE_STRIP, 0, n); // Draw the rectangle
}

function sendImageToTEXTURE1(image) {
  var texture = gl.createTexture();   // Create a texture object
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  // Enable texture unit0
  gl.activeTexture(gl.TEXTURE1);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  // Set the texture unit 1 to the sampler
  gl.uniform1i(u_Sampler1, 1);

  gl.clear(gl.COLOR_BUFFER_BIT);   // Clear <canvas>

  //gl.drawArrays(gl.TRIANGLE_STRIP, 0, n); // Draw the rectangle
}

function sendImageToTEXTURE2(image) {
  var texture = gl.createTexture();   // Create a texture object
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  // Enable texture unit0
  gl.activeTexture(gl.TEXTURE2);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  // Set the texture unit 1 to the sampler
  gl.uniform1i(u_Sampler2, 2);

  gl.clear(gl.COLOR_BUFFER_BIT);   // Clear <canvas>

  //gl.drawArrays(gl.TRIANGLE_STRIP, 0, n); // Draw the rectangle
}

function addActionsForHtmlUI() {
  document.getElementById('angleSlide').addEventListener('mousemove', function () { g_globalAngle = this.value; renderAllShapes(); });

  // Enable pointer lock when clicking the canvas
  canvas.addEventListener('click', function () {
    canvas.requestPointerLock();
  });

  // Handle mouse movement for camera rotation
  document.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement === canvas) {
      camera.onMouseMove(event);
    }
  });
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsForHtmlUI();

  camera = new Camera(canvas);
  document.onkeydown = keydown;

  //canvas.addEventListener('mousemove', (event) => { camera.onMouseMove(event); });

  initTextures();
  initFloorTexture();
  initStoneTexture();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  requestAnimationFrame(tick);
  //renderAllShapes();
}

var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now() / 1000.0 - g_startTime;

function tick() {
  g_seconds = performance.now() / 1000.0 - g_startTime;
  //updateAnimationAngles();
  renderAllShapes();
  requestAnimationFrame(tick);
}


function keydown(ev) {
  const speed = 0.2;
  const alpha = 5;
  switch (ev.keyCode) {
    case 87: // W
      camera.moveForward(speed);
      break;
    case 83: // S
      camera.moveBackward(speed);
      break;
    case 65: // A
      camera.moveLeft(speed);
      break;
    case 68: // D
      camera.moveRight(speed);
      break;
    case 81: // Q
      camera.panLeft(alpha);
      break;
    case 69: // E
      camera.panRight(alpha);
      break;
    case 80: // P - Place a block
      modifyBlock(1);
      break;
    case 79: // O - Remove a block
      modifyBlock(-1);
      break;
  }
  renderAllShapes();
}

// Initialize the map with zeros (empty space)
var g_map = Array(32).fill().map(() => Array(32).fill(0));

// Fill borders with height 4 (walls)
for (let i = 0; i < 32; i++) {
  g_map[0][i] = 4;        // Top border
  g_map[31][i] = 4;       // Bottom border
  g_map[i][0] = 4;        // Left border
  g_map[i][31] = 4;       // Right border
}

// Stone structure with pillar
for (let i = 10; i < 15; i++) {
  g_map[i][14] = 3;  // Top wall of height 3
}
for (let i = 10; i < 15; i++) {
  if (i === 12) {
    g_map[i][10] = 0;      // Door (gap)
    g_map[i][11] = 0;      // Door (gap) - second block
    g_map[i][12] = 3;      // Top block of the door
  } else {
    g_map[i][10] = 3;      // Regular wall
  }
}
for (let j = 10; j < 15; j++) {
  g_map[10][j] = 3;  // Left wall of height 3
}
for (let j = 10; j < 15; j++) {
  g_map[14][j] = 3;  // Right wall of height 3
}

// Stone Pyramid
// Base Layer (7x7) - Height 1
for (let i = 25; i < 32; i++) {
  for (let j = 25; j < 32; j++) {
    g_map[i][j] = 1;
  }
}
// Second Layer (5x5) - Height 2
for (let i = 26; i < 31; i++) {
  for (let j = 26; j < 31; j++) {
    g_map[i][j] = 2;
  }
}
// Third Layer (3x3) - Height 3
for (let i = 27; i < 30; i++) {
  for (let j = 27; j < 30; j++) {
    g_map[i][j] = 3;
  }
}
// Top Layer (1x1) - Height 4 (Peak)
g_map[28][28] = 4;

// Generate random stone structures
function addRandomStones(count) {
  for (let k = 0; k < count; k++) {
    // Random size between 1x1 and 3x3
    let size = Math.floor(Math.random() * 2) + 1;
    // Random height between 1 and 3
    let height = Math.floor(Math.random() * 3) + 1;
    // Random position, avoiding edges
    let x = Math.floor(Math.random() * (32 - size - 2)) + 1;
    let y = Math.floor(Math.random() * (32 - size - 2)) + 1;

    // Check for collision with existing structures
    let canPlace = true;
    for (let i = x; i < x + size; i++) {
      for (let j = y; j < y + size; j++) {
        if (g_map[i][j] !== 0) canPlace = false;
      }
    }
    if (canPlace) {
      for (let i = x; i < x + size; i++) {
        for (let j = y; j < y + size; j++) {
          g_map[i][j] = height;
        }
      }
    }
  }
}

// Add 25 random stone structures
addRandomStones(25);

function drawMap(vertices, uvs) {
  for (let x = 0; x < 32; x++) {
    for (let y = 0; y < 32; y++) {
      let height = g_map[x][y];

      if (height > 0) {
        for (let h = 0; h < height; h++) {
          var cube = new Cube();
          cube.textureNum = 2;
          cube.color = [1.0, 1.0, 1.0, 1.0];
          cube.matrix.translate(x - 16, -1 + h, y - 16);
          cube.addToBatch(vertices, uvs);
        }
      }
    }
  }
}

function drawBatch(vertices, uvs, textureNum) {
  var vertexBuffer = gl.createBuffer();
  var uvBuffer = gl.createBuffer();

  // Set vertex data
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  // Set UV data
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_UV);

  // Set the texture number
  gl.uniform1i(u_whichTexture, textureNum);

  // Draw all cubes in one call
  gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);
}



function renderAllShapes() {
  var startTime = performance.now();

  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);
  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);

  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const mapVertices = [];
  const mapUVs = [];
  const floorVertices = [];
  const floorUVs = [];
  const skyVertices = [];
  const skyUVs = [];

  drawMap(mapVertices, mapUVs);

  // Draw the floor
  var floor = new Cube();
  floor.color = [1.0, 0.0, 0.0, 1.0];
  floor.textureNum = 1;
  floor.matrix.translate(0, -.75, 0.0);
  floor.matrix.scale(32, 0, 32);
  floor.matrix.translate(-0.5, 0, -0.5);
  floor.addToBatch(floorVertices, floorUVs);

  // Drawthe sky
  var sky = new Cube();
  sky.color = [1.0, 0.0, 0.0, 1.0];
  sky.textureNum = 0;
  sky.matrix.scale(50, 50, 50);
  sky.matrix.translate(-0.5, -0.5, -0.5);
  sky.addToBatch(skyVertices, skyUVs);

  drawBatch(mapVertices, mapUVs, 2);    // Map (stone texture)
  drawBatch(floorVertices, floorUVs, 1); // Floor (grass texture)
  drawBatch(skyVertices, skyUVs, 0); // Sky (sky texture)

  var duration = performance.now() - startTime;
  sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(10000 / duration) / 10, "numdot");
}

function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log('Failed to get ' + htmlID + ' from HTML');
    return;
  }
  htmlElm.innerHTML = text;
}