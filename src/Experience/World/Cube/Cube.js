import * as THREE from 'three'
import Experience from '../../Experience'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

export default class Cube {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene

    this.cubeDim = 0.5
    this.cubeSpacing = 0.02

    this.setGeometry()
    this.setMaterial()
    this.setMeshes()
  }

  setGeometry() {
    this.geometry = new RoundedBoxGeometry(
      this.cubeDim,
      this.cubeDim,
      this.cubeDim,
      5,
      0.04
    )
  }

  setMaterial() {
    this.material = new THREE.MeshStandardMaterial({
      color: 0xad286b,
    })
  }

  setMeshes() {
    this.cubeGroup = new THREE.Group()
    this.scene.add(this.cubeGroup)

    this.smallCubes = []
    for (let i = 0; i < 27; i++) {
      const mesh = new THREE.Mesh(this.geometry, this.material)
      mesh.position.x =
        Math.floor((i % 9) / 3) * (this.cubeDim + this.cubeSpacing)
      mesh.position.y = Math.floor(i / 9) * (this.cubeDim + this.cubeSpacing)
      mesh.position.z = (i % 3) * (this.cubeDim + this.cubeSpacing)
      mesh.castShadow = true
      mesh.receiveShadow = true

      this.smallCubes.push(mesh)

      this.cubeGroup.add(mesh)
    }

    const offset = -(this.cubeDim + this.cubeSpacing)
    this.cubeGroup.position.set(offset, offset, offset)

    // // Get bounding Coordinates for group
    // const groupBox = new THREE.Box3().setFromObject(this.cubeGroup)
    // console.log(groupBox)
  }
}
