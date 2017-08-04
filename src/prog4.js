// prog4.js
// (nearly) correct texture mapping to SOR surface

// Vertex shader program
var VSHADER_SOURCE =
   'attribute vec4 a_Position;\n' +
   'attribute vec4 a_Color_diff;\n' +
   'attribute vec4 a_Normal;\n' +
   'uniform mat4 u_MvpMatrix;\n' +
   'varying vec4 v_Color_diff;\n' +
   'varying vec4 v_Normal;\n' +
   'varying vec4 v_Position;\n' +
   'void main() {\n' +
   '  vec4 position = u_MvpMatrix * a_Position;\n' +
   '  gl_Position = position;\n' +
   '  v_Position = a_Position;\n' +
   '  gl_PointSize = 5.0;\n' +
   '  v_Color_diff = a_Color_diff;\n' +
   '  v_Normal = a_Normal;\n' +
   '}\n';

// Fragment shader program
var FSHADER_SOURCE =
   '#ifdef GL_ES\n' +
   'precision mediump float;\n' +
   '#endif\n' +
   '#define MAXLIGHTS 16\n' +
   'uniform bool u_Specular;\n' +
   'uniform bool u_Selection;\n' +
   'uniform bool u_Direct;\n' +
   'uniform mat4 u_NormalMatrix;\n' +
   'uniform vec3 u_EyePosition;\n' +
   'uniform int u_PointLight_Count;\n' +
   'uniform vec3 u_PointLight[3*MAXLIGHTS];\n' +
   'uniform vec4 u_PointLight_Color[3*MAXLIGHTS];\n' +
   'uniform vec4 u_Color_spec;\n' +
   'uniform vec4 u_Color_amb;\n' +
   'uniform float u_Gloss;\n' +
   'varying vec4 v_Color_diff;\n' +
   'varying vec4 v_Normal;\n' +
   'varying vec4 v_Position;\n' +
   'void main() {\n' +
   '  if (u_Selection) {\n' +
   '    gl_FragColor = v_Color_diff;\n' +
   '  } else {\n' +
   '    vec4 normal_temp = u_NormalMatrix * v_Normal;\n' +
   '    vec3 normal = normalize(normal_temp.xyz);\n' +
   '    vec3 eyeDir = normalize(u_EyePosition - v_Position.xyz);\n' +
   '    float spec_weight=0.0,diff_weight=0.0;\n' +
   //Directional Lighting
   '    if (u_Direct){\n' +
   '      vec3 lightDir = normalize(vec3(1.0,1.0,1.0));\n' +
   '      if (u_Specular) {\n' +
   '        vec3 reflDir = normalize(reflect(-lightDir,normal));\n' +
   '        spec_weight += pow(max(dot(reflDir,eyeDir),0.0),u_Gloss);\n' +
   '      }\n' +
   '      diff_weight += max(dot(normal.xyz, lightDir), 0.0);\n' +  
   '    }\n' +
   //Point Lighting
   '    int lightCount = u_PointLight_Count;\n' +
   '    if (u_PointLight_Count > 0){\n' +
   '      for(int i = 0; i < MAXLIGHTS; i++){\n' +
   '        vec3 pointLightDir = normalize(u_PointLight[i] - v_Position.xyz);\n' +
   '        if (u_Specular) {\n' +
   '          vec3 reflDirPoint = normalize(reflect(-pointLightDir,normal));\n' +
   '          spec_weight += pow(max(dot(reflDirPoint,eyeDir),0.0),u_Gloss);\n' +
   '        }\n' +
   '       diff_weight += max(dot(normal.xyz, pointLightDir), 0.0);\n' +  
   '       if (i > lightCount){\n' +
   '          break;\n' + //workaround for GPUs that don't support dynamic looping
   '       }\n' +
   '     }\n' +
   '   }\n' +
   '    spec_weight = min(spec_weight,1.0);\n' +
   '    diff_weight = min(diff_weight,1.0);\n' +
   '    vec4 color_apparent = u_Color_amb + v_Color_diff * diff_weight + u_Color_spec * spec_weight;\n' +
   '    color_apparent.r = min(color_apparent.r,1.0);\n' +
   '    color_apparent.g = min(color_apparent.g,1.0);\n' +
   '    color_apparent.b = min(color_apparent.b,1.0);\n' +
   '    gl_FragColor = color_apparent;\n' +
   '  }\n' +
   '}\n'
   
