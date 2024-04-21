import * as THREE from 'three'
import Experience from '../Experience'
import Environment from './Environment'
import Cube from './Cube/Cube.js'
import SunLight from './SunLight.js'
import AmbientLight from './AmbientLight.js'

export default class World {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources

    this.axesHelper = new THREE.AxesHelper()
    this.scene.add(this.axesHelper)

    this.sunLight = new SunLight()
    this.ambientLight = new AmbientLight()

    this.cube = new Cube()

    this.scene.background = new THREE.Color(0xdbb49a)

    this.resources.on('ready', () => {
      // Setup
      this.environment = new Environment()
    })
  }

  update() {}
}
