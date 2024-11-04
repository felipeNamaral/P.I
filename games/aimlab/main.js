import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const acertosEl = document.querySelector('#score');
const precisaoEl = document.querySelector('#precisao');
const timeEl = document.querySelector('#time');


let scene, camera, renderer, clock, controls;
let modeloFPS, bola, bolas = [];
let crosshair;
let raycaster;
let selectedBall = null;
let pointLight, spotLight;
let mixers = [];
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let isJumping = false;
let jumpVelocity = 0;
const jumpHeight = 2.3;
const gravity = -10;
let bullet;
let time = 70;


let score = 0, erros = 0, precisao = 0, pts = 0;


let interval = setInterval(decreaseTime, 1000);

init();
animate();
decreaseTime();

function init() {
    scene = new THREE.Scene();
    // Carregador de texturas
    const textureLoader = new THREE.TextureLoader();

    // Textura para o chão
    const floorTexture = textureLoader.load('/games/aimlab/public/img/texturaChao.jpeg');
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(4, 4); // Ajuste para repetir a textura no chão

    const floorMaterial = new THREE.MeshBasicMaterial({ map: floorTexture });
    const floorGeometry = new THREE.PlaneGeometry(400, 400); // Ajuste a profundidade/largura do chão
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -10, 0);// Deita o plano para ser o chão
    scene.add(floor);

    // Textura para o teto
    const ceilingTexture = textureLoader.load('/games/aimlab/public/img/texturaTop.jpeg');
    const ceilingMaterial = new THREE.MeshBasicMaterial({ map: ceilingTexture });
    const ceilingGeometry = new THREE.PlaneGeometry(400, 400); // Mesma dimensão do chão
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.position.y = 200; // Eleva o teto
    ceiling.rotation.x = Math.PI / 2; // Deita o plano para ser o teto
    scene.add(ceiling);
    const walls = new THREE.Group();

    // --- Parede Curva (Cilindro Parcial) ---
    const curvaGeometry = new THREE.CylinderGeometry(50, 50, 50, 32, 1, true, Math.PI / 4, Math.PI / 2);
    const curvaMaterial = new THREE.MeshBasicMaterial({ color: 0x202020, side: THREE.DoubleSide });
    const paredeCurva = new THREE.Mesh(curvaGeometry, curvaMaterial);

    // Posição e rotação da parede curva
    paredeCurva.position.set(0, 100, 60); // Ajusta conforme necessário
    paredeCurva.scale.set(5, 5, 5); // Ajusta conforme necessário
    paredeCurva.rotation.y = Math.PI / 2; // Gira a parede para ficar na frente
    walls.add(paredeCurva);



    const ItextureLoader = new THREE.TextureLoader();
    const Itexture = ItextureLoader.load('/games/aimlab/public/img/logo21.jpeg');




    const IcurvaGeometry = new THREE.CylinderGeometry(50, 50, 50, 32, 1, true, Math.PI / 4, Math.PI / 2);
    const IcurvaMaterial = new THREE.MeshBasicMaterial({ map:Itexture, side: THREE.DoubleSide });
    const IparedeCurva = new THREE.Mesh(IcurvaGeometry, IcurvaMaterial);



    // Posição e rotação da parede curva
    IparedeCurva.position.set(0, 100, -64); // Ajusta conforme necessário
    IparedeCurva.scale.set(2.5, 2.5, 2.5); // Ajusta conforme necessário
    IparedeCurva.rotation.y = Math.PI / 2; // Gira a parede para ficar na frente
    walls.add(IparedeCurva);




    // --- Parede Lateral Direita ---
    const lateralDireitaGeometry = new THREE.PlaneGeometry(50, 25);
    const lateralDireitaMaterial = new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide });
    const paredeLateralDireita = new THREE.Mesh(lateralDireitaGeometry, lateralDireitaMaterial);

    // Posiciona e gira a parede lateral direita
    paredeLateralDireita.position.set(150, 2.5, -5);
    paredeLateralDireita.scale.set(40, 40, 40);
    paredeLateralDireita.rotation.y = -Math.PI / 2;
    walls.add(paredeLateralDireita);

    // --- Parede Lateral Esquerda ---
    const lateralEsquerdaGeometry = new THREE.PlaneGeometry(50, 25);
    const lateralEsquerdaMaterial = new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide });
    const paredeLateralEsquerda = new THREE.Mesh(lateralEsquerdaGeometry, lateralEsquerdaMaterial);

    // Posiciona e gira a parede lateral esquerda
    paredeLateralEsquerda.position.set(-150, 2.5, -5);
    paredeLateralEsquerda.scale.set(40, 40, 40);
    paredeLateralEsquerda.rotation.y = Math.PI / 2;
    walls.add(paredeLateralEsquerda);

    // --- Parede Traseira ---
    const traseiraGeometry = new THREE.PlaneGeometry(50, 25);
    const traseiraMaterial = new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide });
    const paredeTraseira = new THREE.Mesh(traseiraGeometry, traseiraMaterial);

    // Posição da parede traseira
    paredeTraseira.position.set(0, 2.5, 200); // Atrás do jogador
    paredeTraseira.scale.set(40, 40, 40); // Atrás do jogador
    walls.add(paredeTraseira);

    // Adiciona o grupo de paredes à cena
    scene.add(walls);


    // Configura a câmera no estilo FPS
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 0);
    camera.rotation.order = 'YXZ'; // Posição em altura típica de FPS

    // Renderizador
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, 628.4);
    document.getElementById('game-container').appendChild(renderer.domElement);


    // Relógio para animações
    clock = new THREE.Clock();


    // Adiciona luz à cena
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(51, 100, 7.5).normalize();
    scene.add(light);


    controls = new PointerLockControls(camera, document.body);

    const instructions = document.getElementById('oi');

    instructions.addEventListener('click', function () {
        controls.lock();
    });

    // Carrega o modelo GLB único (braço + arma)
    const loader = new GLTFLoader().setPath('/games/aimlab/public/tactical_pistol/');

    // Carrega o modelo 3D
    loader.load('scene.gltf', (gltf) => {
        modeloFPS = gltf.scene;
        modeloFPS.position.set(2, -3, -9); // Ajuste a posição conforme necessário
        modeloFPS.rotation.set(0, Math.PI, 0);
        modeloFPS.traverse((child) => {
            if (child.isMesh) {
                child.material.depthTest = false; // Desativa o teste de profundidade para a arma
                child.renderOrder = 1; // Garante que a arma fique sobreposta
            }
        });   // Rotaciona para ficar de frente
        camera.add(modeloFPS);

    }, undefined, function (error) {
        console.error('Ocorreu um erro ao carregar o modelo:', error);
    });



    // Carrega o modelo da bola
    const Bloader = new GLTFLoader().setPath('/games/aimlab/public/bola/');
    Bloader.load('scene.gltf', (gltf) => {
        for (let i = 0; i < 3; i++) {
            const bola = gltf.scene.clone();
            bola.scale.set(0.1, 0.1, 0.1);
            scene.add(bola);
            bolas.push(bola);

            // Adiciona o AnimationMixer para controlar as animações
            const mixer = new THREE.AnimationMixer(bola);
            mixers.push(mixer);  // Armazena o mixer de cada bola

            // Carrega a animação e a armazena no mixer
            if (gltf.animations && gltf.animations.length > 0) {
                const action = mixer.clipAction(gltf.animations[0]);  // Supondo que a primeira animação seja a correta
                action.loop = THREE.LoopOnce;  // Reproduz a animação apenas uma vez
            }
        }

        // Posiciona as bolas em locais diferentes
        bolas[0].position.set(-10, 1, -30);
        bolas[1].position.set(5, 1, -30);
        bolas[2].position.set(10, 10, -30);
    });

    spotLight = new THREE.SpotLight(0xffffff, 800);  // Luz branca, intensidade 1.5

    // Posiciona a luz acima do personagem (câmera)
    spotLight.position.set(0, 3, -10);  // X e Z no centro, Y acima da câmera

    // Define o ângulo da luz para cobrir uma área maior
    spotLight.angle = Math.PI / 3;  // Ajusta o ângulo do feixe de luz

    // Define o alvo da luz para apontar para a frente (parede da frente)
    const targetObject = new THREE.Object3D();
    targetObject.position.set(0, 1, -30);  // Aponta para a parede da frente
    scene.add(targetObject);  // Adiciona o alvo à cena

    spotLight.target = targetObject;  // Direciona a luz para o alvo

    // Adiciona a luz Spotlight à cena
    scene.add(spotLight);

    // // Opcional: Adicionar um SpotLightHelper para visualizar o foco da luz
    // const spotLightHelper = new THREE.SpotLightHelper(spotLight);
    // scene.add(spotLightHelper);

    // Cria a bolinha amarela
    const bulletGeometry = new THREE.SphereGeometry(0.6, 16, 16); // Ajuste o tamanho conforme necessário
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 }); // Cor amarela
    bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    // Define a posição da bolinha na boca da arma
    bullet.position.set(0.7, -0.8, -9); // Ajuste conforme a posição da boca da arma
    camera.add(bullet);
    bullet.visible = false

    // Adiciona uma mira simples no centro da tela
    const geometry = new THREE.RingGeometry(0.0, 0.015, 100);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    crosshair = new THREE.Mesh(geometry, material);
    crosshair.position.z = -2; // Posição da mira à frente da câmera
    camera.add(crosshair);
    scene.add(camera);

    raycaster = new THREE.Raycaster();

    // Adiciona evento de clique do mouse
    document.addEventListener('mousedown', onMouseDown, false);
    document.addEventListener('mouseup', onMouseUp, false);
    // Eventos de teclado para movimentação
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);

}

