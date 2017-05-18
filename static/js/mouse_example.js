/* ###################################### GLOBAL VARIABLES ######################################*/

//var startTime, object, mouse;
//var objects = []

var count_false = 0;

var axisLength;

var highlightCube, highlightGeometry, highlightMaterial;

//Three.js rendering variables
var renderer, scene, camera, WIDTH, HEIGHT, object, controls;

var prevX = 0, prevY = 0, prevZ = 0;

var camToSave;

var ambientLight, ground, front, right;

// Drawing variables
// If a line is currently being drawn this variable tracks it
var currentLine;
// The current animation queue
var animationQueue;
//The drawing heads most recent position
var currentPosition;
//The drawing heads destination at any given time
var updatedPosition;

//Colors
var red, white, lc, purple;

// The mouse object
var raycaster, projector, mouse;

var points = []; // List of lists of lists - determines points of current visualization

var onScreenObjects = []; // as we draw lines add them to this

var progress;

var object, lineGeometry;

/* ########################################## FUNCTIONS ##########################################*/

/* Low Level Functions */

// This function moves the drawing head from currentPosition to point without drawing anything as it moves
function queueMoveHead(point){
    animationQueue.push([QUEUE_MEMBERS.MOVE,
      new THREE.Vector3(point[0], point[1], point[2])]);

      // var material = new THREE.LineBasicMaterial({ color: red, linewidth: 1 });
      // var geometry = new THREE.Geometry();
      // animationQueue.push([QUEUE_MEMBERS.INSTANT_LINE, new THREE.Line(geometry,  material),
      //   new THREE.Vector3(point[0], point[1], point[2])]);
}

function drawSegmentedShape(points, index){
  progress.html('Drawing...');
  var lineSegmentGeometry = new THREE.Geometry();
  var len = points.length;
  for (var i = 1; i < len; i++){
    if (points[i][3] == true){
      lineSegmentGeometry.vertices.push(new THREE.Vector3(prevX, prevY, prevZ));
      lineSegmentGeometry.vertices.push(new THREE.Vector3(points[i][0], points[i][1], points[i][2]));
      lineGeometry.vertices.push(new THREE.Vector3(prevX, prevY, prevZ));
      lineGeometry.vertices.push(new THREE.Vector3(points[i][0], points[i][1], points[i][2]));
      // console.log(prevX,prevY,prevZ,points[i][0], points[i][1], points[i][2]);
    } else {
      count_false += 1;
    }
    prevX = points[i][0];
    prevY = points[i][1];
    prevZ = points[i][2];
  } 

  animationQueue.push([QUEUE_MEMBERS.LINE_SEGMENTS,
    lineSegmentGeometry, new THREE.Vector3(points[len-1][0],
      points[len-1][1], points[len-1][2]), index]);
}

//This function takes in a list of lists, where each list is a path
//It draws lines along each point on an individual path
//It starts its next drawing at the beginning of a point in a given point list
function path(pointList){
    // console.log('beginning points, pointList.length: ');
    // console.log(pointList);
    //pointList : the parent list of all subpaths
    for (var i = 0; i < pointList.length; i++){
      drawSegmentedShape(pointList[i], i);
    }

}

//Clear the visualization of any lines.
//Reset the set of points.
function clear(){
    points = [];
    animationQueue = [];
    while (scene.children.length > 0) {
        scene.children.forEach(function(child){
            scene.remove(child);
        });
    }
    object = new THREE.Object3D();
    lineGeometry = new THREE.Geometry();
    object.castShadow = true;

    scene.add(ground);
    scene.add(ambientLight);
    scene.add(front);
    scene.add(right);
    scene.add(object);
    createAxis(new THREE.Vector3(-axisLength, 0, 0), new THREE.Vector3(axisLength, 0, 0), 0xFF0000);
    createAxis(new THREE.Vector3(0, -axisLength, 0), new THREE.Vector3(0, axisLength, 0), 0x00FF00);
    createAxis(new THREE.Vector3(0, 0, -axisLength), new THREE.Vector3(0, 0, axisLength), 0x000000);
}