// Vertex shader for texture drawing
var TEXTURE_VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Normal;\n' +
  'attribute vec2 a_TexCoord;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'varying vec4 v_Normal;\n' +
  'varying vec4 v_Position;\n' +
  'varying vec2 v_TexCoord;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
  '  v_Normal = a_Normal;\n' +
  '  v_Position = a_Position;\n' +
  '  v_TexCoord = a_TexCoord;\n' +
  '}\n';

// Fragment shader for texture drawing
var TEXTURE_FSHADER_SOURCE =

   '#ifdef GL_ES\n' +
   'precision mediump float;\n' +
   '#endif\n' +
   '#define MAXLIGHTS 16\n' +
   'uniform sampler2D u_Sampler;\n' +
   'uniform bool u_Specular;\n' +
   'uniform bool u_Direct;\n' +
   'uniform float u_Gloss;\n' +
   'uniform vec3 u_EyePosition;\n' +
   'uniform mat4 u_NormalMatrix;\n' +
   'uniform vec4 u_Color_spec;\n' +
   'uniform int u_PointLight_Count;\n' +
   'uniform vec3 u_PointLight[3*MAXLIGHTS];\n' +
   'uniform vec4 u_PointLight_Color[3*MAXLIGHTS];\n' +
   'varying vec2 v_TexCoord;\n' +
   'varying vec4 v_Normal;\n' +
   'varying vec4 v_Position;\n' +
   'void main() {\n' +
   '  vec3 lightDirection = vec3(1.0, 1.0, 1.0);\n' + 
   '  vec4 color = texture2D(u_Sampler, v_TexCoord);\n' +
   '  vec4 normal_temp = u_NormalMatrix * v_Normal;\n' +
   '  vec3 normal = normalize(normal_temp.xyz);\n' +
   '  vec3 eyeDir = normalize(u_EyePosition - v_Position.xyz);\n' +
   '  float spec_weight=0.0,diff_weight=0.0;\n' +
   //Directional Lighting
   '  if (u_Direct){\n' +
   '    vec3 lightDir = normalize(vec3(1.0,1.0,1.0));\n' +
   '    if (u_Specular) {\n' +
   '      vec3 reflDir = normalize(reflect(-lightDir,normal));\n' +
   '      spec_weight += pow(max(dot(reflDir,eyeDir),0.0),u_Gloss);\n' +
   '    }\n' +
   '    diff_weight += max(dot(normal.xyz, lightDir), 0.0);\n' +  
   '  }\n' +
   //Point Lighting
   '  int lightCount = u_PointLight_Count;\n' +
   '  if (lightCount > 0){\n' +
   '    for(int i = 0; i < MAXLIGHTS; i++){\n' +
   '      vec3 pointLightDir = normalize(u_PointLight[i] - v_Position.xyz);\n' +
   '      if (u_Specular) {\n' +
   '        vec3 reflDirPoint = normalize(reflect(-pointLightDir,normal));\n' +
   '        spec_weight += pow(max(dot(reflDirPoint,eyeDir),0.0),u_Gloss);\n' +
   '      }\n' +
   '     diff_weight += max(dot(normal.xyz, pointLightDir), 0.0);\n' +  
   '     if (i > lightCount){\n' +
   '       break;\n' + //workaround for GPUs that don't support dynamic looping
   '     }\n' +
   '   }\n' +
   ' }\n' +
   '  spec_weight = min(spec_weight,1.0);\n' +
   '  diff_weight = min(diff_weight,1.0);\n' +
   '  vec3 color_apparent = color.rgb * diff_weight + u_Color_spec.rgb * spec_weight;\n' +
   '  color_apparent.r = min(color_apparent.r,1.0);\n' +
   '  color_apparent.g = min(color_apparent.g,1.0);\n' +
   '  color_apparent.b = min(color_apparent.b,1.0);\n' +
   '  gl_FragColor = vec4(color_apparent,1.0);\n' +
   '}\n';

