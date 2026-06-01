let scene, camera, renderer, controls, clock;

let world, worldGroup, cabinGroup;

let soccerBallMesh, soccerBallBody;

let skaterGroup, skaterBody;

const keys = {};

const WORLDSIZE = 200;
const BALLLIMITHEIGHT = 30;

const forwardLimit = 85;
const backwardLimit = -60

callingOtherMethods();
animate();

// method to call other methods
function callingOtherMethods() {
  createScene();
  createCamera();
  createRenderer();
  createControls();

  createEnvironment();
  createLights();

  createWorldGroups();
  createPhysicsWorld();

  createGround();
  createBounds();

  createSoccerBall();
  createChair();
  createTrees();

  loadCabin();
  loadTable();
  loadSkater();

  keyboard();
  
  clock = new THREE.Clock();
}

// Creating the Scene 
function createScene() {
  scene = new THREE.Scene();
}

// Creating the Camera
function createCamera() {
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    3000
  );
  camera.position.set(-30, 240, 240);
}

// Rendering method
function createRenderer() {
  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  document.body.appendChild(renderer.domElement);
}

// Creating controls
function createControls() {
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
}

// Enviroment Mapping
function createEnvironment() {
  const loader = new THREE.CubeTextureLoader();

  const environmentMap = loader.load([
    'https://raw.githubusercontent.com/amaraauguste/amaraauguste.github.io/master/courses/CISC3620/textures/Meadow/posx.jpg',

    'https://raw.githubusercontent.com/amaraauguste/amaraauguste.github.io/master/courses/CISC3620/textures/Meadow/negx.jpg',

    'https://raw.githubusercontent.com/amaraauguste/amaraauguste.github.io/master/courses/CISC3620/textures/Meadow/posy.jpg',

    'https://raw.githubusercontent.com/amaraauguste/amaraauguste.github.io/master/courses/CISC3620/textures/Meadow/negy.jpg',

    'https://raw.githubusercontent.com/amaraauguste/amaraauguste.github.io/master/courses/CISC3620/textures/Meadow/posz.jpg',

    'https://raw.githubusercontent.com/amaraauguste/amaraauguste.github.io/master/courses/CISC3620/textures/Meadow/negz.jpg'
  ]);

  scene.background = environmentMap;
  scene.environment = environmentMap;
}

// 2 types of Lights 
function createLights() {
  const ambient = new THREE.AmbientLight(0xffffff, 1.5);
  scene.add(ambient);

  const directional = new THREE.DirectionalLight(0xffffff, 2);
  directional.position.set(40, 60, 20);
  directional.castShadow = true;

  directional.shadow.mapSize.width = 2048;
  directional.shadow.mapSize.height = 2048;
  directional.shadow.camera.left = -120;
  directional.shadow.camera.right = 120;
  directional.shadow.camera.top = 120;
  directional.shadow.camera.bottom = -120;

  scene.add(directional);
}

// world groups - multiple worlds
function createWorldGroups() {
  worldGroup = new THREE.Group();
  cabinGroup = new THREE.Group();
  worldGroup.add(cabinGroup);

  scene.add(worldGroup);
}

// Dealing with the Physics world 
function createPhysicsWorld() {
  world = new CANNON.World();
  world.gravity.set(0, -9.82, 0);
  
  const groundBody =new CANNON.Body({mass: 0, shape: new CANNON.Plane()});
  groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);

  world.addBody(groundBody);
}

// ground - plane
function createGround() {
  const material = new THREE.MeshStandardMaterial({color: "green"});
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(WORLDSIZE, WORLDSIZE), material);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;

  worldGroup.add(ground);
}

function createBounds() {
  const half = WORLDSIZE / 2;
  createWall(-half, 0, 2, half);
  createWall(half, 0, 2, half);
  createWall(0, -half, half, 2);
  createWall(0, half, half, 2);
}

function createWall(x, z, sx, sz) {
  const wall = new CANNON.Body({mass: 0});
  wall.addShape(new CANNON.Box(new CANNON.Vec3(sx, 20, sz)));

  wall.position.set(x, 20, z);

  world.addBody(wall);
}

