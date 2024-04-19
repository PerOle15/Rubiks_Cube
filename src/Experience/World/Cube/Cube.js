import * as THREE from 'three'
import Experience from '../../Experience'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

export default class Cube {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene

    this.cubeDim = 0.5
    this.cubeSpacing = 0.02

    this.edgeSegments = 5

    // Indexes for coloring of the cube faces
    this.rightFaceIndex =
      2 * (2 * Math.pow(this.edgeSegments, 2) + 2 * this.edgeSegments)
    this.deltaIndex =
      2 * (4 * Math.pow(this.edgeSegments, 2) + 4 * this.edgeSegments) + 2

    this.setGeometry()
    this.setMaterial()
    this.setMeshes()
  }

  setGeometry() {
    this.geometry = new RoundedBoxGeometry(
      this.cubeDim,
      this.cubeDim,
      this.cubeDim,
      this.edgeSegments,
      0.04
    )
  }

  setMaterial() {
    this.material = new THREE.MeshStandardMaterial({
      vertexColors: true,
    })

    this.positionAttribute = this.geometry.getAttribute('position')

    this.colorsArray = new Float32Array(this.positionAttribute.count * 3)
  }

  setFaceColor(geometry, side) {
    // Reset geometry to black
    for (let i = 0; i < 6; i++) {
      const faceIndex = this.rightFaceIndex + this.deltaIndex * i
      this.setFaceArray(faceIndex, new THREE.Color(0, 0, 0))
      this.setFaceArray(faceIndex + 1, new THREE.Color(0, 0, 0))
    }

    let index
    let color
    switch (side) {
      case 'right':
        index = this.rightFaceIndex
        color = new THREE.Color('red')
        break
      case 'left':
        index = this.rightFaceIndex + this.deltaIndex
        color = new THREE.Color('orange')
        break
      case 'top':
        index = this.rightFaceIndex + this.deltaIndex * 2
        color = new THREE.Color('yellow')
        break
      case 'bottom':
        index = this.rightFaceIndex + this.deltaIndex * 3
        color = new THREE.Color('white')
        break
      case 'front':
        index = this.rightFaceIndex + this.deltaIndex * 4
        color = new THREE.Color('blue')
        break
      case 'back':
        index = this.rightFaceIndex + this.deltaIndex * 5
        color = new THREE.Color('green')
        break

      default:
        break
    }
    this.setFaceArray(index, color)
    this.setFaceArray(index + 1, color)

    geometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(this.colorsArray, 3)
    )
  }

  setFaceArray(index, color) {
    this.colorsArray[9 * index + 0] = color.r
    this.colorsArray[9 * index + 1] = color.g
    this.colorsArray[9 * index + 2] = color.b
    this.colorsArray[9 * index + 3] = color.r
    this.colorsArray[9 * index + 4] = color.g
    this.colorsArray[9 * index + 5] = color.b
    this.colorsArray[9 * index + 6] = color.r
    this.colorsArray[9 * index + 7] = color.g
    this.colorsArray[9 * index + 8] = color.b
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

    this.setFaceColor(this.smallCubes[0].geometry, 'top')
  }
}