// Funções para detectar teclas pressionadas
function onKeyDown(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = true;
            break;
        case 'Space': // Tecla de pulo
            if (!isJumping) {
                isJumping = true; // Começa o pulo
                jumpVelocity = jumpHeight; // Inicia a velocidade de pulo
            }
            break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            break;
    }
}

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const speed = 500;

    // Atualiza direção do movimento
    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();

    // Aplica a velocidade
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    if (moveForward || moveBackward) velocity.z -= direction.z * speed * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * speed * delta;

    // Lógica do pulo
    if (isJumping) {
        jumpVelocity += gravity * delta; // Aplica a gravidade
        camera.position.y += jumpVelocity; // Move a câmera na direção Y

        // Se a câmera descer abaixo do nível do chão, termina o pulo
        if (camera.position.y <= 1.6) {
            camera.position.y = 1.6; // Restaura a altura
            isJumping = false; // Para o pulo
            jumpVelocity = 0; // Reseta a velocidade do pulo
        }
    }

    // Atualiza a posição da câmera conforme a velocidade calculada
    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);

    // Animação da arma e outras lógicas de colisão/objetos
    if (modeloFPS) {
        const t = clock.getElapsedTime();
        modeloFPS.position.y += Math.sin(t * 2) * 0.002; // Oscilação da arma
    }

    // Raycaster para bolas e mira (mantido)
    raycaster.setFromCamera({ x: 0, y: 0 }, camera);
    const intersects = raycaster.intersectObjects(bolas, true);

    if (intersects.length > 0) {
        selectedBall = intersects[0].object;
    } else {
        selectedBall = null;
    }

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});