/* Three.js functions */
function render() {
    controls.update();
    renderer.render(scene, camera);
}

// animate
function animate() {
    //begin animation loop
    requestAnimationFrame(animate);

    //update current position on display
    $("#curr_x").html(currentPosition.x);
    $("#curr_y").html(currentPosition.y);
    $("#curr_z").html(currentPosition.z);

    copyPoint(currentPosition, updatedPosition);
    if (animationQueue.length !== 0){
        var nextAnimation = animationQueue.shift();
        if (nextAnimation[0] == QUEUE_MEMBERS.LINE){
            console.log('starting line');
            currentLine = nextAnimation[1];
            scene.add(currentLine);
            onScreenObjects.push(currentLine);
            updatePositions(nextAnimation[2]);
        } else if (nextAnimation[0] == QUEUE_MEMBERS.INSTANT_LINE){
            currentLine = nextAnimation[1];
            var origin = new THREE.Vector3();
            copyPoint(origin, currentPosition);
            currentLine.geometry.vertices.push(origin);
            if (DEBUG_PRINT) console.log('origin: ', currentPosition);
            currentLine.geometry.vertices.push(nextAnimation[2]);
            if (DEBUG_PRINT) console.log('destination: ', nextAnimation[2]);
            scene.add(currentLine);
            onScreenObjects.push(currentLine);
            copyPoint(currentPosition, nextAnimation[2]);
            copyPoint(updatedPosition, currentPosition);
        } else if (nextAnimation[0] == QUEUE_MEMBERS.MOVE){
            if (DEBUG_PRINT) console.log('origin: ', currentPosition);
            if (DEBUG_PRINT) console.log('destination: ', nextAnimation[1]);
            copyPoint(currentPosition, nextAnimation[1]);
            copyPoint(updatedPosition, currentPosition);
            if (DEBUG_PRINT) console.log('current position: ', currentPosition);
        } else if (nextAnimation[0] == QUEUE_MEMBERS.LINE_SEGMENTS){
          // return;
          if (lc == white) lc = purple;
          else lc = white;
          var lineMaterial = new THREE.LineBasicMaterial({color: lc, opacity: 0.6, fog: false});
          var lineSegmentGeometry = nextAnimation[1];
          lineGeometry.computeBoundingBox();
          var segmentedLine = new THREE.LineSegments(lineSegmentGeometry, lineMaterial);
          segmentedLine.castShadow = true;
          object.add(segmentedLine);
          onScreenObjects.push(segmentedLine);
          var center = new THREE.Vector3().addVectors(lineGeometry.boundingBox.min,
            lineGeometry.boundingBox.max).divideScalar(2);
          copyPoint(currentPosition, nextAnimation[2]);
          copyPoint(updatedPosition, currentPosition);
          // console.log('center: ', center.x.toFixed(1), ',', center.y.toFixed(1), ',', center.z.toFixed(1));
          object.position.set(-center.x, -center.y, object.position.z);
        }

} else {
  if (progress.html()[0] == 'D') progress.html('');
}
  render();
}


/* Helpers */


// Helper to animate
function copyPoint(p1, p2){
    p1.x = p2.x;
    p1.y = p2.y;
    p1.z = p2.z;
}



/* Environment set-up functions*/

function onWindowResize() {
    camera.aspect = $('#top-half').width() / $('#top-half').height();
    camera.updateProjectionMatrix();
    renderer.setSize($('#top-half').width(), $('#top-half').height());
}

function resetViewFunction(){
  // printViewInfo();
  camera.position.set(camToSave.position.x, camToSave.position.y,
    camToSave.position.z);
  camera.rotation.set(camToSave.rotation.x, camToSave.rotation.y,
    camToSave.rotation.z);
  controls.target.set(camToSave.controlCenter.x,
    camToSave.controlCenter.y, camToSave.controlCenter.z);
  controls.update();
  render();
}