function main() {
   // Retrieve <canvas> element
   var canvas = document.getElementById('webgl');

   // Get the rendering context for WebGL
   gl =  WebGLUtils.setupWebGL(canvas,{preserveDrawingBuffer: true})
   if (!gl) {
      console.log('Failed to get the rendering context for WebGL');
      return;
   }
  // Initialize shaders
  var solidProgram = createProgram(gl, VSHADER_SOURCE, FSHADER_SOURCE);
  var texProgram = createProgram(gl, TEXTURE_VSHADER_SOURCE, TEXTURE_FSHADER_SOURCE);
  if (!solidProgram || !texProgram) {
    console.log('Failed to intialize shaders.');
    return;
  }
  
   solidProgram.a_Position = gl.getAttribLocation(solidProgram, 'a_Position');
   solidProgram.a_Normal = gl.getAttribLocation(solidProgram, 'a_Normal');
   solidProgram.u_MvpMatrix = gl.getUniformLocation(solidProgram, 'u_MvpMatrix');
   solidProgram.u_NormalMatrix = gl.getUniformLocation(solidProgram, 'u_NormalMatrix');
   solidProgram.u_EyePosition = gl.getUniformLocation(solidProgram, 'u_EyePosition');
   solidProgram.a_Color_diff = gl.getAttribLocation(solidProgram, 'a_Color_diff');
   solidProgram.u_Color_spec = gl.getUniformLocation(solidProgram, 'u_Color_spec');
   solidProgram.u_Color_amb = gl.getUniformLocation(solidProgram, 'u_Color_amb');
   solidProgram.u_Selection = gl.getUniformLocation(solidProgram, 'u_Selection');
   solidProgram.u_Specular = gl.getUniformLocation(solidProgram, 'u_Specular');
   solidProgram.u_Gloss = gl.getUniformLocation(solidProgram, 'u_Gloss');
   solidProgram.u_Direct = gl.getUniformLocation(solidProgram, 'u_Direct');
   solidProgram.u_PointLight = gl.getUniformLocation(solidProgram, 'u_PointLight');
   solidProgram.u_PointLight_Color = gl.getUniformLocation(solidProgram, 'u_PointLight_Color');
   solidProgram.u_PointLight_Count = gl.getUniformLocation(solidProgram, 'u_PointLight_Count');
   //solidProgram.u_LightDir = gl.getAttribLocation(solidProgram, 'u_LightDir');
   
   gl.useProgram(solidProgram);
   gl.uniform1i(solidProgram.u_Direct,true);
   
   // Get storage locations of attribute and uniform variables in program object for texture drawing
   texProgram.a_Position = gl.getAttribLocation(texProgram, 'a_Position');
   texProgram.a_Normal = gl.getAttribLocation(texProgram, 'a_Normal');
   texProgram.a_TexCoord = gl.getAttribLocation(texProgram, 'a_TexCoord');
   texProgram.u_MvpMatrix = gl.getUniformLocation(texProgram, 'u_MvpMatrix');
   texProgram.u_NormalMatrix = gl.getUniformLocation(texProgram, 'u_NormalMatrix');
   texProgram.u_Sampler = gl.getUniformLocation(texProgram, 'u_Sampler');
   texProgram.u_EyePosition = gl.getUniformLocation(texProgram, 'u_EyePosition');
   texProgram.u_Gloss = gl.getUniformLocation(texProgram, 'u_Gloss');
   texProgram.u_Specular = gl.getUniformLocation(texProgram, 'u_Specular');
   texProgram.u_Color_spec = gl.getUniformLocation(texProgram, 'u_Color_spec');
   texProgram.u_Direct = gl.getUniformLocation(texProgram, 'u_Direct');
   texProgram.u_PointLight = gl.getUniformLocation(texProgram, 'u_PointLight');
   texProgram.u_PointLight_Color = gl.getUniformLocation(texProgram, 'u_PointLight_Color');
   texProgram.u_PointLight_Count = gl.getUniformLocation(texProgram, 'u_PointLight_Count');
   
   gl.useProgram(texProgram);
   gl.uniform1i(texProgram.u_Direct,true);
    
   // Specify the color for clearing <canvas>
   gl.clearColor(1, 1, 1, 1);
   gl.enable(gl.DEPTH_TEST);
   
   var view = "ortho";
   var theView = new View(gl,solidProgram,texProgram);
   theView.setType(view);

   // Clear <canvas>
   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

   //register function (event handler) to be called on a mouse press
   canvas.onmousedown = function(ev) { click(ev, gl, canvas); };
  
   //register function to be called when mouse is moved
   canvas.onmousemove = function(ev) { move(ev, gl, canvas); };
   
   //register function to be called on a mouse up
   canvas.onmouseup = function(ev) { release(ev, gl, canvas); };
   
   //register function to be called on a mouse wheel
   canvas.onwheel = function(ev) { scroll(ev, gl, canvas); };
   
   //register function to be called on a double click
   canvas.ondblclick = function(ev) { doubleClick(ev, gl, canvas); };
   
   // Disable the right click context menu
   // From Oliver Davies' post on Piazza
   canvas.addEventListener('contextmenu', function(e)
   {
      if(e.button == 1 || e.button == 2) {
         e.preventDefault();
         return false;
      }
   }, false); 
   
   //setup file input listener
   setupIOSOR("fileinput");
   
   //get input from buttons and sliders
   document.getElementById("updateScreen").addEventListener('click', updateScreen);  
   document.getElementById("saveSOR").addEventListener('click',saveSOR);
   document.getElementById("drawSOR").addEventListener('click',drawNew);
   document.getElementById("toggleNormals").addEventListener('click',toggleNormals);
   document.getElementById("toggleShading").addEventListener('click',toggleShading);
   document.getElementById("toggleSpecular").addEventListener('click',toggleSpecular);
   document.getElementById("switchView").addEventListener('click',switchView);
   document.getElementById("toggleDirec").addEventListener('click',toggleDirec);
   document.getElementById("toggleTexture").addEventListener('click',toggleTex);
   document.getElementById("addPointSrc").addEventListener('click',addPointSrc);
   document.getElementById("togglePointSrc").addEventListener('click',togglePointSrc);
   
   var texFile = document.getElementById("texFile")
   texFile.addEventListener('change',uploadTex);
   
   var glossSlider = document.getElementById("glossSlider");
   glossSlider.addEventListener('change',changeGloss);
   glossSlider.value = 1;
   
   var colorPicker = document.getElementById("colorPicker");
   colorPicker.addEventListener('change',changeColor);
   colorPicker.value = '#ff0000';
   
   var g_points = []; //array for mouse press locations
   var color = [1.0,0.0,0.0];
   var complete = false;
   var scale = 500.0;
   var objs = [];
   var srcs = [new pointLight([0.0,500.0,0.0],[1.0,1.0,0.0],solidProgram)] //default point light at (0,500,0);
   var cur = -1; //currently selected object
   var cur_L = -1; //currently selected light
   var direct = true;
   //boolean flags for active translations
   var translatingXY = false;
   var translatingZ = false;
   var rotating = false;
   var panningXY = false;
   var panningZ = false;
   var examining = false;
   var lookingAround = false;
   var thetaEx = 0; //angle for examining and lookAround
   var x_prev;
   var y_prev;
   
   tick();
   
   function click(ev, gl, canvas) {
      var x = ev.clientX; //x coord of mouse pointer
      var y = ev.clientY; //y coord of mouse pointer
      var rect = ev.target.getBoundingClientRect();
      
      if (examining || lookingAround){
         examining = false; //cancel examine and lookAround actions on any other action
         lookingAround = false;
         cur = -1;
         theView.restore(); //return view to previous position
         draw(gl,objs,srcs,solidProgram,texProgram);
      }
      
      if (ev.button == 0){ // left mouse
         if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom && complete) {
            // If pressed position is inside <canvas>, check if it is above object
            var x_in_canvas = x - rect.left, y_in_canvas = rect.bottom - y;
            var pickedID = checkClicked(gl, objs, x_in_canvas, y_in_canvas);
            if (pickedID >= 0){
               console.log("Picked object with index " + pickedID);
               if (cur!=pickedID){ //if a different object is already selected
                  if (cur >=0){
                     objs[cur].picked = false;
                  } else if (cur_L >=0){
                     srcs[cur_L].picked = false;
                     cur_L = -1;
                  }
               }
               cur = pickedID; //update to currently selected object
               objs[cur].picked = true;
               
            } else { //may have selected light
               if (cur>=0){
                  objs[cur].picked = false; //deselected current object
                  cur = -1;
               }
               var pickedID_L = checkClicked_Light(gl, srcs, x_in_canvas, y_in_canvas);
               if (pickedID_L >=0){
                  console.log("Picked light with index " + pickedID_L);
                  if (cur_L != pickedID_L && cur_L >= 0){
                     srcs[cur_L].picked = false;
                  }
                  cur_L = pickedID_L;
                  srcs[cur_L].picked = true;          
               } else if (cur_L >=0) {
                  srcs[cur_L].picked = false;
                  cur_L = -1;
               }  
            }

            draw(gl,objs,srcs,solidProgram,texProgram);
         }
        
         //translate JS coordinates to webGL coordinates
         x = scale*((x - rect.left) - canvas.width/2)/(canvas.width/2); 
         y = scale*(canvas.height/2 - (y - rect.top))/(canvas.height/2);  
         console.log('Mouse position: (' + x + ',' + y + ',' + '0' + ')'); //echo mouse position      
         
		 //if object is selected, translate it
         if (cur >=0 || cur_L >=0){
            translatingXY = true;
         } else if (complete){ //else pan the view
			 panningXY = true;
		 }
         
         //write coordinates to the array if polyline is not complete
         if (!complete){
            //store coordinates to g_points array
            g_points.push(x); g_points.push(y); g_points.push(0);
            
            //update drawing
            drawLines(gl,g_points,color,solidProgram);
         }
      }
      
	  //middle mouse press
      if (ev.button == 1) {
         //if there is an object currently selected
		 if (cur >=0 || cur_L >=0){
            translatingZ = true;
         } else {
			 panningZ = true;
		 }
      }
      
      //right mouse
      if (ev.button == 2) { //right click code 
         //if drawing, end polyline and generate SOR
         if (!complete){
            //scale down SOR
            for (var i = 0; i < g_points.length; i++){
               g_points[i] = .5*g_points[i]; 
            }
            printPoints(g_points);
            complete = true;
            SOR.color_diffuse = color.slice();
            var SOR1 = new SOR_obj(g_points,gl,theView,solidProgram,texProgram,color);
            objs.push(SOR1);
            theView.setType(view);
            draw(gl,objs,srcs,solidProgram,texProgram);
         } else if (cur >= 0) {
            if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom && complete) {
               // If pressed position is inside <canvas>, check if it is above object
               var x_in_canvas = x - rect.left, y_in_canvas = rect.bottom - y;
               var pickedID = checkClicked(gl, objs, x_in_canvas, y_in_canvas);
               if (pickedID == -1){ //if the background was clicked
                  thetaEx = Math.PI/2;
                  theView.setRestore();
                  examining = true;
                  objs[cur].picked = false;
               } else {
                  rotating = true;
               }
               draw(gl,objs,srcs,solidProgram,texProgram);
            }
         }
      } 
   }
  

   function move(ev,gl,canvas){
      var x = ev.clientX; //x coord of mouse pointer
      var y = ev.clientY; //y coord of mouse pointer
      var rect = ev.target.getBoundingClientRect();
     
      //translate JS coordinates to webGL coordinates
      x = scale*((x - rect.left) - canvas.width/2)/(canvas.width/2); 
      y = scale*(canvas.height/2 - (y - rect.top))/(canvas.height/2);
      
      if (translatingXY) {
         if (cur >=0){
            objs[cur].translate(x-x_prev,y-y_prev,0);
         } else if (cur_L >=0){
            srcs[cur_L].translate(x-x_prev,y-y_prev,0);            
         }
         draw(gl,objs,srcs,solidProgram,texProgram);
      }
      
      if (translatingZ) {
         if (cur >=0) {
            objs[cur].translate(0,0,y-y_prev);
         } else if (cur_L >=0){
            srcs[cur_L].translate(0,0,y-y_prev);
         }
         draw(gl,objs,srcs,solidProgram,texProgram);
      }
	  
	  if (panningXY) {
		  theView.pan(x-x_prev,y-y_prev,0);
		  draw(gl,objs,srcs,solidProgram,texProgram);
      }
	  
      if (rotating) {
         objs[cur].rotateZ(x_prev-x);
         objs[cur].rotateX(y_prev-y);
         draw(gl,objs,srcs,solidProgram,texProgram);
      }
      
      if (!complete){
         //remove previous mouse position from buffer array
         g_points.pop(); g_points.pop(); g_points.pop();
      
         //store coordinates to g_points array
         g_points.push(x); g_points.push(y); g_points.push(0);
      
         drawLines(gl,g_points,color,solidProgram);
      }
      
      x_prev = x;
      y_prev = y;
   }
   
   function scroll(ev,gl,canvas){
	   //ev.deltaY for one click differs between browsers, provide general compatibility
	   if (ev.deltaY > 0) {
		   delta = 100;
	   } else {
			delta = -100;
		}
      //if there is a currently selected object, scale it
	  if (cur >=0){
         objs[cur].scale(1-.001*delta); 
         draw(gl,objs,srcs,solidProgram,texProgram);
      } else if (panningZ) { //pan in the z direction
         theView.pan(0,0,delta);
         draw(gl,objs,srcs,solidProgram,texProgram);
	  } else if (complete) {
		theView.zoom(.02*delta);
		draw(gl,objs,srcs,solidProgram,texProgram);
	  }
   }
   
   function release(ev,gl,canvas){
      //if any translation flags are active, disable them
      translatingXY = false;
      translatingZ = false;
      rotating = false;
      panningXY = false;
      panningZ = false;

      if (complete){
         draw(gl,objs,srcs,solidProgram,texProgram);
      }
   }
   
   function doubleClick(ev,gl,canvas){
      if (examining || lookingAround){
         examining = false; //cancel examine and lookAround actions on any other action
         lookingAround = false;
         theView.restore(); //return view to previous position
      }
      var x = ev.clientX; //x coord of mouse pointer
      var y = ev.clientY; //y coord of mouse pointer
      var rect = ev.target.getBoundingClientRect();
      
      if (ev.button == 0){ // left mouse
         if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom && complete) {
            // If pressed position is inside <canvas>, check if it is above object
            var x_in_canvas = x - rect.left, y_in_canvas = rect.bottom - y;
            var pickedID = checkClicked(gl, objs, x_in_canvas, y_in_canvas);
            if (pickedID >= 0){
               console.log("Picked object with index " + pickedID);
               if (cur!=pickedID && cur>=0){
                  objs[cur].picked = false;
               }
               cur = pickedID;
               thetaEx = 0;
               lookingAround = true;
               objs[cur].picked = false;
               theView.setRestore();
            } else if (cur>=0) {
               objs[cur].picked = false;
               cur = -1;
            }
         }
      }
      draw(gl,objs,srcs,solidProgram,texProgram);
   }
   
   //this function assumes the object to be read in is an SOR created by this program
   function updateScreen(){
      var sorObject = readFile();
      
      complete = true;
      
      var vertices = sorObject.vertices;
      var g_points_temp = []
      //create new SOR object from contents of file
      var len = vertices.length/36;
      for (var i = 0; i < len; i++){
         g_points_temp.push(vertices[i]);
      }
      
      var SOR1 = new SOR_obj(g_points_temp,gl,theView,solidProgram,texProgram);
      objs.push(SOR1);
      draw(gl,objs,srcs,solidProgram,texProgram);
   }
   
   function saveSOR(){
      if (cur >= 0){
         var vertices = Float32Array.from(objs[cur].g_points_smooth);
         var indices = Uint16Array.from(objs[cur].g_indices_smooth);
         saveFile(new SOR("SOR",vertices,indices));
      }
   }
   
   function drawNew(){
      complete = false;
      g_points = [];
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      theView.setType("ortho");
   }
   
   function toggleNormals(){
      if (complete && cur >= 0){
         objs[cur].showNormals = !(objs[cur].showNormals);
         draw(gl,objs,srcs,solidProgram,texProgram);
      }
   }
   
   function toggleShading(){
      if (complete && cur >=0){
         objs[cur].flatShading = !(objs[cur].flatShading);
         draw(gl,objs,srcs,solidProgram,texProgram);
      }
   }
   
   function toggleSpecular(){
      if (complete && cur >= 0){
         objs[cur].specular = !(objs[cur].specular);
         draw(gl,objs,srcs,solidProgram,texProgram);
      }
   }
   
   function toggleDirec(){
      if (complete){
         direct = !direct;
         gl.useProgram(solidProgram);
         gl.uniform1i(solidProgram.u_Direct,direct);
         gl.useProgram(texProgram);
         gl.uniform1i(texProgram.u_Direct,direct);
         draw(gl,objs,srcs,solidProgram,texProgram);
      }
   }

   function toggleTex(){
	   if (complete && cur>=0){
		   objs[cur].textured = !(objs[cur].textured);
		   draw(gl,objs,srcs,solidProgram,texProgram);
	   }
   }
   
   function changeGloss(){
      if (complete && cur >=0){
         objs[cur].gloss = glossSlider.value;
         draw(gl,objs,srcs,solidProgram,texProgram);
      }
   }
   
   function changeColor(){
      color = calcRGB(colorPicker.value);
      if (complete && cur>=0){
         objs[cur].color_diffuse = color.slice();
         draw(gl,objs,srcs,solidProgram,texProgram);
      }
   }
   
   function addPointSrc(){
      if (complete){
         srcs.push(new pointLight([0.0,0.0,0.0],[1.0,1.0,0.0],solidProgram));
         draw(gl,objs,srcs,solidProgram,texProgram);
      }
   }
   
   function togglePointSrc(){
      if (complete && cur_L >=0){
         srcs[cur_L].active = !(srcs[cur_L].active);
         draw(gl,objs,srcs,solidProgram,texProgram);
      }
   }
   
   function switchView(){
      if (complete){
         if (view == "ortho"){
            view = "persp";
         } else {
            view = "ortho";
         }
         theView.setType(view);
         draw(gl,objs,srcs,solidProgram,texProgram);
      } 
   }
   
   function uploadTex(){
	   var texName = texFile.value;
      //strip "fakepath" included in filename by some browsers
      if (texName.includes("fakepath")){
         for (var i = texName.length; i > 0; i--){
            if (texName[i] == '\\'){
               texName = texName.slice(i+1,texName.length);
            }
         }
      }
	   if (cur >=0){
		   objs[cur].updateTex(texName);
		   draw(gl,objs,srcs,solidProgram,texProgram);
	   }
   }
   
   //function for executing animated views
   function tick() {
      if (examining && cur>=0){
         theView.examine(objs[cur],thetaEx,1000);
         thetaEx += .01;
         draw(gl,objs,srcs,solidProgram,texProgram);
      } else if (lookingAround && cur>=0){
         theView.lookAround(objs[cur],thetaEx,1000);
         thetaEx += .01;
         draw(gl,objs,srcs,solidProgram,texProgram);
      } 
      window.requestAnimationFrame(tick);
   }
}

