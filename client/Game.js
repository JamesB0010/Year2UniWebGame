import * as THREE from 'three';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls';
import {GameObject} from '/GameObject.js';

//fps camera controls from https://www.youtube.com/watch?v=oqKzxPMLWxo
import {FirstPersonControls} from './node_modules/three/examples/jsm/controls/FirstPersonControls.js';

class Game{
    constructor(){
        this.scene;
        this.camera;
        this.renderer;
        this.gameObjects = [];
        this.player;
        this.players = new Map();
        this.controls;
        this.clock = new THREE.Clock();
    };
    Init(){
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.camera.position.z = 5;
        this.renderer.shadowMap.enabled = true;
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        //this.controls =  new OrbitControls(this.camera, this.renderer.domElement);

        this.controls = new FirstPersonControls(this.camera, this.renderer.domElement);
        this.controls.lookSpeed = 0.1;
        this.controls.movementSpeed = 3;

        this.scene.add(new THREE.AmbientLight(0xffffff, 0.4));

        let direcLight = new THREE.DirectionalLight(0xffffff, 1)
        direcLight.position.y = 2;
        direcLight.castShadow = true;

        this.scene.add(direcLight, new THREE.DirectionalLightHelper(direcLight));

        //add floor
        this.gameObjects.push(new GameObject({
            height: 0.5,
            width: 50,
            depth: 50,
            position: {
                x: 0,
                y: -1,
                z: 0
            }
        }));

        this.gameObjects.forEach(element => {
            this.scene.add(element);
        });
    
    }

    NewLocalPlayer(id){
        console.log("new local player");
        let localPlayer = new GameObject({
            gravityEnabled: true,
            position: {
                x: 0,
                y: 4,
                z: 0
            },
            color: 0x00ff00,
            inputEnabled: true,
            socketId: id
        });

        this.gameObjects.push(localPlayer);

        //setup input
        {
            let target = localPlayer;
        localPlayer.SetupInput({
            keyUp:{
                forwards: () =>{
                    target.velocity.z = 0;
                },
                backwards: () =>{
                    target.velocity.z = 0;
                },
                left: () =>{
                    target.velocity.x = 0;
                },
                right: ()=>{
                    target.velocity.x = 0;
                }
            },
            keyDown:{
                forwards: () =>{
                    target.velocity.z = -0.03;
                },
                backwards: () =>{
                    target.velocity.z = 0.03;
                },
                left: () =>{
                    target.velocity.x = -0.03;
                },
                right: ()=>{
                    target.velocity.x = 0.03;
                }
            }
        });
    }

    this.player = localPlayer;

    this.scene.add(localPlayer);

    }

    Update(socket){
        let deltaTime = this.clock.getDelta();

        this.gameObjects.forEach(element => {
            element.Update();
        });

        if(this.player){

            socket.emit("playerUpdatePosition", {pos: this.player.position, id: this.player.socketId});
        }

        this.controls.update(deltaTime);
        this.Render();
    }

    Render(){
        this.renderer.render(this.scene, this.camera);
    }

    NewPlayer({
        id,
        color = 0xff0000
    }){
        console.log("New Player");
        let _newPlayer = new GameObject({
            gravityEnabled: true,
            position: {
                x: 2,
                y: 4,
                z: 0
            },
            color: color,
            inputEnabled: false,
            socketId: id
        });

        this.gameObjects.push(_newPlayer);
        this.players.set(id, _newPlayer);
        this.scene.add(_newPlayer);
        return _newPlayer;
    };

    RemovePlayer(id){

        let _player = this.players.get(id);
        this.scene.remove(_player);
    }

    UpdateNetworkedObjectPos(data){

        let _player = this.players.get(data.id);

        if(_player){
            _player.position.x = data.pos.x;
            _player.position.y = data.pos.y;
            _player.position.z = data.pos.z;
        }
        else{
            _player = this.NewPlayer({
                id: data.id
            });
            _player.position.x = data.pos.x;
            _player.position.y = data.pos.y;
            _player.position.z = data.pos.z;
        }
    }
}

export {Game};