function printViewInfo(){
  console.log('position: ', camera.position.x.toFixed(1), ',', camera.position.y.toFixed(1), ',', camera.position.z.toFixed(1));
  console.log('rotation: ', camera.rotation.x.toFixed(1), ',', camera.rotation.y.toFixed(1), ',', camera.rotation.z.toFixed(1));
  console.log('target: ', controls.target.x.toFixed(1), ',', controls.target.y.toFixed(1), ',', controls.target.z.toFixed(1));
  console.log('object: ', object.position.x.toFixed(1), ',', object.position.y.toFixed(1), ',', object.position.z.toFixed(1));
}

// Mouse clicks to highlight segments of code
function onMouseClick(event) {
    // the following line would stop any other event handler from firing
    event.preventDefault();

    // update the mouse variable
    mouse.x = ( event.clientX / WIDTH ) * 2 - 1;
    mouse.y = - ( event.clientY / HEIGHT ) * 2 + 1;
    // console.log(mouse.x, mouse.y);

    var highlight_range = [10000000,0];
    var lineNum;

    // look for intersections
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(onScreenObjects);
    if (intersects.length > 0) {
      // console.log(intersects);
        addLine(intersects[0]);
        // intersects.forEach(function (workingLine){
          // addLine(workingLine);
          // lineNum = addLine(workingLine);
          // if (lineNum < highlight_range[0]){
            // highlight_range[0] = lineNum;
          // } else if (lineNum > highlight_range[1]){
            // highlight_range[1] = lineNum;
          // }
        // });
        // var r = codeEditor.leftEditor.selection.getRange();
        // r.start.row = lineNum;
        // r.end.row = lineNum;
        // codeEditor.leftEditor.selection.setSelectionRange(r, false);
    } else {
        // console.log("No intersections");
    }
}

function addLine(workingLine){
  // console.log(workingLine);
  makeHighlightCube(workingLine.point);
  $('#x_coord').html(workingLine.point.x.toFixed(2));
  $('#y_coord').html(workingLine.point.y.toFixed(2));
  $('#z_coord').html(workingLine.point.z.toFixed(2));

  var r = codeEditor.leftEditor.selection.getRange();
  r.start.row = workingLine.index;
  r.end.row = workingLine.index;
  r.start.column = 0;
  r.end.column = 100;
  codeEditor.leftEditor.selection.setSelectionRange(r, true);
  codeEditor.leftEditor.getSession().setScrollTop(16*workingLine.index);


  // $.ajax({
  //     type: 'POST',
  //     url: '/lineNumber',
  //     data: JSON.stringify(two_points),
  //     contentType: false,
  //     cache: false,
  //     processData: false,
  //     success: function (data) {
  //         lineNum = JSON.parse(data).lineNum;
  //         var r = codeEditor.leftEditor.selection.getRange();
  //         r.start.row = lineNum;
  //         r.end.row = lineNum;
  //         codeEditor.leftEditor.selection.setSelectionRange(r, false);
  //     },
  // });
    // if (workingLine.object.material.color.equals(white)){
    //     workingLine.object.material.color = red;
    //     two_points = [[workingLine.object.geometry.vertices[0].x,
    //       workingLine.object.geometry.vertices[0].y,
    //       workingLine.object.geometry.vertices[0].z],
    //       [workingLine.object.geometry.vertices[1].x,
    //       workingLine.object.geometry.vertices[1].y,
    //       workingLine.object.geometry.vertices[1].z]];
    //     console.log(two_points);
    //
    //
    //
    // } else {
    //     workingLine.object.material.color = white;
    // }

    renderer.render(scene, camera);
}

//Create axis (point1, point2, colour)
function createAxis(p1, p2, color){
  var line, axisGeometry = new THREE.Geometry(),
    lineMat = new THREE.LineBasicMaterial({color: color});
  axisGeometry.vertices.push(p1, p2);
  line = new THREE.Line(axisGeometry, lineMat);
  scene.add(line);
}

