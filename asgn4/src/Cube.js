class Cube {
  constructor() {
    this.type = "cube";
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
    this.textureNum = -1;
  }

  addToBatch(vertices, uvs, normals) {
    var rgba = this.color;
    for (let i = 0; i < CUBE_VERTICES_UV.length; i += 5) {
      // Vertex transformation
      let x = CUBE_VERTICES_UV[i];
      let y = CUBE_VERTICES_UV[i + 1];
      let z = CUBE_VERTICES_UV[i + 2];
      let u = CUBE_VERTICES_UV[i + 3];
      let v = CUBE_VERTICES_UV[i + 4];

      let transformed = this.matrix.multiplyVector3(new Vector3([x, y, z]));

      // Add transformed vertices
      vertices.push(
        transformed.elements[0],
        transformed.elements[1],
        transformed.elements[2]
      );

      // Add UV coordinates
      uvs.push(u, v);
    }

    // Add per-face normals
    for (let face = 0; face < 6; face++) {
      let normal;
      if (face === 0) normal = [0, 0, -1]; // Front
      if (face === 1) normal = [0, 1, 0]; // Top
      if (face === 2) normal = [1, 0, 0]; // Right
      if (face === 3) normal = [-1, 0, 0]; // Left
      if (face === 4) normal = [0, 0, 1]; // Back
      if (face === 5) normal = [0, -1, 0]; // Bottom

      for (let i = 0; i < 6; i++) {
        // 2 triangles per face = 6 vertices
        normals.push(...normal);
      }
    }
  }

  /*render() {
        var rgba = this.color;
        gl.uniform1i(u_whichTexture, this.textureNum);
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
        
        // FRONT face (z=0)
        drawTriangle3DUV([0,0,0, 1,1,0, 1,0,0], [0,0, 1,1, 1,0]);
        drawTriangle3DUV([0,0,0, 0,1,0, 1,1,0], [0,0, 0,1, 1,1]);

        // TOP face (y=1)
        gl.uniform4f(u_FragColor, rgba[0]*0.9, rgba[1]*0.9, rgba[2]*0.9, rgba[3]);
        drawTriangle3DUV([0,1,0, 0,1,1, 1,1,1], [0,0, 0,1, 1,1]);
        drawTriangle3DUV([0,1,0, 1,1,1, 1,1,0], [0,0, 1,1, 1,0]);

        // RIGHT face (x=1)
        gl.uniform4f(u_FragColor, rgba[0]*0.8, rgba[1]*0.8, rgba[2]*0.8, rgba[3]);
        drawTriangle3DUV([1,0,0, 1,1,0, 1,1,1], [0,0, 1,0, 1,1]);
        drawTriangle3DUV([1,0,0, 1,1,1, 1,0,1], [0,0, 1,1, 0,1]);

        // LEFT face (x=0)
        gl.uniform4f(u_FragColor, rgba[0]*0.7, rgba[1]*0.7, rgba[2]*0.7, rgba[3]);
        drawTriangle3DUV([0,0,0, 0,1,0, 0,1,1], [0,0, 0,1, 1,1]);
        drawTriangle3DUV([0,0,0, 0,1,1, 0,0,1], [0,0, 1,1, 1,0]);

        // BACK face (z=1)
        gl.uniform4f(u_FragColor, rgba[0]*0.6, rgba[1]*0.6, rgba[2]*0.6, rgba[3]);
        drawTriangle3DUV([0,0,1, 1,0,1, 1,1,1], [0,0, 1,0, 1,1]);
        drawTriangle3DUV([0,0,1, 1,1,1, 0,1,1], [0,0, 1,1, 0,1]);

        // BOTTOM face (y=0)
        gl.uniform4f(u_FragColor, rgba[0]*0.5, rgba[1]*0.5, rgba[2]*0.5, rgba[3]);
        drawTriangle3DUV([0,0,0, 1,0,0, 1,0,1], [0,0, 1,0, 1,1]);
        drawTriangle3DUV([0,0,0, 1,0,1, 0,0,1], [0,0, 1,1, 0,1]);
    }*/
}

const CUBE_VERTICES_UV = [
  // Front face
  0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1,
  1, 0, 1, 1,

  // Top face
  0, 1, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1,
  1, 0, 1, 0,

  // Right face
  1, 0, 0, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1,
  0, 1, 0, 1,

  // Left face
  0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0,
  0, 1, 0, 1,

  // Back face
  0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 0,
  1, 1, 0, 1,

  // Bottom face
  0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 0,
  0, 1, 0, 1,
];
