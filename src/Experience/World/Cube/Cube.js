import * as THREE from 'three'
import Experience from '../../Experience'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

export default class Cube {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene

    // Debug
    this.debug = this.experience.debug
    if (this.debug.active) {
      this.debugFolder = this.debug.gui.addFolder('Cube')
    }

    // Dimensions
    this.cubeDim = 0.5
    this.cubeSpacing = 0.015

    this.edgeSegments = 5

    // Indices for coloring of the cube faces
    this.rightFaceIndex =
      2 * (2 * Math.pow(this.edgeSegments, 2) + 2 * this.edgeSegments)
    this.deltaIndex =
      2 * (4 * Math.pow(this.edgeSegments, 2) + 4 * this.edgeSegments) + 2

    this.cubes = []
    this.setGeometry()
    this.setMaterial()
    this.setMeshes()
  }

  setGeometry() {
    for (let i = 0; i < 27; i++) {
      this.cubes.push({
        geometry: new RoundedBoxGeometry(
          this.cubeDim,
          this.cubeDim,
          this.cubeDim,
          this.edgeSegments,
          0.04
        ),
      })
    }
  }

  setMaterial() {
    this.material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      metalness: 0.3,
      roughness: 0.9,
    })

    if (this.debug.active) {
      this.debugFolder.add(this.material, 'metalness', 0, 1, 0.001)
      this.debugFolder.add(this.material, 'roughness', 0, 1, 0.001)
    }
  }

  setMeshes() {
    this.cubeGroup = new THREE.Group()
    this.scene.add(this.cubeGroup)

    // const colorsArray = new Float32Array(positionAttribute.count * 3)

    // for (let i = 0; i < positionAttribute.count; i++) {
    //   colorsArray[i * 3 + 0] = 0
    //   colorsArray[i * 3 + 1] = 0
    //   colorsArray[i * 3 + 2] = 0
    // }
    // this.geometry.setAttribute(
    //   'color',
    //   new THREE.Float32BufferAttribute(colorsArray, 3)
    // )

    const positionAttribute = this.cubes[0].geometry.getAttribute('position')

    for (let i = 0; i < 27; i++) {
      const mesh = new THREE.Mesh(this.cubes[i].geometry, this.material)

      //Positioning the cubes
      mesh.position.x =
        Math.floor((i % 9) / 3) * (this.cubeDim + this.cubeSpacing)
      mesh.position.y = Math.floor(i / 9) * (this.cubeDim + this.cubeSpacing)
      mesh.position.z = (i % 3) * (this.cubeDim + this.cubeSpacing)
      mesh.castShadow = true
      mesh.receiveShadow = true

      this.cubes[i].mesh = mesh
      this.cubes[i].material = this.material
      this.cubeGroup.add(mesh)

      // Coloring
      this.cubes[i].colorsArray = new Float32Array(positionAttribute.count * 3)

      if (i < 9) {
        this.setFaceColor(this.cubes[i], 'bottom')
      }
      if (i > 17) {
        this.setFaceColor(this.cubes[i], 'top')
      }
      if (i % 3 === 0) {
        this.setFaceColor(this.cubes[i], 'back')
      }
      if (i % 3 === 2) {
        this.setFaceColor(this.cubes[i], 'front')
      }
      if (i % 9 < 3) {
        this.setFaceColor(this.cubes[i], 'left')
      }
      if (i % 9 > 5) {
        this.setFaceColor(this.cubes[i], 'right')
      }
    }

    // Poition the cube
    const offset = -(this.cubeDim + this.cubeSpacing)
    this.cubeGroup.position.set(offset, offset, offset)

    // // Get bounding Coordinates for group
    // const groupBox = new THREE.Box3().setFromObject(this.cubeGroup)
    // console.log(groupBox)
  }

  setFaceColor(cube, side) {
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
    this.setFaceArray(cube.colorsArray, index, color)
    this.setFaceArray(cube.colorsArray, index + 1, color)

    cube.mesh.geometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(cube.colorsArray, 3)
    )
  }

  setFaceArray(colorsArray, index, color) {
    colorsArray[9 * index + 0] = color.r
    colorsArray[9 * index + 1] = color.g
    colorsArray[9 * index + 2] = color.b
    colorsArray[9 * index + 3] = color.r
    colorsArray[9 * index + 4] = color.g
    colorsArray[9 * index + 5] = color.b
    colorsArray[9 * index + 6] = color.r
    colorsArray[9 * index + 7] = color.g
    colorsArray[9 * index + 8] = color.b
  }
}