let sound;
let shootingInterval; // Variável para armazenar o intervalo

function playShootSound() {
    sound = new Audio('/games/aimlab/public/pistol-shot-233473.mp3'); // Cria uma nova instância de som
    sound.volume = 0.5; // Ajuste o volume conforme necessário
    sound.play();
    playBallAnimation() // Toca o som
}

function startShooting() {
    shootingInterval = setInterval(playShootSound, 100); // Toca o som a cada 100 ms enquanto pressionado
}

function stopShooting() {
    clearInterval(shootingInterval); // Para de tocar o som
}

// Função para fazer a bolinha aparecer e desaparecer
function playBallAnimation() {
    // Torna a bolinha visível
    bullet.visible = true;

    // Define um tempo para a bolinha desaparecer
    setTimeout(() => {
        bullet.visible = false;
    }, 50); // 100 milissegundos para uma aparição rápida
}

function onMouseDown(event) {
    playShootSound()
    startShooting();
    if (selectedBall) {
        const ball = selectedBall.parent; // Obtém o grupo principal da bola
        // Faz a bola desaparecer
        ball.visible = false;
        score++;
        calculatePrecisao();
        pts = ((score * 1100))
        acertosEl.innerHTML = pts;
        // Após 1 segundo, faz a bola reaparecer em uma nova posição aleatória
        setTimeout(() => {
            // Gera posições aleatórias para X e Y
            const randomX = Math.random() * 50 - 20; // Posição X aleatória entre -20 e 30
            const randomY = Math.random() * 99 + 1;  // Posição Y aleatória entre 1 e 10
            const fixedZ = -30;                     // Z fixo em -30

            // Define a nova posição aleatória da bola
            ball.position.set(randomX, randomY, fixedZ);
            ball.visible = true;
        }, 500); // Reaparece após 1 segundo
    } else {
        erros++;
        pts = pts - (erros * 500)
        acertosEl.innerHTML = pts;
        calculatePrecisao()
    }
}

function onMouseUp(event) {
    stopShooting(); // Para de tocar o som quando o botão do mouse é solto
}



const fullScreenBtn = document.querySelector('#telaCheia');
fullScreenBtn.addEventListener('click', fullScreen);
let elem = document.documentElement;
function fullScreen() {
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullScreen) {
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    }
}

function calculatePrecisao() {
    precisao = (score / (score + erros)) * 100;
    precisao = precisao.toFixed(2);
    precisaoEl.innerHTML = `${precisao}%`;
}



function decreaseTime() {
    if (time === 0) {
        finishGame();
    }
    let current = --time;
    let miliseconds = time * 1000;

    let minutes = Math.floor(miliseconds / (1000 * 60));
    let seconds = Math.floor((miliseconds % (1000 * 60)) / 1000);
    //zero na esquerda
    seconds = seconds < 10 ? "0" + seconds : seconds;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    setTime(`${minutes}:${seconds}`);
}

function setTime(time) {
    timeEl.innerHTML = time;
}


function finishGame() {
    // Armazenando os resultados no Local Storage
    localStorage.setItem('score', pts);
    localStorage.setItem('precisao', precisao);
    localStorage.setItem('erros', erros);
    window.location.href = '/games/aimlab/fim/fim.html';
}