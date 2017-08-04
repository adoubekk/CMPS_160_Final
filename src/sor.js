//sor.js
//class file for SOR objects

//"constructor" for js class
var SOR_obj = function(g_points,gl,theView,solidProg,texProg,color){
   //static indexing counter
   SOR_obj.index = 0;
   this.ID = SOR_obj.index++;
   //calculate SOR points, face normals, and vertex normals
   this.g_points = g_points;
   this.SOR_points;
   this.SORcreatePoints();
   this.face_normals;
   this.calcNormals();
   this.vertex_normals;
   this.calcVertexNormals();
   this.normal_lines = [];
   this.g_normals_flat;
   this.flattenNormals();
   this.g_vertex_normals = to1DArray(this.vertex_normals);
   this.g_face_normals = to1DArray(this.face_normals);
   this.centroid;
   this.calcCentroid();
   //initialize and calculate vertex and index arrays
   this.g_points_flat;
   this.flattenSOR();
   this.g_indices_flat;
   this.calcIndicesFlat();
   this.g_points_smooth;
   this.SORto1DArray();
   this.g_indices_smooth;
   this.calcIndicesSOR();
   //get rendering context,view,and shader programs
   this.gl = gl; 
   this.theView = theView;
   this.solidProg = solidProg;
   this.texProg = texProg;
   //initialize material properties
   this.showNormals = false;
   this.flatShading = false;
   this.picking = false;
   this.picked = false;
   this.specular = false;
   this.gloss = 10;
   this.color_diffuse = color;
   this.color_ambient= [.2,.2,.2,1.0];
   this.color_specular = [.9,.9,.9,1.0];
   //initialize texture properties
   this.texture = initTextures(this.gl,this.texProg,'sky_cloud.jpg');
   this.textured = false;
   this.tex_points;
   this.calcTexPoints();
   //initialize transformation matrix
   this.transformMat = new Matrix4(); //automatically initializes to identity matrix (no transform);
}

//use transformation matrix to generate the points for the surface of revolution
//builds a 2D array and returns it; each subarray represents a rotated curve
SOR_obj.prototype.SORcreatePoints = function(){
   var curveLen = this.g_points.length;
   this.SOR_points = [];
   this.SOR_points[0] = this.g_points;
   
	for (var angle = 10; angle < 360; angle += 10){
      var newCurve = [];
		var theta = (angle * Math.PI)/180; //convert to rad
		for (var i = 0; i < curveLen; i += 3){
			//extract vertices from g_points
			var x = this.g_points[i]; 
			var y = this.g_points[i+1];
			var z = this.g_points[i+2];
			
			//calculate transformation
			var newX = x*Math.cos(theta) - z*Math.sin(theta);
			var newZ = x*Math.sin(theta) + z*Math.cos(theta);
			
			//store coordinates to g_points array
			newCurve.push(newX); newCurve.push(y); newCurve.push(newZ);
		}
      this.SOR_points[this.SOR_points.length] = newCurve;
	}
}


