import * as THREE from 'three'
import { Star } from './star.js'

export class CustomStar extends Star {
    constructor(position, userData) {
        super(position)
        this.userData = userData
        this.isCustom = true
        this.isGlowing = false
        this.glowStartTime = null
        this.originalColor = null
        this.targetBrightness = 3.0
        this.normalBrightness = 1.0
    }

    toThreeObject(scene) {
        super.toThreeObject(scene)

        if (this.obj && this.userData) {
            this.obj.userData = {
                isCustomStar: true,
                starId: this.userData.id,
                starData: this.userData,
                userId: this.userData.user_id
            }

            if (this.obj.material && this.obj.material.color) {
                this.originalColor = this.obj.material.color.clone()
            }
        }
    }

    startGlowing() {
        this.isGlowing = true
        this.glowStartTime = Date.now()
    }

    stopGlowing() {
        this.isGlowing = false
        if (this.obj && this.obj.material && this.originalColor) {
            this.obj.material.color.copy(this.originalColor)
            this.obj.material.emissive.setScalar(0)
        }
    }

    updateGlowing() {
        if (!this.isGlowing || !this.obj || !this.obj.material) return

        const elapsed = (Date.now() - this.glowStartTime) / 1000
        const duration = 3.0

        if (elapsed > duration) {
            this.stopGlowing()
            return
        }

        const progress = elapsed / duration
        let brightness

        if (progress < 0.5) {
            brightness = this.normalBrightness + (this.targetBrightness - this.normalBrightness) * (progress * 2)
        } else {
            brightness = this.targetBrightness - (this.targetBrightness - this.normalBrightness) * ((progress - 0.5) * 2)
        }

        if (this.originalColor) {
            const glowColor = this.originalColor.clone().multiplyScalar(brightness)
            this.obj.material.color.copy(glowColor)
            this.obj.material.emissive.copy(this.originalColor).multiplyScalar(brightness * 0.5)
        }
    }

    update(camera) {
        this.updateScale(camera)
        if (this.isGlowing) {
            this.updateGlowing()
        }
    }
}