//----------------------------------------------------
//Object Drawing Functions
//----------------------------------------------------

//redraw lines
function drawLines(gl,g_points,color,program) {      
   // Clear <canvas>
   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
   
   var g_indices = calcIndicesLine(g_points);
   var g_colors = setColor(g_points,color);
   gl.useProgram(program);
   gl.uniform1i(program.u_Selection,true);
	  
   // Write the positions of vertices to a vertex shader
   var n = updateVertexBuffers_Line(gl,g_points,g_indices,g_colors,program);
   if (n < 0) {
      console.log('Failed to set the positions of the vertices');
   return;
   }
	
   // Draw the polyline
   gl.drawElements(gl.LINE_STRIP, n, gl.UNSIGNED_SHORT, 0);
}

function draw(gl,objs,srcs,solidProg,texProg) {
   // Clear <canvas>
   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
   
   var src_locations = [];
   var src_colors = [];
   var src_count = 0;
   //draw light source geometry and pass lighting info to shaders
   for (var i = 0; i < srcs.length; i++){
      srcs[i].drawPLight();
      if (srcs[i].isActive()){
         src_locations = src_locations.concat(srcs[i].position);
         src_colors = src_colors.concat( srcs[i].color.slice().concat([1.0]) );
         src_count++;
      }
   }
   if (src_locations.length == 0){
      src_locations = [0.0,0.0,0.0];
      src_colors = [0.0,0.0,0.0,0.0];
   }
   gl.useProgram(solidProg);
   gl.uniform3fv(solidProg.u_PointLight, src_locations);
   gl.uniform4fv(solidProg.u_PointLight_Color, src_colors);
   gl.uniform1i(solidProg.u_PointLight_Count, src_count);
   gl.useProgram(texProg);
   gl.uniform3fv(texProg.u_PointLight, src_locations);
   gl.uniform4fv(texProg.u_PointLight_Color, src_colors);
   gl.uniform1i(texProg.u_PointLight_Count, src_count); 
   
   //draw SOR object geometry
   for (var i = 0; i < objs.length; i++){
      objs[i].drawSOR();
   }
   
   var line_color;
   if (objs[0].light_direc) {
      line_color = [1,0,0];
   } else {
      line_color = [.75,.75,.75];
   }
   
   g_points = [0,0,0,500,500,500];
   g_indices = calcIndicesLine(g_points);
   g_colors = setColor(g_points,line_color);
}