SOR_obj.prototype.drawSOR = function(){   
   var g_points;
   var g_indices;
   var g_normals;
   var color;
   
   //if rendering only for object selection or with flat shading
   if (this.flatShading && !(this.textured)) {
      g_points = this.g_points_flat;
      g_indices = this.g_indices_flat; 
      g_normals = [];
      var n_len = this.g_face_normals.length;
      for (var i = 0; i < n_len; i+=3){
         for (var j = 0; j < 4; j++){
            g_normals.push(this.g_face_normals[i],this.g_face_normals[i+1],this.g_face_normals[i+2]);
         }
      }
   } else {
      g_points = this.g_points_smooth;
      g_indices = this.g_indices_smooth;
      g_normals = this.g_vertex_normals;
   }
   if (this.picked){
      color = [.5,.5,.5];
   } else {
	   color = this.color_diffuse;
   }
   if (this.picking) {
      g_colors = setColor(g_points,[this.ID/255,this.ID/255,this.ID/255]);   
   } else {
      g_colors = setColor(g_points,color);
   }
   //pass boolean flags and constants to shader
   gl.useProgram(this.solidProg);
   gl.uniform1i(this.solidProg.u_Selection,this.picking); //tell fshader not to apply lighting if doing picking
   gl.uniform1i(this.solidProg.u_Specular,this.specular); //toggle specular highlights
   gl.uniform1f(this.solidProg.u_Gloss,this.gloss);
   gl.uniform4fv(this.solidProg.u_Color_spec,this.color_specular);
   gl.uniform4fv(this.solidProg.u_Color_amb,this.color_ambient);
   gl.useProgram(this.texProg);
   gl.uniform1i(this.texProg.u_Specular,this.specular);
   gl.uniform1f(this.texProg.u_Gloss,this.gloss);
   gl.uniform4fv(this.texProg.u_Color_spec,this.color_specular);
     
   var normalXMat = new Matrix4(this.transformMat);
   normalXMat = normalXMat.invert();
   normalXMat = normalXMat.transpose();   
   if (this.textured){
      gl.useProgram(this.texProg);
      gl.uniformMatrix4fv(this.texProg.u_NormalMatrix, false, normalXMat.elements);
   } else {
      gl.useProgram(this.solidProg);
      gl.uniformMatrix4fv(this.solidProg.u_NormalMatrix, false, normalXMat.elements);
   }
   
   g_points = this.transform(g_points);
   
   var n;
   if (this.textured && !this.picking){
	  // Write the positions of vertices and indices to a vertex shader
	   n = updateVertexBuffersTex(this.gl,g_points,g_indices,this.g_vertex_normals,to1DArray(this.tex_points),this.texture,this.texProg);
	   if (n < 0) {
		  console.log('Failed to set the positions of the vertices');
	   return;
	   } 
   } else {   
	   // Write the positions of vertices and indices to a vertex shader
	   n = updateVertexBuffers(this.gl,g_points,g_indices,g_colors,g_normals,this.solidProg);
	   if (n < 0) {
		  console.log('Failed to set the positions of the vertices');
	   return;
	   }
	}
	
   // Draw the SOR
   this.gl.drawElements(this.gl.TRIANGLES, n, this.gl.UNSIGNED_SHORT, 0);
   
   if (this.showNormals){
      //calculate normals, attach them to vertices, and color
      var normal_points = this.anchorNormals(x_SOR_points,x_face_normals);
		var normal_indices = calcIndicesLine(normal_points);
		var normal_colors = setColor(normal_points,[1,0,0]);
      
      //draw the normals
      n = updateVertexBuffers(this.gl,normal_points,normal_indices,normal_colors);
      if (n < 0) {
         console.log('Failed to set the positions of the vertices');
         return;
      }
      this.gl.drawElements(this.gl.LINES, n, this.gl.UNSIGNED_SHORT, 0);

   }
}

//---------------------------------------------------------------------
// Functions for calculating vertices and indices
//---------------------------------------------------------------------

//return a 1D array of vertices from a 2D array representing an SOR
//copy by quadrilateral faces
SOR_obj.prototype.flattenSOR = function(){
   var len = this.SOR_points.length;
   var curveLen = this.SOR_points[0].length;
  
	//create single array from 2D arrays to pass to buffer
	this.g_points_flat = [];
	//specify quad faces from 2D array
	for (var i = 0; i < len-1; i++){
		for (var j = 0; j < curveLen; j+=3){
         //upper left vertex
         this.g_points_flat.push(this.SOR_points[i][j],this.SOR_points[i][j+1],this.SOR_points[i][j+2]);
         //lower left vertex
         this.g_points_flat.push(this.SOR_points[i][j+3],this.SOR_points[i][j+4],this.SOR_points[i][j+5]);
         //lower right vertex
         this.g_points_flat.push(this.SOR_points[i+1][j+3],this.SOR_points[i+1][j+4],this.SOR_points[i+1][j+5]);
         //upper right vertex
         this.g_points_flat.push(this.SOR_points[i+1][j],this.SOR_points[i+1][j+1],this.SOR_points[i+1][j+2]);
      }
   }
   
   //connect last set of faces from final curve to first curve
   var n = len-1;
   for (var j = 0; j < curveLen; j+=3){
      //upper left vertex
      this.g_points_flat.push(this.SOR_points[n][j],this.SOR_points[n][j+1],this.SOR_points[n][j+2]);
      //lower left vertex
      this.g_points_flat.push(this.SOR_points[n][j+3],this.SOR_points[n][j+4],this.SOR_points[n][j+5]);
      //lower right vertex
      this.g_points_flat.push(this.SOR_points[0][j+3],this.SOR_points[0][j+4],this.SOR_points[0][j+5]);
      //upper right vertex
      this.g_points_flat.push(this.SOR_points[0][j],this.SOR_points[0][j+1],this.SOR_points[0][j+2]);
	}
} 

