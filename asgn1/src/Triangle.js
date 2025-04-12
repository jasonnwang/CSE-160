class Triangle{
  constructor(){
    this.type='triangle';
    this.position = [0.0,0.0,0.0];
    this.color = [1.0,1.0,1.0,1.0];
    this.size = 5.0;
  }

  render() {
    var xy = this.position;
    var rgba = this.color;
    var size = this.size;

    // Pass the position of a point to a_Position variable
    gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
    // Pass the color of a point to u_FragColor variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    gl.uniform1f(u_Size, size);
    // Draw
    var d= this.size/200.0;
    drawTriangle( [xy[0], xy[1], xy[0]+d, xy[1], xy[0], xy[1]+d]);
  }
}

function drawTriangle(vertices) {

  var n = 3;
  // Create a buffer object
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

  // Assign the buffer object to a_Position variable
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);

  gl.drawArrays(gl.TRIANGLES, 0, n);
  // return n;
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
