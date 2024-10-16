import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import * as TWEEN from '@tweenjs/tween.js';




let camera, controls, scene, renderer;
let modeloFPS;
let players = [];
let currentPlayer = 0;
let casas = [];
let questionElement, answerButtons;
let gameOver = false;

init();
animate();
//render(); // remove when using animation loop

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB);  // Cor azul claro (tipo céu)
  scene.fog = new THREE.FogExp2(0x87CEEB, 0.002);  // Fog com a mesma cor de fundo, para suavizar a transição

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  document.body.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.set(-20, 15, 15);  // Ajustei a posição da câmera para melhor visualização do tabuleiro

  // OrbitControls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.listenToKeyEvents(window); // optional
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.minDistance = 10;
  controls.maxDistance = 80;
  controls.maxPolarAngle = Math.PI / 3;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.1;

  // Adicionar textura de grama ao chão
  const textureLoader = new THREE.TextureLoader();
  const grassTexture = textureLoader.load('/public/img/grama.jpeg'); // Insira o caminho da sua textura
  grassTexture.wrapS = THREE.RepeatWrapping;
  grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(10, 10); // Repetir a textura para cobrir uma grande área

  const groundGeometry = new THREE.PlaneGeometry(200, 200); // Definir o chão
  const groundMaterial = new THREE.MeshBasicMaterial({ map: grassTexture });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);


  // Adicionar luz ambiente para iluminação uniforme
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

  // Adicionar luz direcional para simular a luz do sol
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(10, 10, 1000);
  scene.add(directionalLight);

  //add as montanhas 
  const loader = new GLTFLoader().setPath('/public/mt/');
  // Carrga o modelo 3D
  loader.load('scene.gltf', (gltf) => {
    modeloFPS = gltf.scene;
    modeloFPS.position.set(50, -25, -90); // Ajuste a posição conforme necessário
    modeloFPS.scale.set(30, 30, 30); // Ajuste a posição conforme necessário
    modeloFPS.rotation.set(0, Math.PI, 0);
    scene.add(modeloFPS);

  }, undefined, function (error) {
    console.error('Ocorreu um erro ao carregar o modelo:', error);
  });


  // Adicionar o retângulo vermelho no começo da trilha
  const redRectangleGeometry = new THREE.BoxGeometry(2, 0.5, 3); // Criar o retângulo (largura 3, altura 0.5, profundidade 1)
  const redRectangleMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Cor vermelha
  const redRectangle = new THREE.Mesh(redRectangleGeometry, redRectangleMaterial);
  redRectangle.position.set(-12, 0, 0); // Posição próxima ao início da trilha, levemente elevado do chão
  scene.add(redRectangle);

        // Jogadores (cones coloridos)
        const playerColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00];
        for (let i = 0; i < 4; i++) {
            const coneGeometry = new THREE.ConeGeometry(0.5, 1, 32);
            const coneMaterial = new THREE.MeshBasicMaterial({ color: playerColors[i] });
            const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    
            cone.position.set(-12, 1, i - 1.5);  // Posição inicial no retângulo vermelho
            scene.add(cone);
            players.push({ mesh: cone, position: -1 });  // Posição inicial no tabuleiro
        }
  
    // Elementos de pergunta
    createQuestionUI();
  
    askQuestion();  // Exibir a primeira pergunta
  
        

  const path = new THREE.CurvePath();

  // Adicionar segmentos de curva
  const curve1 = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-10, 0, 0), // Ponto inicial
    new THREE.Vector3(-5, 0, 5),  // Controle de curva
    new THREE.Vector3(0, 0, 0)    // Ponto final
  );
  const curve2 = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(5, 0, -5),
    new THREE.Vector3(10, 0, 0)
  );
  const curve3 = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(10, 0, 0),
    new THREE.Vector3(15, 0, 5),
    new THREE.Vector3(20, 0, 0)
  );
  const curve4 = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(20, 0, 0),
    new THREE.Vector3(25, 0, -5),
    new THREE.Vector3(30, 0, 0)
  );

  path.add(curve1);
  path.add(curve2);
  path.add(curve3);
  path.add(curve4);

  // Criar as casas da trilha com cores alternadas e seguirem o caminho da curva
  const boxGeometry = new THREE.BoxGeometry(1, 0.5, 1);  // Formato de cada casa
  const colors = [0xffcc00, 0xffffff];  // Alternar entre amarelo e branco

  let numCasas = 40;  // Número de casas
  let espacamento = 1.5;  // Fator de espaçamento entre as casas  

  for (let i = 0; i < numCasas; i++) {
    const colorIndex = i % 2;  // Alternar entre 0 e 1 para mudar a cor
    const boxMaterial = new THREE.MeshBasicMaterial({ color: colors[colorIndex] });
    const box = new THREE.Mesh(boxGeometry, boxMaterial);

    // Posicionar a casa ao longo da curva, ajustando o espaçamento
    const t = (i * espacamento) / numCasas; // Adicionar espaçamento multiplicando o i
    const position = path.getPointAt(t);  // Posição ao longo da curva
    box.position.copy(position);
    scene.add(box);
    casas.push(position);
  }

}


