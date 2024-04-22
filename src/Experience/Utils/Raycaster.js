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
    this.camera = this.experience.camera

    this.mouse = new THREE.Vector2(0, 0)
    this.mousePixels = new THREE.Vector2(0, 0)
    this.startMousePosition = this.mouse.clone()
    this.startMousePositionPixels = this.mousePixels.clone()
    this.raycaster = new THREE.Raycaster()
    this.raycaster.setFromCamera(this.mouse, this.camera.instance)
    this.raycaster.far = 30

    this.dragging = false
    this.dragRotated = false
  }

  setup() {
    window.addEventListener('mousedown', (e) => {
      this.dragStart(e, 'click')
    })

    window.addEventListener('mousemove', (e) => {
      this.dragMove(e, 'click')
    })

    window.addEventListener('mouseup', (e) => {
      this.dragEnd()
    })

    window.addEventListener('touchstart', (e) => {
      this.dragStart(e, 'touch')
    })

    window.addEventListener('touchmove', (e) => {
      this.dragMove(e, 'touch')
    })

    window.addEventListener('touchend', (e) => {
      this.dragEnd()
    })
  }

  dragStart(e, type) {
    this.dragRotated = false
    this.updateMousePosition(e, type)
    this.startMousePosition = this.mouse.clone()
    this.startMousePositionPixels = this.mousePixels.clone()
    this.raycaster.setFromCamera(this.mouse, this.camera.instance)
    const intersects = this.raycaster.intersectObjects(this.boundingCubes)
    if (intersects.length > 0) {
      this.camera.controls.enabled = false
      this.dragging = true

      this.intersect = intersects[0]
      this.trigger('cubeClicked')
    }
  }

  dragMove(e, type) {
    if (this.dragging && !this.dragRotated) {
      this.updateMousePosition(e, type)
      const distance = this.startMousePositionPixels.distanceTo(
        this.mousePixels
      )
      if (distance >= 30) {
        this.trigger('dragged')
        this.dragRotated = true
      }
    }
  }

  dragEnd() {
    if (this.dragging) {
      this.camera.controls.enabled = true
      this.dragging = false
    }
  }

  updateMousePosition(e, type) {
    let clientX
    let clientY
    if (type == 'click') {
      clientX = e.clientX
      clientY = e.clientY
    } else if (type == 'touch') {
      clientX = e.targetTouches[0].clientX
      clientY = e.targetTouches[0].clientY
    }
    this.mousePixels.x = clientX
    this.mousePixels.y = clientY
    const { width, height } = this.sizes
    this.mouse.x = (clientX / width) * 2 - 1
    this.mouse.y = -(clientY / height) * 2 + 1
  }
}
