"use strict"

var vertexShaderSource = `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec3 a_position;


out float colorValue;

// Resolution of canvas
uniform vec2 u_resolution;

// Extent of content, range 0:inclusive -> value: exclusive.
uniform vec2 u_contents_size;

uniform vec2 pixel_offset;

uniform float y_scale;

// all shaders have a main function
void main() {
 
  vec2 offsetpixel = a_position.xy - pixel_offset;

  offsetpixel.y *= y_scale;

  // convert the position from pixels to 0.0 to 1.0
  vec2 zeroToOne = offsetpixel / u_resolution;


  zeroToOne = zeroToOne * u_contents_size;

  // vec2 zeroToOne = u_contents_size * offsetpixel;

  // convert from 0->1 to 0->2
  vec2 zeroToTwo = zeroToOne * 2.0;

  // convert from 0->2 to -1->+1 (clipspace)
  vec2 clipSpace = zeroToTwo - 1.0;

  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

  colorValue = a_position.z;
}
`;

var fragmentShaderSource = `#version 300 es

precision mediump float;


// we need to declare an output for the fragment shader
out vec4 outColor;

in float colorValue;

void main() {
  if (colorValue > 0.3)
  {
   outColor = vec4(colorValue, colorValue, colorValue, 1);
  }
  else
  {
  outColor = vec4(1, colorValue, colorValue, 1);
  }
  
}
`;

var gl;
var canvas;

var program;
var positionAttributeLocation;
var resolutionUniformLocation;

var contentsizeUniformLocation;
var offsetLocation;

var y_scaleLocation;

var positionBuffer;
var vao;

var offsetX = 0;
var offsetY = 0;

var W = 300;
var H = 97970;

var nRectangles = 300000;

var y_scale = 1;


function NOTNULL(value) {
  if (value == null) {
    alert("Null value detected");
  }
}

function GetUniformLocation(string, isWarn)
{
  var
    location = gl.getUniformLocation(program, string);

  if (isWarn && location == null)
  {
    alert("GetUniformLocation: '" + string + "' not found");
  }


  return location;


}


function main() {

 

  // Get A WebGL context
  canvas = document.getElementById("c");
  gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }


  window.addEventListener('resize', resizeXXX, false);

  canvas.onmousedown = handleMouseDown;
  canvas.onmouseup = handleMouseUp;
  canvas.onmousemove = handleMouseMove;

  canvas.onmousewheel = handleMouseWheel;

  // Create a buffer
  positionBuffer = gl.createBuffer();


  build_rectangles_host(W, H);

  // Use our boilerplate utils to compile the shaders and link into a program
  program = webglUtils.createProgramFromSources(gl,
    [vertexShaderSource, fragmentShaderSource]);

  // look up where the vertex data needs to go.
  positionAttributeLocation = GetUniformLocation("a_position", false);

  
  resolutionUniformLocation = GetUniformLocation("u_resolution", true);


  contentsizeUniformLocation = GetUniformLocation("u_contents_size", true);

  
  offsetLocation = GetUniformLocation("pixel_offset", true);

  y_scaleLocation = GetUniformLocation("y_scale", true);

  // Create a vertex array object (attribute state)
  vao = gl.createVertexArray();

  resizeXXX(null);

  render();

}


function build_single_rectangle_host(f, iOffset, w, h)
{
  var x1 = randomInt(w);
  var x2 = x1 + randomInt(w);
  var y1 = randomInt(h);
  var y2 = y1 + 7;

  var
    color = Math.random();

  f[iOffset + 0] = x1;
  f[iOffset + 1] = y1;
  f[iOffset + 2] = color;

  f[iOffset + 3] = x2;
  f[iOffset + 4] = y1;
  f[iOffset + 5] = color;

  f[iOffset + 6] = x1;
  f[iOffset + 7] = y2;
  f[iOffset + 8] = color;

  f[iOffset + 9] = x1;
  f[iOffset + 10] = y2;
  f[iOffset + 11] = color;

  f[iOffset + 12] = x2;
  f[iOffset + 13] = y1;
  f[iOffset + 14] = color;

  f[iOffset + 15] = x2;
  f[iOffset + 16] = y2;
  f[iOffset + 17] = color;

}


function build_rectangles_host(w, h)
{

  var nVertexPerRectangle = 6;

  var nElementsPerVertex = 3;

  var nElementsPerRectangle = nVertexPerRectangle * nElementsPerVertex;

  var cpu_data = new Float32Array(nRectangles * nElementsPerRectangle);

  for (var iRectangle = 0; iRectangle < nRectangles; iRectangle++)
  {
    var
      iOffset = iRectangle * nElementsPerRectangle;

    build_single_rectangle_host(cpu_data, iOffset, w, h);
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cpu_data, gl.STATIC_DRAW);

  cpu_data = null;
  
}

