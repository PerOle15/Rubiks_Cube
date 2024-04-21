import * as THREE from 'three'
import Experience from '../../Experience'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import EventEmitter from '../../Utils/EventEmitter'

export default class Cube extends EventEmitter {
  constructor() {
    super()
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.time = this.experience.time

    // Debug
    this.debug = this.experience.debug
    if (this.debug.active) {
      this.debugFolder = this.debug.gui.addFolder('Cube')
      this.debugFolder.close()
    }

    this.setup()

    this.experience.resources.on('ready', () => {
      this.rotateFace('right', true)
      setTimeout(() => {
        this.rotateFace('front', true)
        setTimeout(() => {
          this.rotateFace('left', true)
          setTimeout(() => {
            this.rotateFace('back', true)
          }, 2000)
        }, 2000)
      }, 2000)
    })
  }

  setup() {
    this.setConstants()

    this.cubes = []
    // Indices of all cubes in the order they are positioned
    this.cubeOrder = []
    this.setGeometry()
    this.setMaterial()
    this.setMeshes()

    this.isRotating = false
    // rotation duration in ms
    this.rotationDuration = 1000
  }

  /**
   * updates the state of the cube
   */
  update() {
    if (this.isRotating) {
      if (this.currentRotationTime < this.rotationDuration) {
        this.currentRotationTime += this.time.delta
        this.rotationStep()
        this.positionStep()
      } else {
        this.isRotating = false
        this.setPositionForRotation(
          this.currentRotationFace,
          this.currentPositiveRotation
        )
        this.setRotatedCubesPosition()
      }
    }
  }

  setConstants() {
    // Dimensions
    this.cubeDim = 0.5
    this.cubeSpacing = 0.015

    this.offset = -(this.cubeDim + this.cubeSpacing)

    this.edgeSegments = 5

    // Indices for coloring of the cube faces
    this.rightFaceIndex =
      2 * (2 * Math.pow(this.edgeSegments, 2) + 2 * this.edgeSegments)
    this.deltaIndex =
      2 * (4 * Math.pow(this.edgeSegments, 2) + 4 * this.edgeSegments) + 2

    this.faceNamesArray = ['bottom', 'top', 'back', 'front', 'left', 'right']
  }

  /**
   * Adds all geometries to this.cubes
   */
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

