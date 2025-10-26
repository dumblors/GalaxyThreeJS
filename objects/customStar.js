import * as THREE from 'three'
import { Star } from './star.js'

export class CustomStar extends Star {
    constructor(position, userData) {
        super(position)
        this.userData = userData
        this.isCustom = true
        this.isBlinking = false
        this.blinkStartTime = null
    }

    toThreeObject(scene) {
        super.toThreeObject(scene)

        if (this.obj && this.userData) {
            this.obj.userData = {
                isCustomStar: true,
                starId: this.userData.id,
                starData: this.userData
            }
        }
    }

    startBlinking() {
        this.isBlinking = true
        this.blinkStartTime = Date.now()
    }

    updateBlinking() {
        if (!this.isBlinking || !this.obj) return

        const elapsed = (Date.now() - this.blinkStartTime) / 1000

        if (elapsed > 5) {
            this.isBlinking = false
            this.obj.material.opacity = 1
            return
        }

        const frequency = 4
        const opacity = 0.3 + 0.7 * Math.abs(Math.sin(elapsed * frequency * Math.PI))
        this.obj.material.opacity = opacity
        this.obj.material.transparent = true
    }

    update(camera) {
        this.updateScale(camera)
        if (this.isBlinking) {
            this.updateBlinking()
        }
    }
}