function makeHighlightCube(point){
  scene.remove(highlightCube);
  highlightGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3, 0.05, 0.05, 0.05);
  highlightMaterial = new THREE.MeshBasicMaterial({color: red, wireframe: true});
  highlightCube = new THREE.Mesh(highlightGeometry, highlightMaterial);
  highlightCube.position.x = point.x;
  highlightCube.position.y = point.y;
  highlightCube.position.z = point.z;
  scene.add(highlightCube);
}

/*
  Three.js "tutorials by example"
  Author: Lee Stemkoski
  Date: July 2013 (three.js v59dev)
*/
// MAIN
// standard global variables
var container, scene, camera, renderer, controls, stats;
var clock = new THREE.Clock();
// custom global variables
var targetList = [];
var projector, mouse = { x: 0, y: 0 };
init();
animate();
// FUNCTIONS    
function init() 
{
  // scene
  scene = new THREE.Scene();

   // camera
  WIDTH = $('#top-half').width();
  HEIGHT = $('#top-half').height();
  camera = new THREE.PerspectiveCamera(FOV, WIDTH / HEIGHT, NEAR, FAR);
  
  scene.add(camera);
  camera.position.set(0,150,400);
  camera.lookAt(scene.position); 

  // Lights
  ambientLight = new THREE.AmbientLight(0x505050, 2.5);
  scene.add(ambientLight); 


  // Platform on which to 3d print
  ground = new THREE.Mesh( new THREE.PlaneBufferGeometry(150, 150, 1, 1),
      new THREE.MeshPhongMaterial({
          color: 0x3292F1, shininess: 150
      }));
  ground.receiveShadow = true;
  scene.add(ground);

  front = new THREE.Mesh( new THREE.PlaneBufferGeometry(150, 150, 1, 1),
        new THREE.MeshPhongMaterial({
            color: 0x7AB8F6, shininess: 150
        }));
    front.receiveShadow = true;
    front.position.y = 75;
    front.position.z = 75;
    front.rotation.x = Math.PI / 2;
    scene.add(front);

    right = new THREE.Mesh( new THREE.PlaneBufferGeometry(150, 150, 1, 1),
        new THREE.MeshPhongMaterial({
            color: 0x0E6CC9, shininess: 150
        }));
    right.receiveShadow = true;
    right.position.x = 75;
    right.position.z = 75;
    right.rotation.y = -Math.PI/2;
    scene.add(right);

    //axes
    axisLength = 75;
    createAxis(new THREE.Vector3(-axisLength, 0, 0), new THREE.Vector3(axisLength, 0, 0), 0xFF0000);
    createAxis(new THREE.Vector3(0, -axisLength, 0), new THREE.Vector3(0, axisLength, 0), 0x00FF00);
    createAxis(new THREE.Vector3(0, 0, -axisLength), new THREE.Vector3(0, 0, axisLength), 0x000000);


  // Renderer
  renderer = new THREE.WebGLRenderer({clearColor:0xffffff, clearAlpha: 1, antialias: true});
  renderer.setSize($('#top-half').width(), $('#top-half').height());
  window.addEventListener('resize', onWindowResize, false);
  document.getElementById("visualization").appendChild(renderer.domElement);

  // state
  currentPosition = new THREE.Vector3(0,0,0);
  updatedPosition = new THREE.Vector3(0,0,0);
  animationQueue = [];

  // mouse
  raycaster = new THREE.Raycaster();
  mouse = { x: 0, y: 0 };
  document.addEventListener('mousedown', onMouseClick, false);

  //Colors
  red = new THREE.Color('red');
  white = new THREE.Color('#2aba36');
  purple = new THREE.Color('#21a02c');
  lc = white;

  //Controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);


  //Button Controls
  var resetViewButton = $("#resetView");
  resetViewButton.click(resetViewFunction);

  var printViewButton = $("#printView");
  printViewButton.click(printViewInfo);

  var clearButton = $("#clear");
  clearButton.click(clear);

  object = new THREE.Object3D();
  lineGeometry = new THREE.Geometry();
  scene.add(object);

  //position
  controls.target.set(0, 0, 0);
  camera.position.set(0.046360605938516715, -64.57763410143014, 74.36213434642659);
  camera.rotation.set(0.7150916530910365, 0.00047072065637022867, -0.0004087836344610641);
  camToSave = {};
  camToSave.position = camera.position.clone();
  camToSave.rotation = camera.rotation.clone();
  camToSave.controlCenter = controls.target.clone();


  // // FLOOR
  // var floorTexture = new THREE.ImageUtils.loadTexture( 'images/checkerboard.jpg' );
  // floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping; 
  // floorTexture.repeat.set( 10, 10 );
  // var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture, side: THREE.DoubleSide } );
  // var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
  // var floor = new THREE.Mesh(floorGeometry, floorMaterial);
  // floor.position.y = -0.5;
  // floor.rotation.x = Math.PI / 2;
  // scene.add(floor);
  // SKYBOX/FOG
  var skyBoxGeometry = new THREE.CubeGeometry( 10000, 10000, 10000 );
  var skyBoxMaterial = new THREE.MeshBasicMaterial( { color: 0x9999ff, side: THREE.BackSide } );
  var skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
  scene.add(skyBox);
  
  ////////////
  // CUSTOM //
  ////////////
  
  //////////////////////////////////////////////////////////////////////
  // this material causes a mesh to use colors assigned to faces
  var faceColorMaterial = new THREE.MeshBasicMaterial( 
  { color: 0xffffff, vertexColors: THREE.FaceColors } );
  
  var sphereGeometry = new THREE.SphereGeometry( 80, 32, 16 );
  for ( var i = 0; i < sphereGeometry.faces.length; i++ ) 
  {
    face = sphereGeometry.faces[ i ]; 
    face.color.setRGB( 0, 0, 0.8 * Math.random() + 0.2 );   
  }
  var sphere = new THREE.Mesh( sphereGeometry, faceColorMaterial );
  sphere.position.set(0, 50, 0);
  scene.add(sphere);
  
  targetList.push(sphere);
  
  //////////////////////////////////////////////////////////////////////
  
  // initialize object to perform world/screen calculations
  projector = new THREE.Projector();
  
  // when the mouse moves, call the given function
  document.addEventListener( 'mousedown', onDocumentMouseDown, false );
  
}

