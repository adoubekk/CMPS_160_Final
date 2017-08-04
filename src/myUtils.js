//myUtils.js
//--------------------------------------------------------------
// Helper methods
//--------------------------------------------------------------

//takes in a hexadecimal color code of the form #rrggbb and returns an array with [r,g,b]
function calcRGB(hexColor){
   var r = (16*parseInt(hexColor.charAt(1),16) + parseInt(hexColor.charAt(2),16))/255;
   var g = (16*parseInt(hexColor.charAt(3),16) + parseInt(hexColor.charAt(4),16))/255;
   var b = (16*parseInt(hexColor.charAt(5),16) + parseInt(hexColor.charAt(6),16))/255;
   var color = [r,g,b];
   return color;
}

// from Matsuda's OBJveiwer.js
function calcNormal(p0, p1, p2) {
   // v0: a vector from p1 to p0, v1; a vector from p1 to p2
   var v0 = new Float32Array(3);
   var v1 = new Float32Array(3);
   for (var i = 0; i < 3; i++){
      v0[i] = p0[i] - p1[i];
      v1[i] = p2[i] - p1[i];
   }

   // The cross product of v0 and v1
   var c = new Float32Array(3);
   c[0] = v0[1] * v1[2] - v0[2] * v1[1];
   c[1] = v0[2] * v1[0] - v0[0] * v1[2];
   c[2] = v0[0] * v1[1] - v0[1] * v1[0];

   // Normalize the result
   var v = new Vector3(c);
   v.normalize();
   return v.elements;
} 

//convert 2D array to 1D array
function to1DArray(arr){
   var arr_new = [];
   var len = arr.length;
   for (var i = 0; i < len; i+=1){
      arr_new = arr_new.concat(arr[i]);
   }
   return arr_new;
}

function calcIndicesLine(g_points){
	var g_indices = [];
	var len = g_points.length/3;
	//create index array
	for (var i = 0; i < len; i+=1){
		g_indices.push(i);
	} 
	return g_indices;
}

//set all points to one color
function setColor(g_points,color){
	var len = g_points.length;
	var g_colors = [];
	for (var i = 0; i <= len; i+=3){
		g_colors.push(color[0],color[1],color[2]);
	}
	return g_colors;
}

function calcIndicesFlat(g_points){
   g_indices_flat = [];
   var len = g_points.length/3;
   for (var i = 0; i < len; i+=4){    
      g_indices_flat.push(i);
      g_indices_flat.push(i+1);
      g_indices_flat.push(i+3);
      
      g_indices_flat.push(i+1);
      g_indices_flat.push(i+2);
      g_indices_flat.push(i+3);
   }
   return g_indices_flat;
}

