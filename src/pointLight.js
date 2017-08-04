//pointLight.js

var pointLight = function(position,color,program){
   pointLight.index = 0;
   this.ID = pointLight.index++;
   this.color = color;
   this.position = position;
   this.program = program;
   this.g_points;
   this.g_indices;
   this.initGeometry();
   this.active = true;
   this.picking = false;
   this.picked = false;
}

pointLight.prototype.drawPLight = function(){
   if (this.picking){
      color_ = [this.ID/255,this.ID/255,this.ID/255];
   } else if (this.picked) {
      color_ = [.75,.75,.75];     
   } else if (this.active){
      color_ = this.color;
   } else {
      color_ = [.25,.25,.25];
   }
   var g_colors = setColor(this.g_points,color_);  
   gl.useProgram(this.program);
   gl.uniform1i(this.program.u_Selection,true);
     
   // Write the positions of vertices to a vertex shader
   var n = updateVertexBuffers_Line(gl,this.g_points,this.g_indices,g_colors,this.program);
   if (n < 0) {
      console.log('Failed to set the positions of the vertices');
   return;
   }
	
   // Draw the polyline
   gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);
}

pointLight.prototype.initGeometry = function(){
   this.g_points = [      
     1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,    // v0-v1-v2-v3 front
     1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,    // v0-v3-v4-v5 right
     1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,    // v0-v5-v6-v1 up
    -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,    // v1-v6-v7-v2 left
    -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,    // v7-v4-v3-v2 down
     1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0     // v4-v7-v6-v5 back
   ];
   
   for (var i = 0; i < this.g_points.length; i++){
      //scale to 50x50
      this.g_points[i] *= 25;
      //translate coordinates to initial position
      if (i%3 == 0){ //x component
         this.g_points[i] += this.position[0];
      } else if (i%3 == 1){ //y
         this.g_points[i] += this.position[1];
      } else { //z
         this.g_points[i] += this.position[2];
      }
   }
   
   this.g_indices = calcIndicesFlat(this.g_points);
}

pointLight.prototype.translate = function(deltaX,deltaY,deltaZ){
   this.position[0] += deltaX;
   this.position[1] += deltaY;
   this.position[2] += deltaZ;
   
   for (var i = 0; i <this.g_points.length; i++){
      //translate coordinates by deltas
      if (i%3 == 0){ //x component
         this.g_points[i] += deltaX;
      } else if (i%3 == 1){ //y
         this.g_points[i] += deltaY;
      } else { //z
         this.g_points[i] += deltaZ;
      } 
   }
}
pointLight.prototype.isActive = function() {
   return this.active;
}