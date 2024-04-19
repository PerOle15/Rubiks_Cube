import * as THREE from 'three'
import Experience from '../Experience'

export default class SunLight {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene

    this.setInstance()
  }

  setInstance() {
    this.instance = new THREE.DirectionalLight('#ffffff', 4)
    this.instance.castShadow = true
    this.instance.shadow.camera.far = 10
    this.instance.shadow.mapSize.set(1024, 1024)

    this.instance.position.set(3, 2, 2)

    this.scene.add(this.instance)
  }
}