// ball - want it to be something similiar to a soccer ball
function createSoccerBall() {
   const soccerRadius = 3;
  const soccerGeometry = new THREE.SphereGeometry(soccerRadius, 128, 128);
  const soccerMaterial = new THREE.MeshStandardMaterial({color: "white"});

  soccerBallMesh = new THREE.Mesh(soccerGeometry, soccerMaterial);
  soccerBallMesh.castShadow = true;
  worldGroup.add(soccerBallMesh);

  // Physics - For the Ball
  soccerBallBody = new CANNON.Body({
    mass: 1,
    shape: new CANNON.Sphere(3),
    linearDamping: 0.2
  });

  soccerBallBody.position.set(-80, 25, 70);

  world.addBody(soccerBallBody);
}

// Loader for Models
function loadModel(
  url,
  scale,
  position,
  rotationY = 0,
  parent = worldGroup
) {

  const loader = new THREE.GLTFLoader();
  loader.load(url, (gltf) => {
    
    const model = gltf.scene;
    model.scale.setScalar(scale);
    model.rotation.y = rotationY;
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    const box = new THREE.Box3().setFromObject(model);
    const heightOffset = -box.min.y;
    
    model.position.set(position.x, position.y + heightOffset, position.z);
    parent.add(model);
  });
}

// cabin
function loadCabin() {
  loadModel(
    'https://raw.githubusercontent.com/Alicekbabieh/GLB/main/Cabin.glb',
    0.1,
    new THREE.Vector3(-30, 0, 0),
    Math.PI * 2,
    cabinGroup
  );
}

// table
function loadTable() {
  loadModel(
    'https://raw.githubusercontent.com/Alicekbabieh/GLB/main/TableOutside.glb',
    10,
    new THREE.Vector3(40, 0, 75),
    Math.PI * 1.5
  );
}

// skater
function loadSkater() {
  skaterGroup = new THREE.Group();
  worldGroup.add(skaterGroup);
  const loader = new THREE.GLTFLoader();
  loader.load(
    'https://raw.githubusercontent.com/Alicekbabieh/GLB/main/Skateboard.glb',
    (gltf) => {
      const board = gltf.scene;
      
      board.scale.set(0.2, 0.2, 0.2);
      board.rotation.y = Math.PI / 2;
      skaterGroup.add(board);
    }
  );

  loader.load(
    'https://raw.githubusercontent.com/Alicekbabieh/GLB/main/Man.glb',
    (gltf) => {
      const man = gltf.scene;
      
      man.scale.set(6, 6, 6);
      man.position.y = 2;
      skaterGroup.add(man);
    }
  );

  skaterBody =
    new CANNON.Body({
      mass: 5,
      shape: new CANNON.Box(new CANNON.Vec3(2, 3, 4))
    });
  skaterBody.position.set(70, 0, -40);
  skaterBody.linearDamping = 0.9;

  world.addBody(skaterBody);
}

// 4 trees - positions 
function createTrees() {
  createTree(0,60);
  createTree(-50, 60);
  createTree(18,40);
  createTree(18, 0);
}

// makes the actual tree - similiar to tree in class
function createTree(x, z) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(1.5, 1.5, 8),
          new THREE.MeshStandardMaterial({color: 0x5b3a1e})
  );

  trunk.position.y = 4;
  trunk.castShadow = true;
  tree.add(trunk);

  const leaves = new THREE.Mesh(
    new THREE.ConeGeometry(5, 12, 16),
    new THREE.MeshStandardMaterial({color: 0x1f5f2e })
  );

  leaves.position.y = 12;
  leaves.castShadow = true;

  tree.add(leaves);
  tree.position.set(x, 0, z);
  tree.scale.set(1.5,1.5,1.5);

  worldGroup.add(tree);
}