SOR_obj.prototype.flattenNormals = function() {
	var len = this.face_normals.length;
    var curveLen = this.face_normals[0].length;
	
		//create single array from 2D arrays to pass to buffer
	this.g_normals_flat = [];
	//specify quad faces from 2D array
	for (var i = 0; i < len-1; i++){
		for (var j = 0; j < curveLen; j+=3){
         //upper left vertex
         this.g_normals_flat.push(this.face_normals[i][j],this.face_normals[i][j+1],this.face_normals[i][j+2]);
         //lower left vertex
         this.g_normals_flat.push(this.face_normals[i][j+3],this.face_normals[i][j+4],this.face_normals[i][j+5]);
         //lower right vertex
         this.g_normals_flat.push(this.face_normals[i+1][j+3],this.face_normals[i+1][j+4],this.face_normals[i+1][j+5]);
         //upper right vertex
         this.g_normals_flat.push(this.face_normals[i+1][j],this.face_normals[i+1][j+1],this.face_normals[i+1][j+2]);
      }
   }
   
   //connect last set of faces from final curve to first curve
   var n = len-1;
   for (var j = 0; j < curveLen; j+=3){
      //upper left vertex
      this.g_normals_flat.push(this.face_normals[n][j],this.face_normals[n][j+1],this.face_normals[n][j+2]);
      //lower left vertex
      this.g_normals_flat.push(this.face_normals[n][j+3],this.face_normals[n][j+4],this.face_normals[n][j+5]);
      //lower right vertex
      this.g_normals_flat.push(this.face_normals[0][j+3],this.face_normals[0][j+4],this.face_normals[0][j+5]);
      //upper right vertex
      this.g_normals_flat.push(this.face_normals[0][j],this.face_normals[0][j+1],this.face_normals[0][j+2]);
	}
}

//calculate vertex indices from a 2D array representing an SOR
SOR_obj.prototype.calcIndicesSOR = function(){
	this.g_indices_smooth = [];
	var curveLen = this.SOR_points[0].length/3;
	var len = this.SOR_points.length;
	
	//specify triangular faces from 2D array
	for (var i = 0; i < len-1; i+=1){
		for (var j = 0; j < curveLen-1; j+=1){
			//left triangle
			this.g_indices_smooth.push(i*curveLen + j); //upper left vertex
			this.g_indices_smooth.push(i*curveLen + j + 1); //lower left vertex
			this.g_indices_smooth.push((i+1)*curveLen + j); //upper right vertex
			
			//right triangle
			this.g_indices_smooth.push((i+1)*curveLen + j); //upper right vertex
			this.g_indices_smooth.push(i*curveLen + j + 1); //lower left vertex
			this.g_indices_smooth.push((i+1)*curveLen + j + 1); //lower right vertex
		}
	}
  
	//specify last set of faces from final curve to initial curve
	for (var j = 0; j < curveLen-1; j+=1){
		//left triangle
		this.g_indices_smooth.push((len-1)*curveLen + j); //upper left (last curve)
		this.g_indices_smooth.push((len-1)*curveLen + j + 1); //lower left (last curve)
		this.g_indices_smooth.push(j); //upper right vertex (first curve)
		
		//right triangle
		this.g_indices_smooth.push(j); //upper right vertex (first curve)
		this.g_indices_smooth.push((len-1)*curveLen + j + 1); //lower left (last curve)
		this.g_indices_smooth.push(j + 1); //lower right vertex (first curve)		
	}
}

SOR_obj.prototype.calcIndicesFlat = function(){
   this.g_indices_flat = [];
   var len = this.g_points_flat.length/3;
   for (var i = 0; i < len; i+=4){    
      this.g_indices_flat.push(i);
      this.g_indices_flat.push(i+1);
      this.g_indices_flat.push(i+3);
      
      this.g_indices_flat.push(i+1);
      this.g_indices_flat.push(i+2);
      this.g_indices_flat.push(i+3);
   }
}

//return SOR as a 1D list of vertices
SOR_obj.prototype.SORto1DArray = function(){
   this.g_points_smooth = [];
   var len = this.SOR_points.length;
   for (var i = 0; i < len; i+=1){
      this.g_points_smooth = this.g_points_smooth.concat(this.SOR_points[i]);
   }
}

//---------------------------------------------------------------------
// Functions for calculating normals
//---------------------------------------------------------------------

