import {InputController} from './InputController.js';
import * as THREE from 'three';

//credits for fps controller https://www.youtube.com/watch?v=oqKzxPMLWxo

function clamp(x, a, b) {
  return Math.min(Math.max(x, a), b);
}

const KEYS = {
  'a': 65,
  's': 83,
  'w': 87,
  'd': 68,
};

class FirstPersonCamera{
  constructor(camera){
      this.camera_ = camera;
      this.input_ = new InputController();
      this.rotation_ = new THREE.Quaternion();
      this.translation_ = new THREE.Vector3(0,-0.245,5);
      this.phi_ = 0;
      this.phiSpeed_ = 8;
      this.theta_ = 0;
      this.thetaSpeed_ = 5;
      this.headBobActive_ = false;
      this.headBobTimer_ = 0;
  }

  update(timeElapsedS, sceneObjects){
      this.updateRotation_(timeElapsedS);
      this.updateCamera_(timeElapsedS, sceneObjects);
      this.updateTranslation_(timeElapsedS);
      this.updateHeadBob_(timeElapsedS)
      this.input_.update();
  }

  updateCamera_(timeElapsedS, sceneObjects){
      this.camera_.quaternion.copy(this.rotation_);
      this.camera_.position.copy(this.translation_);
      //use sin wave to make camera go up and down
      this.camera_.position.y += (Math.sin(this.headBobTimer_ * 10) * 0.04) + 0.5;

      //note for improvement make camera look at closest object.
      //Maybe using physics library like bullet.js
  }

  updateHeadBob_(timeElapsedS) {
    if (this.headBobActive_) {
      const wavelength = Math.PI;
      //compute how many steps weve taken
      //by taking the timer and multiplying by the frequency, turning that into an integer
      //which will allow us to stop at the end of a step instead of the middle 
      const nextStep = 1 + Math.floor(((this.headBobTimer_ + 0.000001) * 10) / wavelength);
      const nextStepTime = nextStep * wavelength / 10;
      this.headBobTimer_ = Math.min(this.headBobTimer_ + timeElapsedS, nextStepTime);

      if (this.headBobTimer_ == nextStepTime) {
        this.headBobActive_ = false;
      }
    }
  }

  updateTranslation_(timeElapsedS){
      const forwardVelocity = (this.input_.key(KEYS.w) ? 1 : 0) + (this.input_.key(KEYS.s) ? -1 : 0);
      const strafeVelocity = (this.input_.key(KEYS.a) ? 1 : 0) + (this.input_.key(KEYS.d) ? -1 : 0);

      const walkSpeed = 1.75;

      const qx = new THREE.Quaternion();
      qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi_);

      const forward = new THREE.Vector3(0,0,-1);
      forward.applyQuaternion(qx);
      forward.multiplyScalar(forwardVelocity * timeElapsedS * walkSpeed);

      const left = new THREE.Vector3(-1,0,0);
      left.applyQuaternion(qx);
      left.multiplyScalar(strafeVelocity * timeElapsedS * walkSpeed);

      this.translation_.add(forward);
      this.translation_.add(left);

      //if weve been moving then set head bob active to true
      if(forwardVelocity != 0 || strafeVelocity != 0){
        this.headBobActive_ = true;
      }
  }

  updateRotation_(deltaTime){
      const xh = this.input_.current_.mouseXDelta / window.innerWidth;
      const yh = this.input_.current_.mouseYDelta / window.innerHeight;

      this.phi_ += -xh * this.phiSpeed_;

      this.theta_ = clamp(this.theta_ + -yh * this.thetaSpeed_, -Math.PI / 3, Math.PI / 3);

      //console.log(this.theta_);
      const qx = new THREE.Quaternion();
      qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi_);
      const qz = new THREE.Quaternion();
      qz.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.theta_);

      const q = new THREE.Quaternion();
      q.multiply(qx);
      q.multiply(qz);

      this.rotation_.copy(q);
  }
}

export {FirstPersonCamera, KEYS};