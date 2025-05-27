// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec3 v_NormalDir;
  varying vec3 v_LightDir;
  varying vec3 v_FragPos;
  varying float v_Lighting;
  uniform vec3 u_LightPos;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
    v_Normal = a_Normal;

    vec4 worldPos = u_ModelMatrix * a_Position;
    v_FragPos = worldPos.xyz;
    v_LightDir = normalize(u_LightPos - vec3(worldPos));
    v_NormalDir = normalize(mat3(u_ModelMatrix) * a_Normal);
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec3 v_NormalDir;
  varying vec3 v_LightDir;
  varying vec3 v_FragPos;
  uniform vec3 u_CameraPos;
  uniform vec3 u_LightColor;
  uniform vec3 u_LightPos;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform int u_whichTexture;
  uniform bool u_NormalToggle;
  uniform bool u_LightingOn;
  uniform bool u_SpotlightOn;
  uniform vec3 u_SpotLightPos;
  uniform vec3 u_SpotDirection;
  uniform vec3 u_SpotColor;
  uniform float u_SpotCutoff;
  uniform float u_SpotExponent;

  void main() {

    if (u_NormalToggle) {
      gl_FragColor = vec4((v_Normal+1.0)/2.0, 1.0);
    } else {
      float nDotL = max(dot(normalize(v_NormalDir), normalize(v_LightDir)), 0.0);
      vec4 baseColor;

      if (u_whichTexture == -2) {
        baseColor = u_FragColor;
      } else if (u_whichTexture == -1) {
        baseColor = vec4(v_UV, 1.0, 1.0);
      } else if (u_whichTexture == 0) {
        baseColor = texture2D(u_Sampler0, v_UV);
      } else if (u_whichTexture == 1) {
        baseColor = texture2D(u_Sampler1, v_UV);
      } else if (u_whichTexture == 2) {
        baseColor = texture2D(u_Sampler2, v_UV);
      } else {
        baseColor = vec4(1.0, 0.2, 0.2, 1.0);
      }

      if (!u_LightingOn) {
        gl_FragColor = baseColor;
      } else {
        vec3 ambient = 0.25 * baseColor.rgb;

        vec3 L1 = normalize(v_LightDir);
        float nDotL1 = max(dot(normalize(v_NormalDir), L1), 0.0);
        vec3 diffuse1 = baseColor.rgb * nDotL1 * u_LightColor;
        vec3 viewDir = normalize(u_CameraPos - v_FragPos);
        vec3 reflectDir1 = reflect(-L1, normalize(v_NormalDir));
        float spec1 = pow(max(dot(viewDir, reflectDir1), 0.0), 16.0);
        vec3 specular1 = vec3(0.2) * spec1 * u_LightColor;

        vec3 diffuse2 = vec3(0.0);
        vec3 specular2 = vec3(0.0);
        if (u_SpotlightOn) {
          vec3 L2 = normalize(u_SpotLightPos - v_FragPos);
          float nDotL2 = max(dot(normalize(v_NormalDir), L2), 0.0);
          vec3 reflectDir2 = reflect(-L2, normalize(v_NormalDir));
          float spec2 = pow(max(dot(viewDir, reflectDir2), 0.0), 16.0);

          float spotCos = dot(normalize(-u_SpotDirection), L2);
          
          if (spotCos > u_SpotCutoff) {
            float spotFactor = pow(spotCos, u_SpotExponent);
            diffuse2 = baseColor.rgb * nDotL2 * u_SpotColor * spotFactor;
            specular2 = vec3(0.2) * spec2 * u_SpotColor * spotFactor;
          }
        }

      vec3 finalColor = ambient + diffuse1 + specular1 + diffuse2 + specular2;
      gl_FragColor = vec4(finalColor, baseColor.a);
      }
    }
  }`;

// Global Variables
let canvas;
let gl;
let a_Position;
let a_UV;
let a_Normal;

let u_NormalToggle;
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

let u_LightPos;
let u_CameraPos;
let camera;

let g_normalOn = false;
let g_lightPos = [0, 12, 0];
let g_globalAngle = 5;
let g_lightAngle = 0;

let g_lightColor = [1.0, 1.0, 1.0];
let g_lightingOn = true;
let u_LightColor;
let u_LightingON;

let g_spotlightOn = true;
let g_spotlightPos = [-5, 10, 0];

let u_SpotlightOn;
let u_SpotLightPos;
let u_SpotDirection;
let u_SpotColor;
let u_SpotCutoff;
let u_SpotExponent;

let g_lightDragging = false;
let g_targetBlock = [0, 0];

function setupWebGL() {
  canvas = document.getElementById("webgl");
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.log("Failed to get the rendering context for WebGL");
    return;
  }
  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log("Failed to initialize shaders.");
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, "a_Position");
  if (a_Position < 0) {
    console.log("Failed to get the storage location of a_Position");
    return;
  }

  a_UV = gl.getAttribLocation(gl.program, "a_UV");
  if (a_UV < 0) {
    console.log("Failed to get the storage location of a_UV");
    return;
  }

  a_Normal = gl.getAttribLocation(gl.program, "a_Normal");
  if (a_Normal < 0) {
    console.log("Failed to get the storage location of a_Normal");
    return;
  }

  u_NormalToggle = gl.getUniformLocation(gl.program, "u_NormalToggle");
  if (!u_NormalToggle) {
    console.log("Failed to get the storage location of u_NormalToggle");
    return;
  }

  u_LightPos = gl.getUniformLocation(gl.program, "u_LightPos");
  if (!u_LightPos) {
    console.log("Failed to get the storage location of u_LightPos");
    return;
  }

  u_CameraPos = gl.getUniformLocation(gl.program, "u_CameraPos");
  if (!u_CameraPos) {
    console.log("Failed to get the storage location of u_CameraPos");
  }

  u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
  if (!u_FragColor) {
    console.log("Failed to get the storage location of u_FragColor");
    return;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  if (!u_ModelMatrix) {
    console.log("Failed to get the storage location of u_ModelMatrix");
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(
    gl.program,
    "u_GlobalRotateMatrix"
  );
  if (!u_GlobalRotateMatrix) {
    console.log("Failed to get the storage location of u_GlobalRotateMatrix");
    return;
  }

  u_ViewMatrix = gl.getUniformLocation(gl.program, "u_ViewMatrix");
  if (!u_ViewMatrix) {
    console.log("Failed to get the storage location of u_ViewMatrix");
    return;
  }

  u_ProjectionMatrix = gl.getUniformLocation(gl.program, "u_ProjectionMatrix");
  if (!u_ProjectionMatrix) {
    console.log("Failed to get the storage location of u_ProjectionMatrix");
    return;
  }

  u_whichTexture = gl.getUniformLocation(gl.program, "u_whichTexture");
  if (!u_whichTexture) {
    console.log("Failed to get the storage location of u_whichTexture");
    return;
  }

  u_Sampler0 = gl.getUniformLocation(gl.program, "u_Sampler0");
  if (!u_Sampler0) {
    console.log("Failed to get the storage location of u_Sampler0");
    return;
  }

  u_Sampler1 = gl.getUniformLocation(gl.program, "u_Sampler1");
  if (!u_Sampler1) {
    console.log("Failed to get the storage location of u_Sampler1");
    return;
  }

  u_Sampler2 = gl.getUniformLocation(gl.program, "u_Sampler2");
  if (!u_Sampler2) {
    console.log("Failed to get the storage location of u_Sampler2");
    return;
  }

  u_LightColor = gl.getUniformLocation(gl.program, "u_LightColor");
  if (!u_LightColor) {
    console.log("Failed to get the storage location of u_LightColor");
  }

  u_LightingOn = gl.getUniformLocation(gl.program, "u_LightingOn");
  if (!u_LightingOn) {
    console.log("Failed to get the storage location of u_LightingOn");
  }

  u_SpotlightOn = gl.getUniformLocation(gl.program, "u_SpotlightOn");
  if (!u_SpotlightOn) {
    console.log("Failed to get the storage location of u_SpotlightOn");
  }

  u_SpotLightPos = gl.getUniformLocation(gl.program, "u_SpotLightPos");
  if (!u_SpotLightPos) {
    console.log("Failed to get the storage location of u_SpotLightPos");
  }

  u_SpotDirection = gl.getUniformLocation(gl.program, "u_SpotDirection");
  if (!u_SpotDirection) {
    console.log("Failed to get the storage location of u_SpotDirection");
  }

  u_SpotColor = gl.getUniformLocation(gl.program, "u_SpotColor");
  if (!u_SpotColor) {
    console.log("Failed to get the storage location of u_SpotColor");
  }

  u_SpotCutoff = gl.getUniformLocation(gl.program, "u_SpotCutoff");
  if (!u_SpotCutoff) {
    console.log("Failed to get the storage location of u_SpotCutoff");
  }

  u_SpotExponent = gl.getUniformLocation(gl.program, "u_SpotExponent");
  if (!u_SpotExponent) {
    console.log("Failed to get the storage location of u_SpotExponent");
  }

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

function initTextures() {
  var image = new Image(); // Create the image object
  if (!image) {
    console.log("Failed to create the image object");
    return false;
  }
  // Register the event handler to be called on loading an image
  image.onload = function () {
    sendImageToTEXTURE0(image);
  };
  // Tell the browser to load an image
  image.src = "sky.jpg";

  return true;
}

function initFloorTexture() {
  var image = new Image();
  if (!image) {
    console.log("Failed to create the image object");
    return false;
  }
  image.onload = function () {
    sendImageToTEXTURE1(image);
  };
  image.src = "grass.jpg";
  return true;
}

function initStoneTexture() {
  var image = new Image();
  if (!image) {
    console.log("Failed to create the image object");
    return false;
  }
  image.onload = function () {
    sendImageToTEXTURE2(image);
  };
  image.src = "stone.png";
  return true;
}

function sendImageToTEXTURE0(image) {
  var texture = gl.createTexture(); // Create a texture object
  if (!texture) {
    console.log("Failed to create the texture object");
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

  gl.clear(gl.COLOR_BUFFER_BIT); // Clear <canvas>
}

function sendImageToTEXTURE1(image) {
  var texture = gl.createTexture(); // Create a texture object
  if (!texture) {
    console.log("Failed to create the texture object");
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

  gl.clear(gl.COLOR_BUFFER_BIT); // Clear <canvas>
}

function sendImageToTEXTURE2(image) {
  var texture = gl.createTexture(); // Create a texture object
  if (!texture) {
    console.log("Failed to create the texture object");
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

  gl.clear(gl.COLOR_BUFFER_BIT); // Clear <canvas>
}

function addActionsForHtmlUI() {
  document
    .getElementById("angleSlide")
    .addEventListener("mousemove", function () {
      g_globalAngle = this.value;
      renderAllShapes();
    });

  canvas.addEventListener("click", function () {
    canvas.requestPointerLock();
  });

  document.addEventListener("mousemove", (event) => {
    if (document.pointerLockElement === canvas) {
      camera.onMouseMove(event);
    }
  });

  const lightSlider = document.getElementById("lightSlide");
  lightSlider.addEventListener("mousedown", function () {
    g_lightDragging = true;
  });
  lightSlider.addEventListener("mouseup", function () {
    g_lightDragging = false;
  });
  lightSlider.addEventListener("input", function () {
    g_lightAngle = parseFloat(this.value);
  });

  document.getElementById("lightColor").addEventListener("input", function () {
    const hex = this.value;
    g_lightColor = [
      parseInt(hex.substr(1, 2), 16) / 255,
      parseInt(hex.substr(3, 2), 16) / 255,
      parseInt(hex.substr(5, 2), 16) / 255,
    ];
  });

  document
    .getElementById("toggleLightingBtn")
    .addEventListener("click", function () {
      g_lightingOn = !g_lightingOn;
    });

  document
    .getElementById("toggleSpotlightBtn")
    .addEventListener("click", function () {
      g_spotlightOn = !g_spotlightOn;
    });
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsForHtmlUI();

  camera = new Camera(canvas);
  document.onkeydown = keydown;

  initTextures();
  initFloorTexture();
  initStoneTexture();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  requestAnimationFrame(tick);
}

var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now() / 1000.0 - g_startTime;

function tick() {
  g_seconds = performance.now() / 1000.0 - g_startTime;

  if (!g_lightDragging) {
    g_lightAngle = (g_lightAngle + 0.125) % 360;
  }
  const radius = 50.0;
  const radians = (g_lightAngle * Math.PI) / 180;
  g_lightPos[0] = -2 + radius * Math.sin(radians);

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
var g_map = Array(32)
  .fill()
  .map(() => Array(32).fill(0));

// Fill borders with height 4 (walls)
for (let i = 0; i < 32; i++) {
  g_map[0][i] = 4; // Top border
  g_map[31][i] = 4; // Bottom border
  g_map[i][0] = 4; // Left border
  g_map[i][31] = 4; // Right border
}

// Stone structure with pillar
for (let i = 10; i < 15; i++) {
  g_map[i][14] = 3; // Top wall of height 3
}
for (let i = 10; i < 15; i++) {
  if (i === 12) {
    g_map[i][10] = 0; // Door (gap)
    g_map[i][11] = 0; // Door (gap) - second block
    g_map[i][12] = 3; // Top block of the door
  } else {
    g_map[i][10] = 3; // Regular wall
  }
}
for (let j = 10; j < 15; j++) {
  g_map[10][j] = 3; // Left wall of height 3
}
for (let j = 10; j < 15; j++) {
  g_map[14][j] = 3; // Right wall of height 3
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
addRandomStones(15);

function drawMap(vertices, uvs, normals) {
  const sphereGridX = 17; // from 0.5 world + 16
  const sphereGridZ = 13; // from -3 world + 16
  const clearRadius = 3; // excludes a 5x5 area

  for (let x = 0; x < 32; x++) {
    for (let y = 0; y < 32; y++) {
      if (
        Math.abs(x - sphereGridX) <= clearRadius &&
        Math.abs(y - sphereGridZ) <= clearRadius
      ) {
        continue;
      }

      let height = g_map[x][y];
      if (height > 0) {
        for (let h = 0; h < height; h++) {
          var cube = new Cube();
          cube.color = [1.0, 1.0, 1.0, 1.0];
          cube.matrix.translate(x - 16, -1 + h, y - 16);
          cube.addToBatch(vertices, uvs, normals);
        }
      }
    }
  }
}

function drawBatch(vertices, uvs, normals, textureNum) {
  var vertexBuffer = gl.createBuffer();
  var uvBuffer = gl.createBuffer();
  var normalBuffer = gl.createBuffer();

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

  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Normal);

  // Set the texture number
  gl.uniform1i(u_whichTexture, textureNum);

  // Draw all cubes in one call
  gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);
}

function modifyBlock(value) {
  let forward = new Vector3(camera.at.elements);
  forward.sub(camera.eye);
  forward.normalize();

  let targetX = Math.round(camera.eye.elements[0] + forward.elements[0]) + 16;
  let targetY = Math.round(camera.eye.elements[1]);
  let targetZ = Math.round(camera.eye.elements[2] + forward.elements[2]) + 16;

  if (targetX >= 0 && targetX < 32 && targetZ >= 0 && targetZ < 32) {
    if (value === 1) {
      g_map[targetX][targetZ] = Math.min(g_map[targetX][targetZ] + 1, 4); // Max height of 4
    } else if (value === -1) {
      g_map[targetX][targetZ] = Math.max(g_map[targetX][targetZ] - 1, 0); // Min height of 0
    }
    console.log(
      `Block at (${targetX}, ${targetZ}) modified to height: ${g_map[targetX][targetZ]}`
    );
  } else {
    console.log(
      `Target block is out of bounds: ${targetX} ${targetY} ${targetZ}`
    );
  }
  renderAllShapes();
}

function toggleNormals() {
  g_normalOn = !g_normalOn;
  renderAllShapes();
}

function renderAllShapes() {
  var startTime = performance.now();

  gl.uniform1i(u_NormalToggle, g_normalOn);

  gl.uniform3f(u_LightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);

  gl.uniformMatrix4fv(
    u_ProjectionMatrix,
    false,
    camera.projectionMatrix.elements
  );
  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
  gl.uniform3f(
    u_CameraPos,
    camera.eye.elements[0],
    camera.eye.elements[1],
    camera.eye.elements[2]
  );

  gl.uniform3f(u_LightColor, g_lightColor[0], g_lightColor[1], g_lightColor[2]);
  gl.uniform1i(u_LightingOn, g_lightingOn);

  gl.uniform1i(u_SpotlightOn, g_spotlightOn);
  gl.uniform3f(
    u_SpotLightPos,
    g_spotlightPos[0],
    g_spotlightPos[1],
    g_spotlightPos[2]
  );
  gl.uniform3f(u_SpotDirection, 0.0, -1.0, 0.0); // downward
  gl.uniform3f(u_SpotColor, 1.0, 1.0, 1.0); // white
  gl.uniform1f(u_SpotCutoff, Math.cos(Math.PI / 8)); // ~22.5°
  gl.uniform1f(u_SpotExponent, 20.0);

  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const mapVertices = [];
  const mapUVs = [];
  const mapNormals = [];

  const floorVertices = [];
  const floorUVs = [];
  const floorNormals = [];

  const skyVertices = [];
  const skyUVs = [];
  const skyNormals = [];

  drawMap(mapVertices, mapUVs, mapNormals);
  //console.log('Normals:', mapNormals.slice(0, 18));

  // Draw the floor
  var floor = new Cube();
  floor.color = [1.0, 0.0, 0.0, 1.0];
  floor.matrix.translate(0, -0.75, 0.0);
  floor.matrix.scale(32, 0, 32);
  floor.matrix.translate(-0.5, 0, -0.5);
  floor.addToBatch(floorVertices, floorUVs, floorNormals);

  // Draw the sky
  var sky = new Cube();
  sky.color = [1.0, 0.0, 0.0, 1.0];
  sky.matrix.scale(40, 40, 40);
  sky.matrix.translate(-0.5, -0.5, -0.5);
  sky.addToBatch(skyVertices, skyUVs, skyNormals);
  for (let i = 0; i < skyNormals.length; i++) {
    skyNormals[i] = -skyNormals[i];
  }

  // Rubric step 3 - DRAWING A SPHERE
  const sphereVertices = [],
    sphereUVs = [],
    sphereNormals = [];
  const sphere = new Sphere(1.0, 20, 20);
  sphere.matrix.translate(0.5, 1, -3); // Position it above the ground
  sphere.addToBatch(sphereVertices, sphereUVs, sphereNormals);
  drawBatch(sphereVertices, sphereUVs, sphereNormals, 2);

  // Rubric step 4 - LIGHT CUBE
  const lightVertices = [],
    lightUVs = [],
    lightNormals = [];
  let lightCube = new Cube();
  lightCube.matrix.translate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  //lightCube.matrix.scale(2, 2, 2);
  lightCube.addToBatch(lightVertices, lightUVs, lightNormals);
  drawBatch(lightVertices, lightUVs, lightNormals, -2);

  // IMPORTANT - THIS IS WHERE YOU CHANGE TEXTURES
  drawBatch(mapVertices, mapUVs, mapNormals, 2); // Map (stone texture)
  drawBatch(floorVertices, floorUVs, floorNormals, 1); // Floor (grass texture)
  drawBatch(skyVertices, skyUVs, skyNormals, 0); // Sky (sky texture)

  var duration = performance.now() - startTime;
  sendTextToHTML(
    " ms: " +
      Math.floor(duration) +
      " fps: " +
      Math.floor(10000 / duration) / 10,
    "numdot"
  );
}

function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}
