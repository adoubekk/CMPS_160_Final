// view.js
// prototype for a view object

var View = function(gl,solidProg,texProg) {
	this.gl = gl;
	this.fov = 60;
	this.lookFrom = [0,0,1000];
	this.lookAt = [0,0,0];
	this.up = [0,1,0];
	this.ortho = [-500.0,500.0,-500.0,500.0,-500.0,500.0];
	this.type = "ortho";
   this.lookFromRestore = this.lookFrom;
   this.lookAtRestore = this.lookAt;
   this.solidProg = solidProg;
   this.texProg = texProg;
}

View.prototype.set = function(){
   
   var mvpMatrix = new Matrix4();
   switch (this.type){
		case "ortho":
			//render an orthographic projection
			mvpMatrix.setOrtho(this.ortho[0],this.ortho[1],this.ortho[2],this.ortho[3],this.ortho[4],this.ortho[5]);
			break;
		case "persp":
			// Set the eye point and the viewing volume
			mvpMatrix.setPerspective(this.fov, 1, 1, 1500);
			mvpMatrix.lookAt(this.lookFrom[0], this.lookFrom[1], this.lookFrom[2], this.lookAt[0], this.lookAt[1], this.lookAt[2], this.up[0], this.up[1], this.up[2]);
			break;
		default:
			console.log("invalid view type");
   }
   
  // Pass the model view projection matrix to u_MvpMatrix in both shader programs
   gl.useProgram(this.solidProg); 
   gl.uniformMatrix4fv(this.solidProg.u_MvpMatrix, false, mvpMatrix.elements);
   gl.uniform3fv(this.solidProg.u_EyePosition,this.getPosition());
   gl.useProgram(this.texProg);
   gl.uniformMatrix4fv(this.texProg.u_MvpMatrix, false, mvpMatrix.elements);
   gl.uniform3fv(this.texProg.u_EyePosition,this.getPosition());
}

View.prototype.zoom = function(delta){
	this.fov += delta;
	if (this.fov < 1){
		this.fov = 1;
	}
	this.set();
}

View.prototype.setType = function(type) {
	this.type = type;
	this.set();
}

View.prototype.pan = function (x,y,z){
	//perspective coordinates
	this.lookFrom[0] += x;
	this.lookAt[0] += x;
	this.lookFrom[1] += y;
	this.lookAt[1] += y;
	this.lookFrom[2] += z;
	this.lookAt[2] += z;
	//orthographic coordinates
	this.ortho[0] += x; //left x bound
	this.ortho[1] += x; //right x bound
	this.ortho[2] += y; //lower y bound
	this.ortho[3] += y; //upper y bound
	this.ortho[4] += z; //near z bound
	this.ortho[5] += z; //far z bound
	this.set();
}

//return a normalized view vector
View.prototype.getDirection = function(){
   var vX,vY,vZ;
   if (this.type == "persp"){
      vX = this.lookFrom[0] - this.lookAt[0];
      vY = this.lookFrom[1] - this.lookAt[1];
      vZ = this.lookFrom[2] - this.lookAt[2];
   } else {
      vX = 0;
      vY = 0;
      vZ = 1;
   }
   var v = new Vector3([vX,vY,vZ]);
   v.normalize();
   var v1 = v.elements;
   printPoints(v1);
   return v1;
}

//return the lookFrom position
View.prototype.getPosition = function(){
   if (this.type == "persp"){
      return this.lookFrom;
   } else {
      return [0,0,100000];
   }
}

View.prototype.examine = function(SOR_obj,theta,r){
   this.lookAt = SOR_obj.getCentroid();
   this.lookFrom[0] = this.lookAt[0] + r*Math.cos(theta);
	this.lookFrom[1] = this.lookAt[1];
   this.lookFrom[2] = this.lookAt[2] + r*Math.sin(theta);
   this.set();
}

View.prototype.lookAround = function(SOR_obj,theta,r){
   this.lookFrom = SOR_obj.getCentroid();
   this.lookAt[0] = this.lookFrom[0] + r*Math.cos(theta);
	this.lookAt[1] = this.lookFrom[1];
   this.lookAt[2] = this.lookFrom[2] + r*Math.sin(theta);
   this.set();  
}

//set a position to return the view to
View.prototype.setRestore = function() {
   this.lookAtRestore = this.lookAt.slice(); //slice() copies array
   this.lookFromRestore = this.lookFrom.slice();
}

//return the view to retore point
View.prototype.restore = function() {
   this.lookAt = this.lookAtRestore.slice();
   this.lookFrom = this.lookFromRestore.slice();
   this.set();
}

View.prototype.restoreDefault = function() {
   this.lookAt = [0,0,0];
   this.lookFrom = [0,0,1000];
   this.set();
}
  
