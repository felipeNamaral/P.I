import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as TWEEN from '@tweenjs/tween.js';


let camera, controls, scene, renderer;
let modeloFPS, trofeu;
let players = [];
let currentPlayer = 0;
let casas = [];
let questionElement, answerButtons;
let gameOver = false;
let mixer;
let questions = [];


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
  const grassTexture = textureLoader.load('/games/calculo/public/img/grama.jpeg'); // Insira o caminho da sua textura
  grassTexture.wrapS = THREE.RepeatWrapping;
  grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(10, 10); // Repetir a textura para cobrir uma grande área

  const groundGeometry = new THREE.PlaneGeometry(300, 300); // Definir o chão
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
  const loader = new GLTFLoader().setPath('/games/calculo/public/mt/');
  // Carrga o modelo 3D
  loader.load('scene.gltf', (gltf) => {
    modeloFPS = gltf.scene;
    modeloFPS.position.set(50, -30, -90); // Ajuste a posição conforme necessário
    modeloFPS.scale.set(30, 30, 30); // Ajuste a posição conforme necessário
    modeloFPS.rotation.set(0, Math.PI, 0);
    scene.add(modeloFPS);

  });



  // modelo arvore

  const Aloader = new GLTFLoader().setPath('/games/calculo/public/arvore/'); // Cria um loader e define o caminho

  // Número de árvores que você deseja adicionar
  const numArvores = 200; // Ajuste conforme necessário

  // Array para armazenar posições ocupadas
  const positionsOccupied = [];

  // Carrega o modelo 3D
  Aloader.load('scene.gltf', (gltf) => {
    for (let i = 0; i < numArvores; i++) {
      const modeloArvore = gltf.scene.clone(); // Clona o modelo da árvore

      let x, z;
      let isValidPosition = false; // Variável para verificar se a posição é válida

      // Continue tentando encontrar uma posição válida
      while (!isValidPosition) {
        // Defina posições aleatórias para as árvores
        x = Math.random() * 200 - 100; // Ajuste os limites conforme necessário
        z = Math.random() * 200 - 100; // Ajuste os limites conforme necessário

        // Verifica se a posição está fora do retângulo proibido
        if (isPositionValid(x, z) && !isPositionOccupied(x, z)) {
          isValidPosition = true; // A posição é válida se estiver fora do retângulo e não ocupada
          positionsOccupied.push({ x, z }); // Armazena a nova posição
        }
      }

      modeloArvore.position.set(x, -0.5, z); // Coloca a árvore na posição aleatória

      // Adiciona uma pequena rotação aleatória
      modeloArvore.rotation.set(0, Math.random() * Math.PI * 2, 0); // Rotação aleatória ao redor do eixo Y

      // (Opcional) Ajuste a escala aleatória da árvore
      const scale = 0.5 + Math.random() * 0.5; // Escala entre 0.5 e 1
      modeloArvore.scale.set(scale, scale, scale); // Aplica a escala

      scene.add(modeloArvore); // Adiciona a árvore à cena
    }
  });

  // Função para verificar se a posição está fora do retângulo proibido
  function isPositionValid(x, z) {
    return !(
      x >= -10 && x <= 30 && z >= -10 && z <= 10 // Retângulo proibido
    );
  }

  // Função para verificar se a posição está ocupada
  function isPositionOccupied(x, z) {
    const threshold = 2; // Distância mínima para considerar uma posição ocupada
    return positionsOccupied.some(pos => {
      return Math.abs(pos.x - x) < threshold && Math.abs(pos.z - z) < threshold;
    });
  }

  const Tloader = new GLTFLoader().setPath('/games/calculo/public/trofeu/');
  // Carrga o modelo 3D
  Tloader.load('scene.gltf', (gltf) => {
    trofeu = gltf.scene;
    trofeu.position.set(32, -2, -0.5);
    trofeu.scale.set(0.4, 0.4, 0.4);
    trofeu.rotation.set(0, 2, 0);
    scene.add(trofeu);

    // Spotlight direcionada ao troféu
    const trophySpotlight = new THREE.SpotLight(0xffffff, 1.5);  // Luz branca, intensidade 1.5
    trophySpotlight.position.set(25, 10, -2);  // Posicionar a luz acima e ligeiramente à frente do troféu
    trophySpotlight.target = trofeu;  // Apontar diretamente para o troféu
    trophySpotlight.angle = Math.PI / 6;  // Controlar o ângulo do feixe de luz

    scene.add(trophySpotlight);

    // // Adicionar um helper para visualizar o spotlight (opcional)
    // const spotLightHelper = new THREE.SpotLightHelper(trophySpotlight);
    // scene.add(spotLightHelper);
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


  loadQuestions();
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
  const boxGeometry = new THREE.BoxGeometry(1, 0.5, 3);  // Formato de cada casa
  const colors = [0xffcc00, 0xffffff];  // Alternar entre amarelo e branco

  let numCasas = 30;  // Número de casas
  let espacamento = 1;  // Fator de espaçamento entre as casas  

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

  // Criação do botão "Voltar para o Início"
  const backButton = document.createElement('button');
  backButton.innerText = 'Sair';
  backButton.style.position = 'absolute';
  backButton.style.bottom = '20px'; // Distância do fundo
  backButton.style.left = '50%'; // Centralizar horizontalmente
  backButton.style.transform = 'translateX(-50%)'; // Ajuste para centralizar
  backButton.style.padding = '10px 20px';
  backButton.style.fontSize = '16px';
  backButton.style.borderRadius = '10px';
  backButton.style.backgroundColor = 'whigt'; // Cor do botão
  backButton.style.color = 'black'; // Cor do texto
  backButton.style.border = 'none';
  backButton.style.cursor = 'pointer';

  // Adiciona o evento de clique para redirecionar
  backButton.onclick = () => {
    window.location.href = '/games/calculo/inicio/inicio.html'; // Substitua pelo URL da sua página inicial
  };

  document.body.appendChild(backButton);


}


function createQuestionUI() {
  // Criação de um fundo arredondado no canto inferior direito
  const questionContainer = document.createElement('div');
  questionContainer.style.position = 'absolute';
  questionContainer.style.top = '35%';
  questionContainer.style.bottom = '20px';
  questionContainer.style.right = '20px';
  questionContainer.style.width = '300px';
  questionContainer.style.height = '250px';
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


function loadQuestions() {
  fetch('/games/calculo/public/perguntas.json')  // Atualize o caminho se necessário
    .then(response => {
      if (!response.ok) throw new Error('Erro ao carregar perguntas');
      return response.json();
    })
    .then(data => {
      questions = data;  // Armazenar as perguntas carregadas
      askQuestion();  // Pergunta inicial
    })
    .catch(error => {
      console.error('Erro:', error);
    });
}

let currentQuestionIndex = -1; // Índice da pergunta atual

function askQuestion() {
  if (gameOver) return;

  if (questions.length === 0) {
    questionElement.innerHTML = "Nenhuma pergunta disponível.";
    return;
  }

  // Seleciona uma pergunta aleatória
  currentQuestionIndex = Math.floor(Math.random() * questions.length);
  const currentQuestion = questions[currentQuestionIndex];

  questionElement.innerHTML = currentQuestion.pergunta;  // Usa a pergunta do JSON

  // Alternativas
  const answers = currentQuestion.respostas;
  for (let i = 0; i < 4; i++) {
    answerButtons[i].innerHTML = answers[i];
  }

  MathJax.typeset();
}

function checkAnswer(index) {
  // Verifica se a resposta está correta usando as respostas processadas
  const currentQuestion = questions[currentQuestionIndex];

  if (currentQuestion && currentQuestion.respostaCorreta === index) {
    movePlayer(3);
  } else {
    movePlayer(-1);
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

    // Ajustar a posição dos cones na mesma casa
    const playersOnSameTile = players.filter(p => p.position === player.position);
    const offset = 1;  // Distância entre os cones

    playersOnSameTile.forEach((p, index) => {
      // Distribui os cones lado a lado na direção do eixo Z
      const zOffset = index * offset;  // Posiciona cada cone lado a lado no eixo Z

      // Adicionando animação de movimento usando TWEEN.js
      new TWEEN.Tween(p.mesh.position)
        .to({ x: newPosition.x, y: 1, z: newPosition.z + zOffset }, 1000) // Duração de 1 segundo
        .easing(TWEEN.Easing.Quadratic.InOut) // Efeito suave
        .start(); // Inicia a animação
    });
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
  // Inicialmente, salva o jogador atual
  let originalPlayer = currentPlayer;

  do {
    // Avança para o próximo jogador
    currentPlayer = (currentPlayer + 1) % players.length;

    // Verifica se o jogador atual tem um nome
    const currentPlayerName = localStorage.getItem(`jogador${currentPlayer + 1}`);

    // Se encontramos um jogador com nome, saímos do loop
    if (currentPlayerName) {
      break; // Para o loop se o jogador atual tiver nome
    }

    // Se todos os jogadores tiverem sido verificados e nenhum nome válido foi encontrado
    if (currentPlayer === originalPlayer) {
      // Se todos os jogadores não têm nome, podemos fazer algo, como reiniciar o jogo ou finalizar.
      console.log("Nenhum jogador válido encontrado. Finalizando o jogo.");
      return; // Para evitar entrar em um loop infinito
    }

  } while (true); // Continua até encontrar um jogador com nome

  // Foca no jogador atual e pergunta
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

  // Obter o nome do jogador vencedor
  const winnerName = localStorage.getItem(`jogador${playerIndex + 1}`);

  // Armazenar o nome do vencedor para uso na página de vitória
  localStorage.setItem('winnerName', winnerName);

  // Exibir uma mensagem temporária antes de redirecionar
  questionElement.innerHTML = `O Jogador ${winnerName} ganhou! Redirecionando...`;

  // Redirecionar após 3 segundos
  setTimeout(() => {
    window.location.href = '/games/calculo/fim/fim.html'; // Substitua pelo caminho correto
  }, 1000);
}



function animate() {
  controls.update();
  TWEEN.update();
  if (mixer) mixer.update(0.01);
  render();
  updatePlayerSaturation();
}

function render() {
  renderer.render(scene, camera);
}