function init5() {
    if (DEBUG_PRINT) console.log('beginning init');



    highlightGeometry = new THREE.BoxGeometry(70, 70, 70, 10, 10, 10);
    highlightMaterial = new THREE.MeshBasicMaterial({color: red, wireframe: true});
    highlightCube = new THREE.Mesh(highlightGeometry, highlightMaterial);

    progress = jQuery('#progress');

    if (DEBUG_PRINT) console.log('finished init');
}
function onDocumentMouseDown( event ) 
{
  // the following line would stop any other event handler from firing
  // (such as the mouse's TrackballControls)
  // event.preventDefault();
  
  console.log("Click.");
  
  // update the mouse variable
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  
  // find intersections
  // create a Ray with origin at the mouse position
  //   and direction into the scene (camera direction)
  var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
  projector.unprojectVector( vector, camera );
  var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );
  // create an array containing all objects in the scene with which the ray intersects
  var intersects = ray.intersectObjects( targetList );
  
  // if there is one (or more) intersections
  if ( intersects.length > 0 )
  {
    console.log("Hit @ " + toString( intersects[0].point ) );
    // change the color of the closest face.
    intersects[ 0 ].face.color.setRGB( 0.8 * Math.random() + 0.2, 0, 0 ); 
    intersects[ 0 ].object.geometry.colorsNeedUpdate = true;
  }
}
function toString(v) { return "[ " + v.x + ", " + v.y + ", " + v.z + " ]"; }
function animate() 
{
    requestAnimationFrame( animate );
  render();   
  update();
}
function update()
{
  controls.update();
}
function render() 
{
  renderer.render( scene, camera );
}

$(document).ready(function () {
    init();
});

function onWindowResize() {
    camera.aspect = $('#top-half').width() / $('#top-half').height();
    camera.updateProjectionMatrix();
    renderer.setSize($('#top-half').width(), $('#top-half').height());
}
