import OrbitControls from '../scripts/orbit';
import orientationInit from '../scripts/orientation';
import StereoEffect from '../scripts/stereoscopic';

// The render function creates a loop to constantly update our scene based on
// internal cycles or user actions. 
function render() {
  requestAnimationFrame(render.bind(this));

  // Updates for lighting
  let d = new Date();
  this.pointLight.position.x += 30 * Math.sin(Math.floor(d.getTime() / 10) * 0.02);
  this.pointLight.position.y += 20 * Math.sin(Math.floor(d.getTime() / 10) * 0.01);

  // Update camera, controls, and size:
  this.resize();
  this.camera.updateProjectionMatrix();
  this.controls.update();

  this.intersect();

  // Render stereo or normal effect based on whether user chose VR experience
  if (this.usingVR) {
    this.effect.render(this.scene, this.camera);
  } else {
    this.renderer.render(this.scene, this.camera);
  }

  // Corrently position the players based on the number of current players 
  let numPlayers = this.players.length;
  for (let x = 0; x < numPlayers; x++) {
    let playerObj = this.scene.getObjectByName(this.players[x].uid);
    if (playerObj.position.x > Math.floor((500 / numPlayers) / 2 * (1 + (2 * x)) - 250)) {
      playerObj.position.x -= 2;
    } else if (playerObj.position.x < Math.floor((500 / numPlayers) / 2 * (1 + (2 * x)) - 250)) {
      playerObj.position.x += 2;
    }
  }

  // Commenting out this code as it interferes with the new camera orbit system
  // this.camera.position.x += (this.camMouse.x - this.camera.position.x) * 0.05;
  // this.camera.position.y += ( - this.camMouse.y - this.camera.position.y) * 0.05;
  // this.camera.lookAt(this.scene.position);
}

