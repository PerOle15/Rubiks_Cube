import * as THREE from 'three'
import EventEmitter from './EventEmitter'
import Experience from '../Experience'
let instance = null

export default class Raycaster extends EventEmitter {
  constructor() {
    // Singleton
    if (instance !== null) {
      return instance
    }
    super()
    instance = this

    this.experience = new Experience()
    this.experience.raycaster = this
    this.scene = this.experience.scene
    this.sizes = this.experience.sizes
    this.camera = this.experience.camera.instance

    this.mouse = new THREE.Vector2(0, 0)
    this.raycaster = new THREE.Raycaster()
    this.raycaster.setFromCamera(this.mouse, this.camera)
    this.raycaster.far = 30

    // this.boundingCubes = this.experience.world.cube.boundingCubes

    // this.setup()
  }

  setup() {
    window.addEventListener('mousedown', (e) => {
      this.updateMousePosition(e)
      this.raycaster.setFromCamera(this.mouse, this.camera)
      const intersects = this.raycaster.intersectObjects(this.boundingCubes)
      if (intersects.length > 0) {
        this.intersect = intersects[0]
        this.trigger('cubeClicked')
      }
    })

    window.addEventListener('touchstart', (e) => {
      // console.log(e.targetTouches[0].clientX, e.targetTouches[0].clientY)
    })
  }

  updateMousePosition(event) {
    const { clientX, clientY } = event
    const { width, height } = this.sizes
    this.mouse.x = (clientX / width) * 2 - 1
    this.mouse.y = -(clientY / height) * 2 + 1
  }
}
