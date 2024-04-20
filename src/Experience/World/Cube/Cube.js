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
      this.debugFolder.close()
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

    this.faceNamesArray = ['bottom', 'top', 'back', 'front', 'left', 'right']

    this.cubes = []
    // Indices of all cubes in the order they are positioned
    this.cubeOrder = []
    this.setGeometry()
    this.setMaterial()
    this.setMeshes()

    this.rotateFace('right', true)
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
      metalness: 0.4,
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

    const positionAttribute = this.cubes[0].geometry.getAttribute('position')

    for (let i = 0; i < 27; i++) {
      this.cubeOrder[i] = i

      const mesh = new THREE.Mesh(this.cubes[i].geometry, this.material)
      mesh.castShadow = true
      mesh.receiveShadow = true

      this.cubes[i].mesh = mesh
      this.cubes[i].material = this.material
      this.cubeGroup.add(mesh)

      // Coloring
      this.cubes[i].colorsArray = new Float32Array(positionAttribute.count * 3)

      for (const faceName of this.faceNamesArray) {
        if (this.cubeIsAtPosition(faceName, i)) {
          this.setFaceColor(this.cubes[i], faceName)
        }
      }
    }

    // Position the single cubes
    this.setCubesPosition()

    // Poition the entire cube
    const offset = -(this.cubeDim + this.cubeSpacing)
    this.cubeGroup.position.set(offset, offset, offset)

    // // Get bounding Coordinates for group
    // const groupBox = new THREE.Box3().setFromObject(this.cubeGroup)
    // console.log(groupBox)
  }

  setCubesPosition() {
    this.cubeOrder.forEach((cubeIndex, i) => {
      this.cubes[cubeIndex].mesh.position.x =
        Math.floor((i % 9) / 3) * (this.cubeDim + this.cubeSpacing)
      this.cubes[cubeIndex].mesh.position.y =
        Math.floor(i / 9) * (this.cubeDim + this.cubeSpacing)
      this.cubes[cubeIndex].mesh.position.z =
        (i % 3) * (this.cubeDim + this.cubeSpacing)
    })
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
    this.setFaceColorsArray(cube.colorsArray, index, color)
    this.setFaceColorsArray(cube.colorsArray, index + 1, color)

    cube.mesh.geometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(cube.colorsArray, 3)
    )
  }

  setFaceColorsArray(colorsArray, index, color) {
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

  updateRotation(cube, axis, angle) {
    const newQuaternion = new THREE.Quaternion().setFromAxisAngle(axis, angle)
    if (cube.mesh.quaternion.angleTo(new THREE.Quaternion() !== 0)) {
      const oldQuaternion = cube.mesh.quaternion
      cube.mesh.applyQuaternion(oldQuaternion.multiply(newQuaternion))
    } else {
      // never turned before
      cube.mesh.applyQuaternion(newQuaternion)
    }
  }

  rotateFace(face, positiveRotation) {
    const cubeIndices = this.getFaceCubes(face)

    const rotationAxis = this.getRotationAxis(face, positiveRotation)

    for (const cubeIndex of cubeIndices) {
      this.updateRotation(this.cubes[cubeIndex], rotationAxis, Math.PI / 2)
    }

    this.setPositionForRotation(face, positiveRotation)
    this.setCubesPosition()
  }

  setPositionForRotation(face, positiveRotation) {
    const cubeIndices = this.getFaceCubes(face)
    const rotatedIndices = [
      cubeIndices[6],
      cubeIndices[3],
      cubeIndices[0],
      cubeIndices[7],
      cubeIndices[4],
      cubeIndices[1],
      cubeIndices[8],
      cubeIndices[5],
      cubeIndices[2],
    ]
    if (face === 'back' || face === 'bottom' || face === 'right') {
      rotatedIndices.reverse()
    }
    if (!positiveRotation) rotatedIndices.reverse()

    cubeIndices.forEach(
      (value, i) => (this.cubeOrder[value] = rotatedIndices[i])
    )
  }

  getRotationAxis(face, positiveRotation) {
    let axis
    switch (face) {
      case 'bottom':
        axis = new THREE.Vector3(0, -1, 0)
        break
      case 'top':
        axis = new THREE.Vector3(0, 1, 0)
        break
      case 'back':
        axis = new THREE.Vector3(0, 0, -1)
        break
      case 'front':
        axis = new THREE.Vector3(0, 0, 1)
        break
      case 'left':
        axis = new THREE.Vector3(-1, 0, 0)
        break
      case 'right':
        axis = new THREE.Vector3(1, 0, 0)
        break
    }
    if (!positiveRotation) {
      axis.multiplyScalar(-1)
    }

    return axis
  }

  getFaceCubes(face) {
    // return all cubes that belong to the face
    const cubeIndices = []
    for (let i = 0; i < 27; i++) {
      if (this.cubeIsAtPosition(face, i)) {
        cubeIndices.push(i)
      }
    }

    return cubeIndices
  }

  cubeIsAtPosition(position, i) {
    let isAtPosition = false
    switch (position) {
      case 'bottom':
        isAtPosition = i < 9
        break
      case 'top':
        isAtPosition = i > 17
        break
      case 'back':
        isAtPosition = i % 3 === 0
        break
      case 'front':
        isAtPosition = i % 3 === 2
        break
      case 'left':
        isAtPosition = i % 9 < 3
        break
      case 'right':
        isAtPosition = i % 9 > 5
        break

      default:
        break
    }

    return isAtPosition
  }

  // to be implemented
  // For raycasting click
  getFaceOrientation() {}
}