export default function init(usingVR) {
  
  //SET UP VARS////////////////

  this.players = [];
  this.roleColors = {
    KNIGHT: 0x00b8ff,
    merlin: 0x007cab,
    MINION: 0xFF0000,
    assassin: 0x850000,
    //defaultColor: 0xffce00
    defaultColor: 0x00b8ff
  };
  this.WIDTH = window.innerWidth,
  this.HEIGHT = window.innerHeight;
  const VIEW_ANGLE = 45,
        ASPECT = this.WIDTH / this.HEIGHT,
        NEAR = 0.1,
        FAR = 10000;
  // usingVR is passed in from websocket listeners and will tell our program
  // whether the user wants the VR experience. Defaults to false if nothing is chosen
  this.usingVR = usingVR === undefined ? false : usingVR;

  //SET UP SCENE ////////////////////////////

  let $gameContainer = $('#gameContainer');
  // Init scene
  this.scene = new THREE.Scene();

  // Init renderer
  this.renderer = new THREE.WebGLRenderer();
  this.renderer.setSize(this.WIDTH, this.HEIGHT);

  this.element = this.renderer.domElement;
  $gameContainer.append(this.element);

  // If the user desires the VR experience, init stereo effect object that will
  // allow the game to be rendered with a stereoscopic view. Then, the render loop
  // will render the scene with the effect object rather than directly with the 
  // WebGLRenderer. 
  this.stereoEffect = usingVR ? new StereoEffect(this.renderer) : null;

  //CAMERA AND VISUAL CONTROLS //////////////////

  // Init camera
  this.camera = new THREE.PerspectiveCamera(
      VIEW_ANGLE, ASPECT, NEAR, FAR
    );
  this.camera.position.z = 500;
  this.scene.add(this.camera);

  // Camera controls (for both VR and nonVR users)
  this.controls = new OrbitControls(this.camera, this.element);
  this.controls.target.set(
    this.camera.position.x + 0.15,
    this.camera.position.y,
    this.camera.position.z
  );
  this.controls.noPan = true;
  this.controls.noZoom = true;

  // setOrientationControls will activate if the user is on mobile and override controls
  const setOrientationControls = (e) => {
    if (!e.alpha) {
      return;
    }
    this.controls = new THREE.DeviceOrientationControls(this.camera, true);
    this.controls.connect();
    this.controls.update();
    this.element.addEventListener('click', fullscreen, false);
    window.removeEventListener('deviceorientation', setOrientationControls, true);
  }

  window.addEventListener('deviceorientation', setOrientationControls, true);

  // Fullscreen controls, should allow game containers to become fullscreen on mobile
  function fullscreen() {
    if ($gameContainer.requestFullscreen) {
      $gameContainer.requestFullscreen();
    } else if ($gameContainer.msRequestFullscreen) {
      $gameContainer.msRequestFullscreen();
    } else if ($gameContainer.mozRequestFullScreen) {
      $gameContainer.mozRequestFullScreen();
    } else if ($gameContainer.webkitRequestFullscreen) {
      $gameContainer.webkitRequestFullscreen();
    }
    resize();
  }

  // Resize sets up to change the size of the renderer if necessary (useful for fullscreen)
  this.resize = () => {
    var nativePixelRatio = window.devicePixelRatio = window.devicePixelRatio ||
    Math.round(window.screen.availWidth / document.documentElement.clientWidth);
    var devicePixelRatio = nativePixelRatio;

    var width = window.innerWidth;
    var height = window.innerHeight;
    self.camera.aspect = devicePixelRatio;
    self.camera.updateProjectionMatrix();
    self.renderer.setSize(width, height);
    self.effect.setSize(width, height);
  }

  // LIGHTS /////////////////////////////////////////
  this.pointLight = new THREE.PointLight(0xFFFFFF);
  this.pointLight.position.set = (10, 50, 130);
  this.scene.add(this.pointLight);
  
  this.textureLoader = new THREE.TextureLoader();

  this.raycaster = new THREE.Raycaster();
  this.camMouse = {
    x: 0,
    y: 0
  }; 
  this.mouse = new THREE.Vector2();

  // MAIN DOCUMENT LISTENERS//////////////////////

  document.addEventListener('mousemove', (e) => {
    //console.log('{', e.clientX, e.clientY, '}');
    this.mouse.x = (e.clientX / this.WIDTH) * 2 - 1;
    this.mouse.y = - (e.clientY / this.HEIGHT) * 2 + 1;
    this.camMouse.x = (e.clientX - this.WIDTH / 2);
    this.camMouse.y = (e.clientY - this.HEIGHT / 2);
  }, false);

  // Commenting this section out as it interferes with the normal resizing
  // process
  // window.addEventListener('resize', ()=> {
  //   this.camera.aspect = window.innerWidth / window.innerHeight;
  //   this.camera.updateProjectionMatrix();

  //   this.renderer.setSize( window.innerWidth, window.innerHeight );
  // }, false );

/*  //SKY BOX///////////////////////////////////
  //Todo: Convert to tga format, speedier loadup vs png
  // this.TGAloader = new THREE.TGALoader();
  // var imgLoc = 'skybox/ame_ash/ashcanyon_';
  // var skyboxImages = [imgLoc + 'px.tga', imgLoc + 'nx.tga',
  //                     imgLoc + 'py.tga', imgLoc + 'ny.tga', 
  //                     imgLoc + 'pz.tga', imgLoc + 'nz.tga'];
  ////REMOVE SKYBOX FOR MVP
  this.cubeLoader = new THREE.CubeTextureLoader();
  this.cubeLoader.setPath('skybox/ame_ash/');
  var skyboxImages = ['px.png', 'nx.png',
                      'py.png', 'ny.png', 
                      'pz.png', 'nz.png'];
  var textureCube = this.cubeLoader.load(skyboxImages);
  textureCube.format = THREE.RGBFormat;
  this.scene.background = textureCube;
*/

  render.call(this);
}