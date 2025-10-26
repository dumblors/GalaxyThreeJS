import * as THREE from 'three'

export class InteractionManager {
    constructor(camera, scene, uiManager) {
        this.camera = camera
        this.scene = scene
        this.uiManager = uiManager
        this.raycaster = new THREE.Raycaster()
        this.mouse = new THREE.Vector2()

        this.setupEventListeners()
    }

    setupEventListeners() {
        const canvas = document.getElementById('canvas')

        canvas.addEventListener('click', (event) => this.onClick(event))
        canvas.addEventListener('mousemove', (event) => this.onMouseMove(event))
    }

    onClick(event) {
        this.updateMousePosition(event)

        this.raycaster.setFromCamera(this.mouse, this.camera)

        const intersects = this.raycaster.intersectObjects(this.scene.children, true)

        for (let intersect of intersects) {
            const object = intersect.object

            if (object.userData && object.userData.isCustomStar) {
                this.uiManager.showStarDetails(object.userData.starData)
                break
            }
        }
    }

    onMouseMove(event) {
        this.updateMousePosition(event)

        this.raycaster.setFromCamera(this.mouse, this.camera)

        const intersects = this.raycaster.intersectObjects(this.scene.children, true)

        let foundCustomStar = false
        for (let intersect of intersects) {
            const object = intersect.object

            if (object.userData && object.userData.isCustomStar) {
                document.getElementById('canvas').style.cursor = 'pointer'
                foundCustomStar = true
                break
            }
        }

        if (!foundCustomStar) {
            document.getElementById('canvas').style.cursor = 'default'
        }
    }

    updateMousePosition(event) {
        const canvas = document.getElementById('canvas')
        const rect = canvas.getBoundingClientRect()

        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    }
}
