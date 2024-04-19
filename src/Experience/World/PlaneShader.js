import * as THREE from 'three'
import Experience from '../Experience.js'

export default class PlaneShader {
  constructor(vertexShader, fragmentShader) {
    this.experience = new Experience()
    this.scene = this.experience.scene

    this.vertexShader = vertexShader
    this.fragmentShader = fragmentShader

    this.setGeometry()
    this.setMaterial()
    this.setMesh()
  }

  setGeometry() {
    this.geometry = new THREE.PlaneGeometry(1, 1, 256, 256)
  }

  setMaterial() {
    this.material = new THREE.ShaderMaterial({
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
    })
  }

  setMesh() {
    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.mesh.position.y = 2.5
    this.scene.add(this.mesh)
  }
}