// Chair
function createChair() {
  const chair = new THREE.Group();

  const texture = new THREE.TextureLoader().load(
    'https://raw.githubusercontent.com/amaraauguste/amaraauguste.github.io/master/courses/CISC3620/textures/wood%20table%20top%20texture.jpg'
    );

  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  const material = new THREE.MeshStandardMaterial({map: texture});
  
  const seat = new THREE.Mesh(new THREE.BoxGeometry(4, 0.5, 4), material);
  seat.position.y = 2;
  chair.add(seat);

  const legGeometry = new THREE.BoxGeometry(0.5, 2, 0.5);
  const positions = [
    [-1.75,1,1.75],
    [-1.75,1,-1.75],
    [1.75,1,1.75],
    [1.75,1,-1.75]
  ];
  positions.forEach((p) => {
    const leg = new THREE.Mesh(legGeometry, material);
    leg.position.set(...p);
    chair.add(leg);
  });

  const back = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 0.5), material);
  back.position.set(0, 3.5, -1.75);

  chair.add(back);
  chair.scale.set(2.5, 2.5, 2.5);
  chair.rotation.y = Math.PI;
  chair.position.set(40, 0, 85);
  
  worldGroup.add(chair);
}

// Keyboard
function keyboard() {
  
  window.addEventListener(
    'keydown',
    (e) => {
      keys[
        e.key.toLowerCase()
      ] = true;
    }
  );

  window.addEventListener(
    'keyup',
    (e) => {
      keys[
        e.key.toLowerCase()
      ] = false;
    }
  );
}

function playerMovement() {
  if (!skaterBody || !skaterGroup) return;
  const speed = 0.5;
  
  skaterBody.position.x = 70;
  
  //before move the skater rotates
  
  // d - down , u - upwards. 
  if (keys['d']) {
    skaterGroup.rotation.y = -Math.PI / 2;
    skaterBody.position.z -= speed; 
  }
  // u - forward
  if (keys['u']) {
    skaterGroup.rotation.y = -Math.PI / 2;
    skaterBody.position.z += speed;  
  }
  
  skaterBody.position.y = 0;
  
  skaterBody.velocity.set(0, 0, 0);
  skaterBody.angularVelocity.set(0, 0, 0);
  skaterBody.quaternion.set(0, 0, 0, 1);
  
  if (skaterBody.position.z > forwardLimit) {
    skaterBody.position.z = forwardLimit;
  }
  if (skaterBody.position.z < backwardLimit) {
    skaterBody.position.z = backwardLimit;
  }
}

// Kicking the ball - letter u kicks it back - once on ground
function kickTheBall() {
  // b - back
  if (keys['b']) {
    soccerBallBody.applyImpulse(
      new CANNON.Vec3(0, 5, -20),
      soccerBallBody.position
    );
  } 
  // f - forward
  if(keys['f']) {
    soccerBallBody.applyImpulse(
      new CANNON.Vec3(0, 5, 20),
      soccerBallBody.position
    );
  } 
}

// animate function
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  world.step(1 / 60, delta, 3);
  playerMovement();
  kickTheBall();

  soccerBallMesh.position.copy(soccerBallBody.position);
  soccerBallMesh.quaternion.copy(soccerBallBody.quaternion);

  if (soccerBallBody.position.y > BALLLIMITHEIGHT) {
    soccerBallBody.position.y = BALLLIMITHEIGHT;
    soccerBallBody.velocity.y = 0;
  }
  
  const ballLimitX = WORLDSIZE / 2 - 5;

  if (soccerBallBody.position.x > ballLimitX) {
    soccerBallBody.position.x = ballLimitX;
    soccerBallBody.velocity.x = 0;
  }
  if (soccerBallBody.position.x < -ballLimitX) {
    soccerBallBody.position.x = -ballLimitX;
    soccerBallBody.velocity.x = 0;
  }
  if (soccerBallBody.position.z > forwardLimit) {
    soccerBallBody.position.z = forwardLimit;
    soccerBallBody.velocity.z = 0;
  }
  if (soccerBallBody.position.z < backwardLimit) {
    soccerBallBody.position.z = backwardLimit;
    soccerBallBody.velocity.z = 0;
  }
  
  if (skaterGroup && skaterBody) { 
    
    skaterGroup.position.x = skaterBody.position.x;
    skaterGroup.position.y = skaterBody.position.y;
    skaterGroup.position.z = skaterBody.position.z;
  }
  
  controls.update();
  renderer.render(scene, camera);
}