  /**
   * Setup the material
   */
  setMaterial() {
    this.material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      metalness: 0,
      roughness: 0.74,
    })

    if (this.debug.active) {
      this.debugFolder.add(this.material, 'metalness', 0, 1, 0.001)
      this.debugFolder.add(this.material, 'roughness', 0, 1, 0.001)
    }
  }

  /**
   * Setup all cubie meshes
   */
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
    this.setAllCubesPosition()

    // Poition the entire cube
    // this.offset = -(this.cubeDim + this.cubeSpacing)
    // this.cubeGroup.position.set(this.offset, this.offset, this.offset)

    // // Get bounding Coordinates for group
    // const groupBox = new THREE.Box3().setFromObject(this.cubeGroup)
    // console.log(groupBox)
  }

  /**
   * Sets the position of all cubies according to the order of cubeOrder
   */
  setAllCubesPosition() {
    this.cubeOrder.forEach((cubeIndex, i) => {
      this.cubes[cubeIndex].mesh.position.x =
        Math.floor((i % 9) / 3) * (this.cubeDim + this.cubeSpacing) +
        this.offset
      this.cubes[cubeIndex].mesh.position.y =
        Math.floor(i / 9) * (this.cubeDim + this.cubeSpacing) + this.offset
      this.cubes[cubeIndex].mesh.position.z =
        (i % 3) * (this.cubeDim + this.cubeSpacing) + this.offset
    })
  }

  /**
   * Sets the color of a single cubie on a given face
   * @param {Object} cube
   * @param {String} face
   */
  setFaceColor(cube, face) {
    let index
    let color
    switch (face) {
      case 'right':
        index = this.rightFaceIndex
        color = new THREE.Color('red').convertSRGBToLinear()
        break
      case 'left':
        index = this.rightFaceIndex + this.deltaIndex
        color = new THREE.Color('orange').convertSRGBToLinear()
        break
      case 'top':
        index = this.rightFaceIndex + this.deltaIndex * 2
        color = new THREE.Color('yellow').convertSRGBToLinear()
        break
      case 'bottom':
        index = this.rightFaceIndex + this.deltaIndex * 3
        color = new THREE.Color('white').convertSRGBToLinear()
        break
      case 'front':
        index = this.rightFaceIndex + this.deltaIndex * 4
        color = new THREE.Color('blue').convertSRGBToLinear()
        break
      case 'back':
        index = this.rightFaceIndex + this.deltaIndex * 5
        color = new THREE.Color('#008000')
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

  /**
   * Sets the colors of a vertex in a color attribute array
   * @param {Float32Array} colorsArray
   * @param {Number} index
   * @param {THREE.Color} color
   */
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

  /**
   * rotates a given face of the cube
   * @param {String} face
   * @param {Boolean} positiveRotation
   *
   */
  rotateFace(face, positiveRotation) {
    if (this.isRotating) return
    this.isRotating = true

    this.currentRotationFace = face
    this.rotatingCubes = this.getFaceCubes(face)
    this.currentDestQuaternions = []
    this.currentRotationTime = 0
    this.currentPositiveRotation = positiveRotation
    this.currentRotationAxis = this.getRotationAxis(face, positiveRotation)

    this.setStartingPositions()

    // this.setPositionForRotation(face, positiveRotation)
    // this.setRotatedCubesPosition()

    for (const cubeIndex of this.rotatingCubes) {
      const cube = this.cubes[this.cubeOrder[cubeIndex]]

      this.setCubieRotation(cube)
    }
  }

  /**
   * rotates a single cubie around a given axis
   * @param {Object} cube
   * @param {THREE.Vector3} axis
   */
  setCubieRotation(cube) {
    const angle = Math.PI / 2
    const rotationQuaternion = new THREE.Quaternion().setFromAxisAngle(
      this.currentRotationAxis,
      angle
    )
    const oldQuaternion = cube.mesh.quaternion
    const newQuaternion = rotationQuaternion.multiply(oldQuaternion)
    this.currentDestQuaternions.push(newQuaternion)
  }

  /**
   * progresses the rotation of the cubies
   */
  rotationStep() {
    if (
      this.cubes[this.cubeOrder[this.rotatingCubes[0]]].mesh.quaternion.angleTo(
        this.currentDestQuaternions[0]
      ) !== 0
    ) {
      const angle = ((Math.PI / 2) * this.time.delta) / this.rotationDuration
      this.rotatingCubes.forEach((cubeIndex, i) => {
        this.cubes[this.cubeOrder[cubeIndex]].mesh.quaternion.rotateTowards(
          this.currentDestQuaternions[i],
          angle
        )
      })
    } else {
      // console.log(
      //   this.cubes[
      //     this.cubeOrder[this.rotatingCubes[0]]
      //   ].mesh.quaternion.angleTo(this.currentDestQuaternions[0])
      // )
      this.isRotating = false
    }
  }

  /**
   * sets the position of the cubes in cubeOrder when rotated
   * @param {String} face
   * @param {Boolean} positiveRotation
   */
  setPositionForRotation(face, positiveRotation) {
    const cubeIndices = this.getFaceCubes(face)
    const rotatedIndices = [
      this.cubeOrder[cubeIndices[6]],
      this.cubeOrder[cubeIndices[3]],
      this.cubeOrder[cubeIndices[0]],
      this.cubeOrder[cubeIndices[7]],
      this.cubeOrder[cubeIndices[4]],
      this.cubeOrder[cubeIndices[1]],
      this.cubeOrder[cubeIndices[8]],
      this.cubeOrder[cubeIndices[5]],
      this.cubeOrder[cubeIndices[2]],
    ]
    if (face === 'back' || face === 'bottom' || face === 'right') {
      rotatedIndices.reverse()
    }
    if (!positiveRotation) rotatedIndices.reverse()

    cubeIndices.forEach(
      (value, i) => (this.cubeOrder[value] = rotatedIndices[i])
    )
  }

  setRotatedCubesPosition() {
    for (const i of this.rotatingCubes) {
      const cubeIndex = this.cubeOrder[i]
      this.cubes[cubeIndex].mesh.position.x =
        Math.floor((i % 9) / 3) * (this.cubeDim + this.cubeSpacing) +
        this.offset
      this.cubes[cubeIndex].mesh.position.y =
        Math.floor(i / 9) * (this.cubeDim + this.cubeSpacing) + this.offset
      this.cubes[cubeIndex].mesh.position.z =
        (i % 3) * (this.cubeDim + this.cubeSpacing) + this.offset
    }
  }

  positionStep() {
    this.currentRotationAngle =
      (Math.min(this.currentRotationTime / this.rotationDuration, 1) *
        Math.PI) /
      2
    // this.currentRotationAngle *= this.currentPositiveRotation ? -1 : 1

    this.rotatingCubes.forEach((cubeIndex, i) => {
      console.log(this.currentRotationAxis)
      const startPosition = this.currentStartingPositions[i]
      let newPosition
      if (this.currentRotationAxis.x === 1) {
        newPosition = new THREE.Vector3(
          startPosition.x,
          startPosition.y * Math.cos(this.currentRotationAngle) -
            startPosition.z * Math.sin(this.currentRotationAngle),
          startPosition.y * Math.sin(this.currentRotationAngle) +
            startPosition.z * Math.cos(this.currentRotationAngle)
        )
      } else if (this.currentRotationAxis.x === -1) {
        newPosition = new THREE.Vector3(
          startPosition.x,
          startPosition.y * Math.cos(-this.currentRotationAngle) -
            startPosition.z * Math.sin(-this.currentRotationAngle),
          startPosition.y * Math.sin(-this.currentRotationAngle) +
            startPosition.z * Math.cos(-this.currentRotationAngle)
        )
      } else if (this.currentRotationAxis.y === 1) {
        newPosition = new THREE.Vector3(
          startPosition.x * Math.cos(-this.currentRotationAngle) -
            startPosition.z * Math.sin(-this.currentRotationAngle),
          startPosition.y,
          startPosition.x * Math.sin(-this.currentRotationAngle) +
            startPosition.z * Math.cos(-this.currentRotationAngle)
        )
      } else if (this.currentRotationAxis.y === -1) {
        newPosition = new THREE.Vector3(
          startPosition.x * Math.cos(this.currentRotationAngle) -
            startPosition.z * Math.sin(this.currentRotationAngle),
          startPosition.y,
          startPosition.x * Math.sin(this.currentRotationAngle) +
            startPosition.z * Math.cos(this.currentRotationAngle)
        )
      } else if (this.currentRotationAxis.z === 1) {
        newPosition = new THREE.Vector3(
          startPosition.x * Math.cos(this.currentRotationAngle) -
            startPosition.y * Math.sin(this.currentRotationAngle),
          startPosition.x * Math.sin(this.currentRotationAngle) +
            startPosition.y * Math.cos(this.currentRotationAngle),
          startPosition.z
        )
      } else if (this.currentRotationAxis.z === -1) {
        newPosition = new THREE.Vector3(
          startPosition.x * Math.cos(-this.currentRotationAngle) -
            startPosition.y * Math.sin(-this.currentRotationAngle),
          startPosition.x * Math.sin(-this.currentRotationAngle) +
            startPosition.y * Math.cos(-this.currentRotationAngle),
          startPosition.z
        )
      }

      const cubeMesh = this.cubes[this.cubeOrder[cubeIndex]].mesh
      cubeMesh.position.set(newPosition.x, newPosition.y, newPosition.z)
    })

    this.currentRotationAxis
    this.currentPositiveRotation
  }

  setStartingPositions() {
    this.currentStartingPositions = []
    for (const cubeIndex of this.rotatingCubes) {
      const cube = this.cubes[this.cubeOrder[cubeIndex]]
      this.currentStartingPositions.push(cube.mesh.position.clone())
    }
    console.log(this.currentStartingPositions)
  }

  /**
   *
   * @param {String} face
   * @param {Boolean} positiveRotation
   * @returns {THREE.Vector3} the axis of rotation
   */
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

  /**
   *
   * @param {String} face
   * @returns {Number[]} the indices pointing to the position of the cubies in this.cubeOrder, belonging to the given face
   *
   */
  getFaceCubes(face) {
    // return all cubes that belong to the face
    const cubeIndices = []
    this.cubeOrder.forEach((value, i) => {
      if (this.cubeIsAtPosition(face, i)) {
        cubeIndices.push(i)
      }
    })

    return cubeIndices
  }

  /**
   *
   * @param {String} position
   * @param {Boolean} i
   * @returns {Boolean} whether a cube is on a given face
   */
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

/**
 * TODO:
 * Nach Rotationsanimation Rotation festlegen, um Rundungsfehler zu vermeiden
 *
 */