//calculate unit normals to faces and return a 2D array of normals
SOR_obj.prototype.calcNormals = function(){
   var curveLen = this.SOR_points[0].length;
   var len = this.SOR_points.length;
   this.face_normals = [];
   
	for (var i = 0; i < len-1; i++){
      this.face_normals[i] = [];
		for (var j = 0; j < curveLen; j+=3){
			//upper left vertex
         var p0 = [ this.SOR_points[i][j], this.SOR_points[i][j+1], this.SOR_points[i][j+2] ];
         //lower left vertex
         var p1 = [ this.SOR_points[i][j+3], this.SOR_points[i][j+4], this.SOR_points[i][j+5] ];
         //upper right vertex
         var p2 = [ this.SOR_points[i+1][j], this.SOR_points[i+1][j+1], this.SOR_points[i+1][j+2] ];
         
         var normal = calcNormal(p0,p1,p2);
         //push points to array
         for (var k = 0; k < normal.length; k++){
            this.face_normals[i].push(normal[k]);
         }
      }
   }
   
   //connect last set of faces from final curve to first curve
   var n = len-1;
   this.face_normals[n] = [];
   for (var j = 0; j < curveLen; j+=3){
      //upper left vertex
      var p0 = [ this.SOR_points[n][j], this.SOR_points[n][j+1], this.SOR_points[n][j+2] ];
      //lower left vertex
      var p1 = [ this.SOR_points[n][j+3], this.SOR_points[n][j+4], this.SOR_points[n][j+5] ];
      //upper right vertex
      var p2 = [ this.SOR_points[0][j],this.SOR_points[0][j+1],this.SOR_points[0][j+2] ];
      
      var normal = calcNormal(p0,p1,p2);
      //push points to array
      for (var k = 0; k < normal.length; k++){
         this.face_normals[n].push(normal[k]);
      }
	}
}

SOR_obj.prototype.calcVertexNormals = function(){
	this.vertex_normals = [];
   var curveLen = this.face_normals[0].length;
	var len = this.face_normals.length;
   var norm_x, norm_y, norm_z;
   
   for (var i = 0; i < len; i++){
      this.vertex_normals[i] = [];
      norm_x = 0.0; 
      norm_y = 0.0; 
      norm_z = 0.0;
		for (var j = 0; j < curveLen; j+=3){
         //add normal from face below, if it exists
         if (j < curveLen){
            norm_x += this.face_normals[i][j];
            norm_y += this.face_normals[i][j+1];
            norm_z += this.face_normals[i][j+2];
         }
         //add normal from face above, if it exists
         if (j > 0){
            norm_x += this.face_normals[i][j-3];
            norm_y += this.face_normals[i][j-2];
            norm_z += this.face_normals[i][j-1];
         }
         //add normal from face to left
         if (i > 0) {
            norm_x += this.face_normals[i-1][j];
            norm_y += this.face_normals[i-1][j+1];
            norm_z += this.face_normals[i-1][j+2];         
         } else { //wrap around to last curve
            norm_x += this.face_normals[len-1][j];
            norm_y += this.face_normals[len-1][j+1];
            norm_z += this.face_normals[len-1][j+2];  
         }
         
         var v = new Vector3([norm_x,norm_y,norm_z]);
         v.normalize();
         var v1 = v.elements;
         this.vertex_normals[i].push(v1[0],v1[1],v1[2]);
      }
   }
}

SOR_obj.prototype.anchorNormals = function(SOR_points,normal_points){
   var curveLen = SOR_points[0].length;
	var len = SOR_points.length;
   var scale = 30;
   var x,y,z;
	
	var normal_lines = [];
	
	for (var i = 0; i < len-1; i++){
		for (var j = 0; j <= curveLen; j+=3){
         x = SOR_points[i][j];
         y = SOR_points[i][j+1];
         z = SOR_points[i][j+2];
         normal_lines.push(x,y,z);
         normal_lines.push(x+scale*normal_points[i][j], y+scale*normal_points[i][j+1], z+scale*normal_points[i][j+2]);
      }
	}
   
   return normal_lines;
}

SOR_obj.prototype.calcTexPoints = function() {
   var len = this.SOR_points.length;
   var curveLen = this.SOR_points[0].length/3;
   this.tex_points = [];
   var tex_x,tex_y;
	for (var i = 0; i < len; i++){
      this.tex_points[i] = [];
		for (var j = 0; j < curveLen; j++){
         tex_x = i/(len-1);
         tex_y = j/curveLen;
         this.tex_points[i].push(tex_x,tex_y);
      }
	}
}