function render_new() {

 
  gl.bindVertexArray(vao);
  gl.enableVertexAttribArray(positionAttributeLocation);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // gl.bufferData(gl.ARRAY_BUFFER, cpu_data, gl.STATIC_DRAW);
  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 3;          // 3 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer


  gl.vertexAttribPointer(
    positionAttributeLocation, size, type, normalize, stride, offset);

  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  // Tell WebGL how to convert from clip space to pixels
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // Clear the canvas
  gl.clearColor(1, 1, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Tell it to use our program (pair of shaders)
  gl.useProgram(program);

  // Bind the attribute/buffer set we want.
  gl.bindVertexArray(vao);

  gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

  var
    x_factor = gl.canvas.width / W,
    y_factor = gl.canvas.height / H;

  gl.uniform2f(contentsizeUniformLocation, x_factor, 1);

  var
    y = getOffsetY();

  gl.uniform2f(offsetLocation, 0, -y);

  gl.uniform1f(y_scaleLocation, y_scale);

  // gl.bufferData(gl.ARRAY_BUFFER, cpu_data, gl.STATIC_DRAW);    

  // Draw the rectangles.

  var offset = 0;
  var count = nRectangles * 6;
  gl.drawArrays(gl.TRIANGLES, offset, count);


  // Draw content border frame
  var is_draw_frame = false;

  if (is_draw_frame) {

    var x0 = 0;
    var y0 = 0;
    var x1 = W;
    var y1 = H;

    var thickness = 7;

    setRectangle(gl, x0, y0, x1 - x0, thickness, 0.3);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    setRectangle(gl, x0, y1 - thickness, x1 - x0, thickness, 0.3);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    setRectangle(gl, x0, y0, thickness, y1 - y0, 0.3);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    setRectangle(gl, x1 - thickness, y0, thickness, y1 - y0, 0.3);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

  }
}

function render() {
  render_new();
}

function resizeXXX(event) {
  

  console.log('resizeXXX');

  gl.canvas.width = window.innerWidth;
  gl.canvas.height = window.innerHeight;

  render();

}

function logCanvasSize()
{
  var x = gl.canvas.width;
  var y = gl.canvas.height;

  console.log('gl.canvas size = (' + x + ',' + y + ')');
}

var isDragging = false;


var x_down;
var y_down;

var x_current;
var y_current;

function handleMouseUp(event) {

  if (event.button != 0) {
    return;
  }

  isDragging = false;

  offsetX += (x_current - x_down);
  offsetY += (y_current - y_down);

  console.log('handleMouseUp delta (' + (x_current - x_down) + ',' + (y_current - y_down) + ')');

  render();
}

function getOffsetY()
{
  if (isDragging) {
    return (offsetY + (y_current - y_down))/ y_scale;
  }
  else {
    return  offsetY/ y_scale;
  }


}

function handleMouseMove(event) {

  x_current = event.clientX;
  y_current = event.clientY;
}

function handleMouseDown(event) {

  if (event.button != 0)
  {
    return;
  }

  isDragging = true;

  var x = event.clientX;
  var y = event.clientY;

  x_down = x;
  y_down = y;

  x_current = x_down;
  y_current = y_down;

  logCanvasSize();

  var rect = canvas.getBoundingClientRect();

  var x_corr = x - rect.left;
  var y_corr = y - rect.top;


  console.log('handleMouseDown at (' + x_corr + ',' + y_corr + ')');

  var xw = window.innerWidth;
  var yw = window.innerHeight;

}

function handleMouseWheel(event) {

  var x = event.clientX;
  var y = event.clientY;

  var d = event.wheelDelta;

  console.log('handleMouseWheel: delta ' + d + ' at (' + x + ',' + y + ')');

  if (d > 0)
  {
    y_scale *= 1.1;

  }
  else {
    y_scale /= 1.1;

  }
  console.log('handleMouseWheel: y_scale = ' + y_scale);

  render();
 
}



// Returns a random integer from 0 to range - 1.
function randomInt(range) {
  return Math.floor(Math.random() * range);
}

// Fill the buffer with the values that define a rectangle.
function setRectangle(gl, x, y, width, height, c) {
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;

  

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    x1, y1, c,
    x2, y1, c, 
    x1, y2, c, 
    x1, y2, c, 
    x2, y1, c, 
    x2, y2, c,
  ]), gl.STATIC_DRAW);
}

main();
