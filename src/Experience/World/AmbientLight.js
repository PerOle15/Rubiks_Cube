import * as THREE from 'three'
import Experience from '../Experience'

export default class AmbientLight {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene

    this.setInstance()
  }

  setInstance() {
    this.instance = new THREE.AmbientLight('#ffffff', 0.7)
    this.scene.add(this.instance)
  }
}
