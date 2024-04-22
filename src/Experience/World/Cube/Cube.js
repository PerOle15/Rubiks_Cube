import * as THREE from 'three'
import Experience from '../../Experience'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import EventEmitter from '../../Utils/EventEmitter'
import Raycaster from '../../Utils/RayCaster.js'

export default class Cube extends EventEmitter {
  constructor() {
    super()
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.time = this.experience.time
    this

    // Debug
    this.debug = this.experience.debug
    if (this.debug.active) {
      this.debugFolder = this.debug.gui.addFolder('Cube')
      this.debugFolder.close()
    }

    this.setup()
    this.raycaster = new Raycaster()
    this.raycaster.boundingCubes = this.boundingCubes
    this.raycaster.setup()
    this.raycaster.on('cubeClicked', () => {
      this.cubeClicked()
    })

    // setTimeout(() => {
    //   this.shuffle(30)
    // }, 1500)
  }

  setup() {
    this.setConstants()

    this.cubes = []
    // Indices of all cubes in the order they are positioned
    this.cubeOrder = []

    this.boundingCubes = []

    this.setGeometry()
    this.setMaterial()
    this.setMeshes()

    this.isRotating = false
    // rotation duration in ms
    this.rotationDuration = 200

    this.on('finishedRotation', () => {
      this.finishedRotation()
    })
    this.on('finishedShuffleMove', () => {
      this.shuffleMove()
    })
    this.on('finishedShuffling', () => {
      this.finishedShuffling()
    })
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
        this.trigger('finishedRotation')
        if (this.isShuffling) this.trigger('finishedShuffleMove')
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
    this.isShuffling = false
    this.finishedShuffleMove = false
    this.allMoves = [
      'bottom',
      'top',
      'back',
      'front',
      'left',
      'right',
      'horizontal',
      'vertical',
      'parallel',
    ]
    this.shuffleMoves = []
  }

  shuffle(n) {
    if (this.isShuffling) return
    this.isShuffling = true

    for (let i = 0; i < n; i++) {
      // Change this.faceNamesArray to this.allMoves for also involving center faces
      let index = Math.floor(Math.random() * this.faceNamesArray.length)
      let positiveRotation = Math.random() >= 0.5

      // Prevent a move that inverts the previous move
      if (
        i > 0 &&
        this.faceNamesArray[index] === this.shuffleMoves[i - 1].face &&
        positiveRotation !== this.shuffleMoves[i - 1].positiveRotation
      ) {
        positiveRotation = !positiveRotation
      }

      const move = { face: this.faceNamesArray[index], positiveRotation }
      this.shuffleMoves.push(move)
    }

    this.shuffleMove()
  }

  shuffleMove() {
    if (this.shuffleMoves.length > 0) {
      const move = this.shuffleMoves.shift()
      this.rotateFace(move.face, move.positiveRotation)
    } else {
      this.isShuffling = false
      this.trigger('finishedShuffling')
    }
  }

  // TODO
  // Resetting the orientation after shuffling the cube
  resetOrientation() {}

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

    const boundingGeometry = new THREE.BoxGeometry(
      this.cubeDim + this.cubeSpacing,
      this.cubeDim + this.cubeSpacing,
      this.cubeDim + this.cubeSpacing
    )
    const boundingMaterial = new THREE.MeshBasicMaterial({
      visible: false,
    })

    const positionAttribute = this.cubes[0].geometry.getAttribute('position')

