import * as THREE from 'three'
import { Star } from './star.js';
import { CustomStar } from './customStar.js';
import { ARMS, ARM_X_DIST, ARM_X_MEAN, ARM_Y_DIST, ARM_Y_MEAN, CORE_X_DIST, CORE_Y_DIST, GALAXY_THICKNESS, HAZE_RATIO, NUM_STARS, OUTER_CORE_X_DIST, OUTER_CORE_Y_DIST } from '../config/galaxyConfig.js';
import { gaussianRandom, spiral } from '../utils.js';
import { Haze } from './haze.js';
import { getCustomStars } from '../supabaseClient.js';


export class Galaxy {

    constructor(scene) {

        this.scene = scene

        this.stars = []
        this.haze = []
        this.customStars = []
        this.customStarsById = new Map()

        this.loadCustomStars()
    }

    async loadCustomStars() {
        const { data, error } = await getCustomStars()
        if (error) {
            console.error('Error loading custom stars:', error)
            return
        }

        if (data && data.length > 0) {
            const numBackgroundStars = Math.max(1000, data.length * 100)

            this.stars = this.generateObject(numBackgroundStars, (pos) => new Star(pos))
            this.haze = this.generateObject(numBackgroundStars * HAZE_RATIO, (pos) => new Haze(pos))

            this.stars.forEach((star) => star.toThreeObject(this.scene))
            this.haze.forEach((haze) => haze.toThreeObject(this.scene))

            data.forEach(starData => {
                this.addCustomStarFromData(starData)
            })
        } else {
            const defaultStars = 10000
            this.stars = this.generateObject(defaultStars, (pos) => new Star(pos))
            this.haze = this.generateObject(defaultStars * HAZE_RATIO, (pos) => new Haze(pos))

            this.stars.forEach((star) => star.toThreeObject(this.scene))
            this.haze.forEach((haze) => haze.toThreeObject(this.scene))
        }
    }

    addCustomStarFromData(starData) {
        const position = new THREE.Vector3(
            starData.position_x,
            starData.position_y,
            starData.position_z
        )

        const customStar = new CustomStar(position, starData)
        customStar.toThreeObject(this.scene)
        this.customStars.push(customStar)
        this.customStarsById.set(starData.id, customStar)
    }

    async addCustomStar(starData) {
        this.addCustomStarFromData(starData)
    }

    animateNewStar(starId) {
        const star = this.customStarsById.get(starId)
        if (star) {
            star.startGlowing()
        }
    }

    updateScale(camera) {
        this.stars.forEach((star) => {
            star.updateScale(camera)
        })

        this.customStars.forEach((star) => {
            star.update(camera)
        })

        this.haze.forEach((haze) => {
            haze.updateScale(camera)
        })
    }

    generateRandomPosition() {
        const rand = Math.random()

        if (rand < 0.25) {
            return new THREE.Vector3(
                gaussianRandom(0, CORE_X_DIST),
                gaussianRandom(0, CORE_Y_DIST),
                gaussianRandom(0, GALAXY_THICKNESS)
            )
        } else if (rand < 0.5) {
            return new THREE.Vector3(
                gaussianRandom(0, OUTER_CORE_X_DIST),
                gaussianRandom(0, OUTER_CORE_Y_DIST),
                gaussianRandom(0, GALAXY_THICKNESS)
            )
        } else {
            const armIndex = Math.floor(Math.random() * ARMS)
            return spiral(
                gaussianRandom(ARM_X_MEAN, ARM_X_DIST),
                gaussianRandom(ARM_Y_MEAN, ARM_Y_DIST),
                gaussianRandom(0, GALAXY_THICKNESS),
                armIndex * 2 * Math.PI / ARMS
            )
        }
    }

    generateObject(numStars, generator) {
        let objects = []

        for ( let i = 0; i < numStars / 4; i++){
            let pos = new THREE.Vector3(gaussianRandom(0, CORE_X_DIST), gaussianRandom(0, CORE_Y_DIST), gaussianRandom(0, GALAXY_THICKNESS))
            let obj = generator(pos)
            objects.push(obj)
        }

        for ( let i = 0; i < numStars / 4; i++){
            let pos = new THREE.Vector3(gaussianRandom(0, OUTER_CORE_X_DIST), gaussianRandom(0, OUTER_CORE_Y_DIST), gaussianRandom(0, GALAXY_THICKNESS))
            let obj = generator(pos)
            objects.push(obj)
        }

        for (let j = 0; j < ARMS; j++) {
            for ( let i = 0; i < numStars / 4; i++){
                let pos = spiral(gaussianRandom(ARM_X_MEAN, ARM_X_DIST), gaussianRandom(ARM_Y_MEAN, ARM_Y_DIST), gaussianRandom(0, GALAXY_THICKNESS), j * 2 * Math.PI / ARMS)
                let obj = generator(pos)
                objects.push(obj)
            }
        }

        return objects
    }

    navigateToStar(starId, camera, orbit) {
        const star = this.customStarsById.get(starId)
        if (!star || !star.obj) return

        const targetPosition = star.obj.position.clone()
        const distance = 15

        const direction = new THREE.Vector3()
        direction.subVectors(camera.position, targetPosition).normalize()

        const newCameraPosition = targetPosition.clone().add(direction.multiplyScalar(distance))

        this.animateCameraTo(camera, orbit, newCameraPosition, targetPosition)

        star.startGlowing()
    }

    animateCameraTo(camera, orbit, targetPosition, lookAtPosition) {
        const startPosition = camera.position.clone()
        const startTarget = orbit.target.clone()
        const duration = 2000
        const startTime = Date.now()

        const animate = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)

            const eased = this.easeInOutCubic(progress)

            camera.position.lerpVectors(startPosition, targetPosition, eased)
            orbit.target.lerpVectors(startTarget, lookAtPosition, eased)
            orbit.update()

            if (progress < 1) {
                requestAnimationFrame(animate)
            }
        }

        animate()
    }

    easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2
    }
}