function checkClicked(gl,objs,x,y){
   var picked = false;
   var ID;
   var isOn;
   // Read pixel at the clicked position
   var pixels = new Uint8Array(4); // Array for storing the pixel value
   for (var i = 0; i < objs.length; i++){
      //render each object into buffer, flat shaded with its color ID
	  objs[i].picking = true;
	  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      objs[i].drawSOR();
	  objs[i].picking = false;
	  //get pixels from draw buffer
	  gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
	  //check if they match
	  ID = objs[i].ID;
	  isOn = (pixels[0] == ID && pixels[1] == ID && pixels[2] == ID);
	  if (isOn) {
		 return i; 
	  }
   }
   return -1; 
}

function checkClicked_Light(gl,srcs, x,y){
   var picked = false;
   var ID;
   var isOn;
   // Read pixel at the clicked position
   var pixels = new Uint8Array(4); // Array for storing the pixel value
   for (var i = 0; i < srcs.length; i++){
      //render each object into buffer, flat shaded with its color ID
	  srcs[i].picking = true;
	  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
     srcs[i].drawPLight();
	  srcs[i].picking = false;
	  //get pixels from draw buffer
	  gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
	  //check if they match
	  ID = srcs[i].ID;
	  isOn = (pixels[0] == ID && pixels[1] == ID && pixels[2] == ID);
	  if (isOn) {
		 return i; 
	  }
   }
   return -1; 
}







   
   
   
