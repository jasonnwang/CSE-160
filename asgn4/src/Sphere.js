class Sphere {
  constructor(radius = 1, latBands = 20, longBands = 20) {
    this.radius = radius;
    this.latBands = latBands;
    this.longBands = longBands;

    this.vertices = [];
    this.normals = [];
    this.uvs = [];
    this.indices = [];

    this.matrix = new Matrix4();
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.textureNum = -1;

    this.drawSphere();
  }

  drawSphere() {
    for (let lat = 0; lat <= this.latBands; ++lat) {
      const theta = (lat * Math.PI) / this.latBands;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      for (let lon = 0; lon <= this.longBands; ++lon) {
        const phi = (lon * 2 * Math.PI) / this.longBands;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);

        const x = cosPhi * sinTheta;
        const y = cosTheta;
        const z = sinPhi * sinTheta;

        this.vertices.push(this.radius * x, this.radius * y, this.radius * z);
        this.normals.push(x, y, z);
        this.uvs.push(lon / this.longBands, 1 - lat / this.latBands);
      }
    }

    for (let lat = 0; lat < this.latBands; ++lat) {
      for (let lon = 0; lon < this.longBands; ++lon) {
        const first = lat * (this.longBands + 1) + lon;
        const second = first + this.longBands + 1;

        this.indices.push(first, second, first + 1);
        this.indices.push(second, second + 1, first + 1);
      }
    }
  }

  addToBatch(verticesOut, uvsOut, normalsOut) {
    for (let i = 0; i < this.indices.length; i++) {
      const idx = this.indices[i];

      const pos = new Vector3([
        this.vertices[3 * idx],
        this.vertices[3 * idx + 1],
        this.vertices[3 * idx + 2],
      ]);
      const transformed = this.matrix.multiplyVector3(pos);

      verticesOut.push(...transformed.elements);
      uvsOut.push(this.uvs[2 * idx], this.uvs[2 * idx + 1]);
      normalsOut.push(
        this.normals[3 * idx],
        this.normals[3 * idx + 1],
        this.normals[3 * idx + 2]
      );
    }
  }
}