//-----------------------------------------------------------------
// Functions for setting up array buffers and views
//-----------------------------------------------------------------
function updateVertexBuffers_Line(gl,g_points,g_indices,g_colors,program) {
   var vertices = Float32Array.from(g_points); //create array which can be buffered from input list
   var indices = Uint16Array.from(g_indices); //unsigned short array
   var colors = Float32Array.from(g_colors);
   
    gl.useProgram(program);   // Tell that this program object is used
   
   // Initialize vertex buffer and write vertices to it
   var vertexBuffer = gl.createBuffer();
   // Bind the buffer object to target
   gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
   // Assign the buffer object to a_Position variable
   gl.vertexAttribPointer(program.a_Position, 3, gl.FLOAT, false, 0, 0);
   // Enable the assignment to a_Position variable
   gl.enableVertexAttribArray(program.a_Position);
   // Write data into the buffer objects for vertices
   gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
   
   //create index buffer and write data
   var indexBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
   gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
   
   //create color buffer and write data
   var colorBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
   gl.vertexAttribPointer(program.a_Color_diff, 3, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray(program.a_Color_diff);
   gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
   
   //check if buffers failed to initialize
   if (!vertexBuffer || !indexBuffer || !colorBuffer) {
      console.log('Failed to create the buffer objects');
      return -1;
   }
   
   var n = indices.length; //number of indices to render for drawElements();
   return n;
}


function updateVertexBuffers(gl,g_points,g_indices,g_colors,g_normals,program) {
   var vertices = Float32Array.from(g_points); //create array which can be buffered from input list
   var indices = Uint16Array.from(g_indices); //unsigned short array
   var colors = Float32Array.from(g_colors);
   var normals = Float32Array.from(g_normals);
   
    gl.useProgram(program);   // Tell that this program object is used
   
   // Initialize vertex buffer and write vertices to it
   var vertexBuffer = gl.createBuffer();
   // Bind the buffer object to target
   gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
   // Assign the buffer object to a_Position variable
   gl.vertexAttribPointer(program.a_Position, 3, gl.FLOAT, false, 0, 0);
   // Enable the assignment to a_Position variable
   gl.enableVertexAttribArray(program.a_Position);
   // Write data into the buffer objects for vertices
   gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
   
   //create index buffer and write data
   var indexBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
   gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
   
   //create color buffer and write data
   var colorBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
   gl.vertexAttribPointer(program.a_Color_diff, 3, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray(program.a_Color_diff);
   gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
   
   //create normal buffer and write data
   var normalBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
   gl.vertexAttribPointer(program.a_Normal, 3, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray(program.a_Normal);
   gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
   
   //check if buffers failed to initialize
   if (!vertexBuffer || !indexBuffer || !normalBuffer || !colorBuffer) {
      console.log('Failed to create the buffer objects');
      return -1;
   }
   
   var n = indices.length; //number of indices to render for drawElements();
   return n;
}

function updateVertexBuffersTex(gl,g_points,g_indices,g_normals,tex_points,texture,program) {
   var vertices = Float32Array.from(g_points); //create array which can be buffered from input list
   var indices = Uint16Array.from(g_indices); //unsigned short array
   var texCoords = Float32Array.from(tex_points);
   var normals = Float32Array.from(g_normals);
 
    gl.useProgram(program);   // Tell that this program object is used
   
   // Initialize vertex buffer and write vertices to it
   var vertexBuffer = gl.createBuffer();
   // Bind the buffer object to target
   gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
   // Assign the buffer object to a_Position variable
   gl.vertexAttribPointer(program.a_Position, 3, gl.FLOAT, false, 0, 0);
   // Enable the assignment to a_Position variable
   gl.enableVertexAttribArray(program.a_Position);
   // Write data into the buffer objects for vertices
   gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
   
   //create index buffer and write data
   var indexBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
   gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
   
   //create color buffer and write data
   var texBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
   gl.vertexAttribPointer(program.a_TexCoord, 2, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray(program.a_TexCoord);
   gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
   
   //create normal buffer and write data
   var normalBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
   gl.vertexAttribPointer(program.a_Normal, 3, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray(program.a_Normal);
   gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
   
   //check if buffers failed to initialize
   if (!vertexBuffer || !indexBuffer || !texBuffer) {
      console.log('Failed to create the buffer objects');
      return -1;
   }
   
    // Bind texture object to texture unit 0
   gl.activeTexture(gl.TEXTURE0);
   gl.bindTexture(gl.TEXTURE_2D, texture);
   
   var n = indices.length; //number of indices to render for drawElements();
   return n;
}

function initTextures(gl, program, imgsrc) {
  var texture = gl.createTexture();   // Create a texture object
  if (!texture) {
    console.log('Failed to create the texture object');
    return null;
  }
  
  console.log(imgsrc);

  var image = new Image();  // Create a image object
  if (!image) {
    console.log('Failed to create the image object');
    return null;
  }
  
  // Tell the browser to load an Image
  image.src = imgsrc;
  // Register the event handler to be called when image loading is completed
  image.onload = function() {
    // Write the image data to texture object
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);  // Flip the image Y coordinate
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    // Pass the texure unit 0 to u_Sampler
    gl.useProgram(program);
    gl.uniform1i(program.u_Sampler, 0);

    gl.bindTexture(gl.TEXTURE_2D, null); // Unbind texture
  };


  return texture;
}

//------------------------------------------------------------------
//Debugging Functions
//------------------------------------------------------------------

//draw points only
function drawPoints(gl,g_points) {      
   // Clear <canvas>
   gl.clear(gl.COLOR_BUFFER_BIT);
   
   var g_indices = calcIndicesLine(g_points);
   var g_colors = calcLighting(g_points,g_indices);
	  
   // Write the positions of vertices to a vertex shader
   var n = updateVertexBuffers(gl,g_points,g_indices,g_colors);
   if (n < 0) {
      console.log('Failed to set the positions of the vertices');
   return;
   }
	
   // Draw the polyline
   gl.drawElements(gl.POINTS, n, gl.UNSIGNED_BYTE, 0);
}

//print out a list of vertices in a polyline
function printPoints(g_points){
   var list = 'Polyline vertices: ';
   var len = g_points.length;
   for (var i = 0; i <= len-3; i+=3){
      list = list + ' (' + g_points[i] + ',' + g_points[i+1] + ',' + g_points[i+2] + ')';
   }
   console.log(list);
}   