function createQuestionUI() {
  // Criação de um fundo arredondado no canto inferior direito
  const questionContainer = document.createElement('div');
  questionContainer.style.position = 'absolute';
  questionContainer.style.top = '35%';
  questionContainer.style.bottom = '20px';
  questionContainer.style.right = '20px';
  questionContainer.style.width = '300px';
  questionContainer.style.height = '200px';
  questionContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'; // Fundo branco translúcido
  questionContainer.style.borderRadius = '15px';  // Cantos arredondados
  questionContainer.style.padding = '20px';
  questionContainer.style.display = 'flex';
  questionContainer.style.flexDirection = 'column';
  questionContainer.style.alignItems = 'center';
  questionContainer.style.justifyContent = 'space-between';
  document.body.appendChild(questionContainer);

  // Pergunta
  questionElement = document.createElement('div');
  questionElement.style.textAlign = 'center';
  questionElement.style.fontSize = '20px';
  questionElement.style.color = '#333';  // Cor do texto da pergunta
  questionElement.innerHTML = "Pergunta aqui";  // Placeholder da pergunta
  questionContainer.appendChild(questionElement);

  // Botões de resposta
  answerButtons = [];
  for (let i = 0; i < 4; i++) {
      const button = document.createElement('button');
      button.style.margin = '5px';
      button.style.width = '100%';
      button.style.padding = '10px';
      button.style.fontSize = '16px';
      button.style.borderRadius = '10px';  // Botões com cantos arredondados
      button.style.backgroundColor = '#f0f0f0';  // Cor dos botões
      button.style.border = 'none';
      button.style.cursor = 'pointer';
      
      // Efeito de hover no botão
      button.onmouseover = () => button.style.backgroundColor = '#d0d0d0';
      button.onmouseout = () => button.style.backgroundColor = '#f0f0f0';

      // Ação ao clicar no botão
      button.onclick = () => checkAnswer(i);
      questionContainer.appendChild(button);
      answerButtons.push(button);
  }
}
  

function askQuestion() {
  if (gameOver) return;
  questionElement.innerHTML = "Qual é a cor do céu?";  // Exemplo de pergunta

  // Alternativas
  const answers = ["Azul", "Verde", "Amarelo", "Vermelho"];
  for (let i = 0; i < 4; i++) {
      answerButtons[i].innerHTML = answers[i];
  }
}

function checkAnswer(index) {
  if (index === 0) {  // Resposta correta (0 = Azul)
      movePlayer(3);
  } else {
      movePlayer(-2);
  }

  nextTurn();
}

function movePlayer(steps) {
  const player = players[currentPlayer];
  player.position += steps;
  if (player.position < 0) player.position = 0;  // Não pode voltar antes da primeira casa

  if (player.position >= casas.length) {
      declareWinner(currentPlayer);
  } else {
      const newPosition = casas[player.position];
      player.mesh.position.set(newPosition.x, 1, newPosition.z);  // Mover para a nova posição
  }
}

function focusOnPlayer(player) {
  const playerPosition = player.mesh.position;

  // Define a nova posição da câmera em relação ao jogador
  const cameraOffset = new THREE.Vector3(0, 10, 10);  // Defina o deslocamento desejado da câmera
  const newCameraPosition = playerPosition.clone().add(cameraOffset);

  // Anima a câmera até a nova posição (opcional, para suavizar o movimento)
  new TWEEN.Tween(camera.position)
    .to(newCameraPosition, 1000)  // 1000 ms = 1 segundo para completar o movimento
    .easing(TWEEN.Easing.Quadratic.Out)
    .start();

  // Atualiza os controles para focar no jogador
  controls.target.copy(playerPosition);  // Faz o foco da câmera ser o cone do jogador
}

function nextTurn() {
  currentPlayer = (currentPlayer + 1) % players.length;
  focusOnPlayer(players[currentPlayer]); 
  askQuestion();  // Pergunta para o próximo jogador
}


function updatePlayerSaturation() {
  // Remove o filtro de todos os jogadores
  for (let i = 0; i < players.length; i++) {
      const playerElement = document.querySelector(`.jogador${i + 1}`);
      if (playerElement) {
          playerElement.classList.remove('saturate');  // Remove a classe de todos os jogadores
      }
  }

  // Aplicar o filtro de saturação aos outros jogadores, exceto o atual
  for (let i = 0; i < players.length; i++) {
      if (i !== currentPlayer) {  // Ignora o jogador atual
          const playerElement = document.querySelector(`.jogador${i + 1}`);
          if (playerElement) {
              playerElement.classList.add('saturate');  // Adiciona a classe de saturação
          }
      }
  }
}

function declareWinner(playerIndex) {
  gameOver = true;
  questionElement.innerHTML = `O Jogador ${playerIndex + 1} ganhou!`;
  answerButtons.forEach(button => button.disabled = true);  // Desabilitar os botões
}



function animate() {
  controls.update(); // only required if controls.enableDamping = true
  TWEEN.update();
  render();
  updatePlayerSaturation();
}

function render() {
  renderer.render(scene, camera);
}
