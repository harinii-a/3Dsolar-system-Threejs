import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


//Create the scene and camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  45,window.innerWidth/window.innerHeight,0.1,1000
);

//Add camera controls
const orbit = new OrbitControls(camera,renderer.domElement);
camera.position.set(-90,140,140);
orbit.update();

//Add proper lighting
const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff,1);  //light from one direction
directionalLight.position.set(50,50,50);
scene.add(directionalLight);

const textureLoader = new THREE.TextureLoader();


//----Stars in the background----
const starsGeometry = new THREE.BufferGeometry();
const starCount =10000;
const positions =[];

for(let i=0;i<starCount;i++){
  positions.push((Math.random()-0.5)*2000);
  positions.push((Math.random()-0.5)*2000);
  positions.push((Math.random()-0.5)*2000);
}
starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions,3));
const starsMaterial = new THREE.PointsMaterial({color:0xffffff,size:1});
const starField = new THREE.Points(starsGeometry,starsMaterial);
scene.add(starField);



//----Sun----
const sunGeo = new THREE.SphereGeometry(19,30,30);
const sunMat = new THREE.MeshBasicMaterial({map:textureLoader.load('imgs/suntexture.jpg')});
const sun = new THREE.Mesh(sunGeo,sunMat);
scene.add(sun);



//function to create planet and orbit for each planet
const orbits =[];
const planetsData ={};

function createPlanet(size,positionX,rotationSpeed,orbitSpeed,texturePath){
  const planetGeo = new THREE.SphereGeometry(size,30,30);
  const planetMat = new THREE.MeshBasicMaterial({map:textureLoader.load(texturePath)});
  const planet = new THREE.Mesh(planetGeo,planetMat);
  const planetObj = new THREE.Object3D();
  planetObj.add(planet);
  scene.add(planetObj);
  planet.position.set(positionX,0,0);  //Place planet on orbit circle

  //Orbit for each planet
  const orbitGeo = new THREE.BufferGeometry();
  const orbitPoints =[];
  const orbitSegments =128;

  for (let i=0;i<=orbitSegments;i++) {
    const angle = (i/orbitSegments)*Math.PI*2;
    orbitPoints.push(Math.cos(angle)*positionX,0,Math.sin(angle)*positionX);
  }

  orbitGeo.setAttribute('position',new THREE.Float32BufferAttribute(orbitPoints,3));
  const orbitMaterial = new THREE.LineBasicMaterial({color:0xffffff});
  const orbitLine = new THREE.Line(orbitGeo,orbitMaterial);
  scene.add(orbitLine);

  orbits.push(orbitLine);
  return {planet,planetObj,rotationSpeed,orbitSpeed};
}


//Create all 8 planet
let num = 1.2;
planetsData.Mercury = createPlanet(3.7 *num, 28, 0.004, 0.04, 'imgs/mercury.jpg');
planetsData.Venus = createPlanet(5.8 *num, 44, 0.002, 0.015, 'imgs/venus.jpg');
planetsData.Earth = createPlanet(6 * num, 62, 0.02, 0.01, 'imgs/earth.jpg');
planetsData.Mars = createPlanet(4 * num, 78, 0.018, 0.008, 'imgs/mars.jpg');
planetsData.Jupiter = createPlanet(10 * num, 100, 0.04, 0.002, 'imgs/jupiter.jpg');
planetsData.Saturn = createPlanet(9 * num, 138, 0.038, 0.0009, 'imgs/saturn.jpg');
planetsData.Uranus = createPlanet(7 * num, 176, 0.03, 0.0004, 'imgs/uranus.jpg');
planetsData.Neptune = createPlanet(7 * num, 200, 0.032, 0.0001, 'imgs/neptune.jpg');


//saturn ring
const saturnRingGeo = new THREE.RingGeometry(13.2, 20, 64);
const saturnRingMat = new THREE.MeshBasicMaterial({
  map: textureLoader.load('imgs/saturnring.jpg'),
  side: THREE.DoubleSide,
});
const satRing = new THREE.Mesh(saturnRingGeo, saturnRingMat);
planetsData.Saturn.planetObj.add(satRing);
satRing.position.set(138,0,0);
satRing.rotation.x = -Math.PI/1.8;

//THREE.Clock integration
const clock = new THREE.Clock();
let isPaused = false;

//Pause Resume logic
document.getElementById('pauseplay').addEventListener('click',function () {
  isPaused =!isPaused;
  this.textContent = isPaused? "Resume" : "Pause";
});

//Toggle Orbits
document.getElementById('toggleOrbits').addEventListener('click',function () {
  const isVisible = orbits[0].visible;
  orbits.forEach(orbit =>(orbit.visible =!isVisible));
  this.textContent = isVisible? "Show Orbits" : "Hide Orbits";
});



//Control panel sliders
const controlPanel = document.getElementById("sliders");

//reset Button
const resetButton = document.createElement("button");
resetButton.textContent ="Reset speed";
resetButton.className ="resetButton";
resetButton.id ="resetSliders";
resetButton.style.display ="block"; // Ensures visibility

controlPanel.appendChild(resetButton);

//Store Default Speeds
Object.entries(planetsData).forEach(([name,planet]) => {
  planet.defaultOrbitSpeed =planet.orbitSpeed; //Save initial speed

  const label =document.createElement("label");
  label.textContent =name;
  label.style.display = "block";

  const slider = document.createElement("input");
  slider.type ="range";
  slider.min ="0.00001";
  slider.max ="0.05";
  slider.step ="0.00001";
  slider.value =planet.orbitSpeed;
  slider.classList.add("slider");

  slider.addEventListener("input",(e)=>{
    planet.orbitSpeed =parseFloat(e.target.value);
  });

  planet.slider =slider; // Store slider reference for reset

  controlPanel.appendChild(label);
  controlPanel.appendChild(slider);
});

// *Reset Button Logic*
resetButton.addEventListener("click",() =>{
  Object.values(planetsData).forEach(planet =>{
    planet.orbitSpeed = planet.defaultOrbitSpeed; // Restore default speed
    planet.slider.value = planet.defaultOrbitSpeed; // Update slider position
  });
});

// Append Reset Button to Control Panel
// controlPanel.appendChild(resetButton);
// *Animation Loop Using THREE.Clock*

function animate(){
  const delta = clock.getDelta(); //time difference for smoother animations

  if(!isPaused){
    sun.rotateY(0.004);
    starField.rotation.y+=0.0005;
    Object.values(planetsData).forEach(({planet,planetObj,rotationSpeed,orbitSpeed})=>{
      planet.rotateY(rotationSpeed);
      planetObj.rotateY(orbitSpeed*delta*60); //Adjust for time scaling
    });
  }

  renderer.render(scene,camera);
  requestAnimationFrame(animate);
}

animate();

window.addEventListener('resize',function(){
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
});