//-----------------------------------------------------
// Transformations
//-----------------------------------------------------

SOR_obj.prototype.translate = function(x,y,z) {
   trslMat = new Matrix4();
   trslMat.setTranslate(x,y,z);
   //append to end of translations to move in world coordinates rather than local coordinates
   trslMat.multiply(this.transformMat);
   this.transformMat = trslMat;
}

SOR_obj.prototype.scale = function(s) {
   sclMat = new Matrix4();
   sclMat.setScale(s,s,s);//uniform scaling in 3 dimensions
   this.transformMat.multiply(sclMat);
}

SOR_obj.prototype.rotateZ = function(angle){
   rotMat = new Matrix4();
   rotMat.setRotate(angle,0,0,1);
   this.transformMat.multiply(rotMat);
}

SOR_obj.prototype.rotateX = function(angle){
   rotMat = new Matrix4();
   rotMat.setRotate(angle,1,0,0);
   this.transformMat.multiply(rotMat);
}

//transform actual vertices to be rendered
SOR_obj.prototype.transform = function(g_points){
   var len = g_points.length;
   var g_points_new = [];
   var v,v_new,v_elems;
   //transform points
   for (var i = 0; i < len; i+=3){
      v = new Vector4([g_points[i],g_points[i+1],g_points[i+2],1]);
      v_new = this.transformMat.multiplyVector4(v);
      v_elems = v_new.elements;
      g_points_new.push(v_elems[0],v_elems[1],v_elems[2]);
   }
   
   return g_points_new;
}

//transform 2D array of normals
SOR_obj.prototype.transformNormals = function(normal_points){
   var len = normal_points.length;
   var curveLen = normal_points[0].length;
   var normal_points_new = [];
   var v,v_new,v_elems;
   var normalXMat = new Matrix4(this.transformMat);
   normalXMat = normalXMat.invert();
   normalXMat = normalXMat.transpose();
   for (var i = 0; i < len; i++){
      normal_points_new[i] = [];
      for (var j = 0; j < curveLen; j+=3){
         v = new Vector4([normal_points[i][j],normal_points[i][j+1],normal_points[i][j+2],1]);
         v_new = normalXMat.multiplyVector4(v);
         v_elems = v_new.elements;
         
         var c = new Vector3([v_elems[0],v_elems[1],v_elems[2]]);
         c.normalize();
         var c_elems = c.elements;
         
         normal_points_new[i].push(c_elems[0],c_elems[1],c_elems[2]);
      }
   }
   return normal_points_new;
}

//transform 2D array of vertices
SOR_obj.prototype.transformSOR = function(SOR_points){
   var len = SOR_points.length;
   var curveLen = SOR_points[0].length;
   var SOR_points_new = [];
   var v,v_new,v_elems;
   for (var i = 0; i < len; i++){
      SOR_points_new[i] = [];
      for (var j = 0; j < curveLen; j+=3){
         v = new Vector4([SOR_points[i][j],SOR_points[i][j+1],SOR_points[i][j+2],1]);
         v_new = this.transformMat.multiplyVector4(v);
         v_elems = v_new.elements;
         SOR_points_new[i].push(v_elems[0],v_elems[1],v_elems[2]);
      }
   }
   return SOR_points_new;
}

//average all coordinates to find the centroid
SOR_obj.prototype.calcCentroid = function(){
   var len = this.SOR_points.length;
   var curveLen = this.SOR_points[0].length;
   var totLen = len*curveLen/3; //total number of vertices
   var x=0,y=0,z=0;
   for (var i = 0; i < len; i++){
      for (var j = 0; j < curveLen; j+=3){
         x+=this.SOR_points[i][j];
         y+=this.SOR_points[i][j+1];
         z+=this.SOR_points[i][j+2];
      }
   }
   x = x/totLen;
   y = y/totLen;
   z = z/totLen;
   this.centroid = [x,y,z];
}

SOR_obj.prototype.getCentroid = function() {
   //transform centroid
   v = new Vector4([this.centroid[0],this.centroid[1],this.centroid[2],1]);
   v_new = this.transformMat.multiplyVector4(v);
   return v_new.elements;
}

SOR_obj.prototype.updateTex = function(texName) {
   gl.useProgram(this.texProg);
	this.texture = initTextures(this.gl,this.texProg,texName);
}
   

  
   

