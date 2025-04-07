// DrawTriangle.js (c) 2012 matsuda
function main() {  
  // Retrieve <canvas> element
  var canvas = document.getElementById('example');  
  if (!canvas) { 
    console.log('Failed to retrieve the <canvas> element');
    return false; 
  } 

  // Get the rendering context for 2DCG
  var ctx = canvas.getContext('2d');

  // Draw a black rectangle
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Set color to blue
  ctx.fillRect(0, 0, canvas.width, canvas.height);        // Fill a rectangle with the color

  /*
  let v1 = new Vector3([2.25, 2.25, 0]);
  drawVector(v1, "red", ctx);
  let v2 = new Vector3([1.5, 1.5, 0]);
  drawVector(v2, "blue", ctx);
  */
}

function clearCanvas(ctx, canvas) {
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function handleDrawEvent() {
  // Get the canvas and context
  let canvas = document.getElementById('example');
  let ctx = canvas.getContext('2d');

  // Clear the canvas
  clearCanvas(ctx, canvas);

  // Read user input values
  let x1 = parseFloat(document.getElementById('x').value);
  let y1 = parseFloat(document.getElementById('y').value);

  // Read user input values for v2 (x2, y2)
  let x2 = parseFloat(document.getElementById('x2').value);
  let y2 = parseFloat(document.getElementById('y2').value);

  // Create the new vector and draw it
  let v1 = new Vector3([x1, y1, 0]);
  let v2 = new Vector3([x2, y2, 0]);
  drawVector(v1, "red", ctx);
  drawVector(v2, "blue", ctx);
}

function angleBetween(v1, v2) {
  let dotProduct = Vector3.dot(v1, v2);
  let magV1 = v1.magnitude();
  let magV2 = v2.magnitude();
  let cosAngle = dotProduct / (magV1 * magV2);
  cosAngle = Math.max(-1, Math.min(1, cosAngle));
  let angleRadians = Math.acos(cosAngle);
  let angleDegrees = Math.acos(cosAngle) * (180 / Math.PI);
  console.log("Angle between vectors: " + angleDegrees + " degrees");
  return angleDegrees;
}

function areaTriangle(v1, v2) {
  let crossProduct = Vector3.cross(v1, v2);
  let areaOfParallelogram = crossProduct.magnitude();
  let areaOfTriangle = 0.5 * areaOfParallelogram;
  console.log("Area of triangle: " + areaOfTriangle);
  return areaOfTriangle;
}

function handleDrawOperationEvent() {
  // Get the canvas and context
  let canvas = document.getElementById('example');
  let ctx = canvas.getContext('2d');

  // Clear the canvas
  clearCanvas(ctx, canvas);

  // Read user input values
  let x1 = parseFloat(document.getElementById('x').value);
  let y1 = parseFloat(document.getElementById('y').value);

  // Read user input values for v2 (x2, y2)
  let x2 = parseFloat(document.getElementById('x2').value);
  let y2 = parseFloat(document.getElementById('y2').value);

  // Read the selected operation from the dropdown
  let operation = document.getElementById('operation').value;

  // Read the scalar value
  let scalar = parseFloat(document.getElementById('scalar').value);

  let v1 = new Vector3([x1, y1, 0]);
  let v2 = new Vector3([x2, y2, 0]);
  drawVector(v1, "red", ctx);
  drawVector(v2, "blue", ctx);
  
  // Perform selected operation
  let v3, v4;
  if (operation === "add") {
    v3 = v1.add(v2);
    drawVector(v3, "green", ctx);
  } else if (operation === "sub") {
    v3 = v1.sub(v2);
    drawVector(v3, "green", ctx);
  } else if (operation === "mul") {
    v3 = v1.mul(scalar);
    v4 = v2.mul(scalar);
    drawVector(v3, "green", ctx);
    drawVector(v4, "green", ctx);
  } else if (operation === "div") {
    if (scalar === 0) {
      alert("Cannot divide by zero.");
      return;
    }
    v3 = v1.div(scalar);
    v4 = v2.div(scalar);
    drawVector(v3, "green", ctx); 
    drawVector(v4, "green", ctx);
  } else if (operation === "magnitude") {
    let mag1 = v1.magnitude();
    let mag2 = v2.magnitude();
    console.log("Magnitude of v1:", mag1);
    console.log("Magnitude of v2:", mag2);
  } else if (operation === "normalize") {
    v3 = v1.normalize();
    v4 = v2.normalize();
    drawVector(v3, "green", ctx);
    drawVector(v4, "green", ctx);
  } else if (operation === "angle") {
    angleBetween(v1, v2);
  } else if (operation === "area") {
    areaTriangle(v1, v2);
  }
}

function drawVector(v, color, ctx) {
  const scale = 20;
  let originX = 200;
  let originY = 200;

  let endX = originX + v.elements[0] * scale;
  let endY = originY - v.elements[1] * scale;

  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(originX, originY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
}