    for (let i = 0; i < 27; i++) {
      this.cubeOrder[i] = i

      const mesh = new THREE.Mesh(this.cubes[i].geometry, this.material)
      mesh.castShadow = true
      mesh.receiveShadow = true

      this.cubes[i].mesh = mesh
      this.cubes[i].material = this.material
      this.cubeGroup.add(mesh)

      const boundingMesh = new THREE.Mesh(boundingGeometry, boundingMaterial)
      this.boundingCubes.push(boundingMesh)
      this.cubeGroup.add(boundingMesh)

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
    // Position bounding boxes
    this.setBoundingCubesPosition()

    // // Get bounding Coordinates for group
    // const groupBox = new THREE.Box3().setFromObject(this.cubeGroup)
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

  setBoundingCubesPosition() {
    this.boundingCubes.forEach((cube, i) => {
      cube.position.x =
        Math.floor((i % 9) / 3) * (this.cubeDim + this.cubeSpacing) +
        this.offset
      cube.position.y =
        Math.floor(i / 9) * (this.cubeDim + this.cubeSpacing) + this.offset
      cube.position.z =
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
    if (
      face === 'back' ||
      face === 'bottom' ||
      face === 'right' ||
      face === 'vertical'
    ) {
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
      const startPosition = this.currentStartingPositions[i]
      let newPosition
      if (this.currentRotationAxis.x !== 0) {
        const angle = this.currentRotationAxis.x * this.currentRotationAngle
        newPosition = new THREE.Vector3(
          startPosition.x,
          startPosition.y * Math.cos(angle) - startPosition.z * Math.sin(angle),
          startPosition.y * Math.sin(angle) + startPosition.z * Math.cos(angle)
        )
      } else if (this.currentRotationAxis.y !== 0) {
        const angle = -this.currentRotationAxis.y * this.currentRotationAngle
        newPosition = new THREE.Vector3(
          startPosition.x * Math.cos(angle) - startPosition.z * Math.sin(angle),
          startPosition.y,
          startPosition.x * Math.sin(angle) + startPosition.z * Math.cos(angle)
        )
      } else if (this.currentRotationAxis.z !== 0) {
        const angle = this.currentRotationAxis.z * this.currentRotationAngle
        newPosition = new THREE.Vector3(
          startPosition.x * Math.cos(angle) - startPosition.y * Math.sin(angle),
          startPosition.x * Math.sin(angle) + startPosition.y * Math.cos(angle),
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
      case 'horizontal':
        axis = new THREE.Vector3(0, 1, 0)
        break
      case 'vertical':
        axis = new THREE.Vector3(1, 0, 0)
        break
      case 'parallel':
        axis = new THREE.Vector3(0, 0, 1)
        break

      default:
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
      case 'horizontal':
        isAtPosition = Math.floor(i / 9) === 1
        break
      case 'vertical':
        isAtPosition = Math.floor((i % 9) / 3) === 1
        break
      case 'parallel':
        isAtPosition = i % 3 === 1
        break

      default:
        break
    }

    return isAtPosition
  }

  // Events
  finishedRotation() {
    this.setPositionForRotation(
      this.currentRotationFace,
      this.currentPositiveRotation
    )
    this.setRotatedCubesPosition()
    this.isRotating = false
  }

  finishedShuffling() {}

  cubeClicked() {
    const uuid = this.raycaster.intersect.object.uuid
    const normal = this.raycaster.intersect.normal

    let cubeOrderIndex
    for (let i = 0; i < this.cubeOrder.length; i++) {
      if (this.boundingCubes[i].uuid === uuid) {
        cubeOrderIndex = i
        break
      }
    }

    this.possibleDraggedFaces = this.getPossibleFaces(normal, cubeOrderIndex)
    console.log(this.possibleDraggedFaces)
  }

  getPossibleFaces(normal, i) {
    let possibleFaces = []
    let normalFace
    if (normal.x === 1) {
      normalFace = 'right'
    }
    if (normal.x === -1) {
      normalFace = 'left'
    }
    if (normal.y === 1) {
      normalFace = 'top'
    }
    if (normal.y === -1) {
      normalFace = 'bottom'
    }
    if (normal.z === 1) {
      normalFace = 'front'
    }
    if (normal.z === -1) {
      normalFace = 'back'
    }

    for (const face of this.allMoves) {
      if (face !== normalFace && this.cubeIsOnFace(face, i)) {
        possibleFaces.push(face)
      }
    }

    return possibleFaces
  }

  cubeIsOnFace(face, i) {
    switch (face) {
      case 'bottom':
        return i < 9
      case 'top':
        return i > 17
      case 'back':
        return i % 3 === 0
      case 'front':
        return i % 3 === 2
      case 'left':
        return i % 9 < 3
      case 'right':
        return i % 9 > 5
      case 'horizontal':
        return Math.floor(i / 9) === 1
      case 'vertical':
        return Math.floor((i % 9) / 3) === 1
      case 'parallel':
        return i % 3 === 1

      default:
        break
    }
  }

  cubeReleased() {}
}

/**
 * TODO:
 * Nach Rotationsanimation Rotation festlegen, um Rundungsfehler zu vermeiden
 *
 */
