var container, scene, camera, renderer, controls, stats;
var clock = new THREE.Clock();
var keyboard = new KeyboardState();
// custom global variables
var mesh;
init();
animate();
// FUNCTIONS
function init()
{
	// SCENE
	scene = new THREE.Scene();
	// CAMERA
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
	var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
	camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
	scene.add(camera);
	camera.position.set(0,150,400);
	camera.lookAt(scene.position);
	// RENDERER
	if ( Detector.webgl )
		renderer = new THREE.WebGLRenderer( {antialias:true} );
	else
		renderer = new THREE.CanvasRenderer();
	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
	container = document.getElementById( 'ThreeJS' );
	container.appendChild( renderer.domElement );
	// EVENTS
	THREEx.WindowResize(renderer, camera);
	THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });
	// CONTROLS
	controls = new THREE.OrbitControls( camera, renderer.domElement );
	// STATS
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.bottom = '0px';
	stats.domElement.style.zIndex = 100;
	container.appendChild( stats.domElement );
	// LIGHT
	var light = new THREE.PointLight(0xffffff);
	light.position.set(100,250,100);
	scene.add(light);
	// FLOOR
	var floorTexture = new THREE.ImageUtils.loadTexture( 'images/checkerboard.jpg' );
	floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
	floorTexture.repeat.set( 10, 10 );
	var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture, side: THREE.DoubleSide } );
	var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
	var floor = new THREE.Mesh(floorGeometry, floorMaterial);
	floor.position.y = -0.5;
	floor.rotation.x = Math.PI / 2;
	scene.add(floor);
	// SKYBOX
	var skyBoxGeometry = new THREE.CubeGeometry( 10000, 10000, 10000 );
	var skyBoxMaterial = new THREE.MeshBasicMaterial( { color: 0x9999ff, side: THREE.BackSide } );
	var skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
	scene.add(skyBox);

	////////////
	// CUSTOM //
	////////////

	var geometry = new THREE.SphereGeometry( 30, 32, 16 );
	var material = new THREE.MeshLambertMaterial( { color: 0x0000ff } );
	mesh = new THREE.Mesh( geometry, material );
	mesh.position.set(0,40,0);
	scene.add(mesh);

}
function animate()
{
    requestAnimationFrame( animate );
	render();
	update();
}
function update()
{
	keyboard.update();
	var moveDistance = 50 * clock.getDelta();
	if ( keyboard.down("left") )
		mesh.translateX( -50 );

	if ( keyboard.down("right") )
		mesh.translateX(  50 );
	if ( keyboard.pressed("A") )
		mesh.translateX( -moveDistance );

	if ( keyboard.pressed("D") )
		mesh.translateX(  moveDistance );

	if ( keyboard.down("R") )
		mesh.material.color = new THREE.Color(0xff0000);
	if ( keyboard.up("R") )
		mesh.material.color = new THREE.Color(0x0000ff);

	controls.update();
	stats.update();
}
function render()
{
	renderer.render( scene, camera );
}