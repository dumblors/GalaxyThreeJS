import { authManager } from './auth.js'
import { uploadStarPhoto, createCustomStar, getUserStars } from './supabaseClient.js'
import { starTypes } from './config/starDistributions.js'

export class UIManager {
    constructor(galaxy, camera, orbit) {
        this.galaxy = galaxy
        this.camera = camera
        this.orbit = orbit
        this.currentUser = null

        this.createUI()
        this.setupAuthListener()
    }

    createUI() {
        const uiContainer = document.createElement('div')
        uiContainer.id = 'ui-container'
        document.body.appendChild(uiContainer)

        this.createAuthButton()
        this.createCreateStarButton()
        this.createMyStarsButton()
        this.createAuthModal()
        this.createStarFormModal()
        this.createStarDetailsModal()
        this.createMyStarsModal()
    }

    setupAuthListener() {
        authManager.onAuthChange((user) => {
            this.currentUser = user
            this.updateUIForAuthState()
        })
    }

    updateUIForAuthState() {
        const authBtn = document.getElementById('auth-btn')
        const createStarBtn = document.getElementById('create-star-btn')
        const myStarsBtn = document.getElementById('my-stars-btn')

        if (this.currentUser) {
            authBtn.textContent = 'Sair'
            authBtn.onclick = () => this.handleLogout()
            createStarBtn.style.display = 'block'
            myStarsBtn.style.display = 'block'
            this.updateStarCount()
        } else {
            authBtn.textContent = 'Entrar'
            authBtn.onclick = () => this.showAuthModal('login')
            createStarBtn.style.display = 'none'
            myStarsBtn.style.display = 'none'
        }
    }

    async updateStarCount() {
        if (!this.currentUser) return

        const { data } = await getUserStars(this.currentUser.id)
        const count = data?.length || 0
        const createBtn = document.getElementById('create-star-btn')
        createBtn.textContent = `Criar Estrela (${count}/5)`
        createBtn.disabled = count >= 5
    }

    createAuthButton() {
        const btn = document.createElement('button')
        btn.id = 'auth-btn'
        btn.className = 'ui-btn'
        btn.textContent = 'Entrar'
        btn.onclick = () => this.showAuthModal('login')
        document.getElementById('ui-container').appendChild(btn)
    }

    createCreateStarButton() {
        const btn = document.createElement('button')
        btn.id = 'create-star-btn'
        btn.className = 'ui-btn'
        btn.textContent = 'Criar Estrela (0/5)'
        btn.style.display = 'none'
        btn.onclick = () => this.showStarFormModal()
        document.getElementById('ui-container').appendChild(btn)
    }

    createMyStarsButton() {
        const btn = document.createElement('button')
        btn.id = 'my-stars-btn'
        btn.className = 'ui-btn'
        btn.textContent = 'Minhas Estrelas'
        btn.style.display = 'none'
        btn.onclick = () => this.showMyStarsModal()
        document.getElementById('ui-container').appendChild(btn)
    }

    createAuthModal() {
        const modal = document.createElement('div')
        modal.id = 'auth-modal'
        modal.className = 'modal'
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="document.getElementById('auth-modal').style.display='none'">&times;</span>
                <h2 id="auth-title">Login</h2>
                <form id="auth-form">
                    <input type="email" id="auth-email" placeholder="Email" required>
                    <input type="password" id="auth-password" placeholder="Senha" required>
                    <div id="auth-error" class="error-message"></div>
                    <button type="submit" class="submit-btn">Entrar</button>
                    <p class="switch-mode">
                        <span id="auth-switch-text">Não tem conta?</span>
                        <a href="#" id="auth-switch-link">Registrar</a>
                    </p>
                </form>
            </div>
        `
        document.body.appendChild(modal)

        const form = document.getElementById('auth-form')
        form.onsubmit = (e) => this.handleAuthSubmit(e)

        const switchLink = document.getElementById('auth-switch-link')
        switchLink.onclick = (e) => {
            e.preventDefault()
            const currentMode = form.dataset.mode || 'login'
            this.showAuthModal(currentMode === 'login' ? 'register' : 'login')
        }
    }

    showAuthModal(mode = 'login') {
        const modal = document.getElementById('auth-modal')
        const title = document.getElementById('auth-title')
        const form = document.getElementById('auth-form')
        const submitBtn = form.querySelector('.submit-btn')
        const switchText = document.getElementById('auth-switch-text')
        const switchLink = document.getElementById('auth-switch-link')
        const errorDiv = document.getElementById('auth-error')

        form.dataset.mode = mode
        errorDiv.textContent = ''

        if (mode === 'login') {
            title.textContent = 'Login'
            submitBtn.textContent = 'Entrar'
            switchText.textContent = 'Não tem conta?'
            switchLink.textContent = 'Registrar'
        } else {
            title.textContent = 'Registrar'
            submitBtn.textContent = 'Criar Conta'
            switchText.textContent = 'Já tem conta?'
            switchLink.textContent = 'Entrar'
        }

        modal.style.display = 'flex'
    }

    async handleAuthSubmit(e) {
        e.preventDefault()
        const form = e.target
        const mode = form.dataset.mode
        const email = document.getElementById('auth-email').value
        const password = document.getElementById('auth-password').value
        const errorDiv = document.getElementById('auth-error')
        const submitBtn = form.querySelector('.submit-btn')

        submitBtn.disabled = true
        submitBtn.textContent = 'Aguarde...'
        errorDiv.textContent = ''

        try {
            if (mode === 'login') {
                await authManager.login(email, password)
            } else {
                await authManager.register(email, password)
            }
            document.getElementById('auth-modal').style.display = 'none'
            form.reset()
        } catch (error) {
            errorDiv.textContent = error.message
        } finally {
            submitBtn.disabled = false
            submitBtn.textContent = mode === 'login' ? 'Entrar' : 'Criar Conta'
        }
    }

    async handleLogout() {
        try {
            await authManager.logout()
        } catch (error) {
            console.error('Logout error:', error)
        }
    }

    createStarFormModal() {
        const modal = document.createElement('div')
        modal.id = 'star-form-modal'
        modal.className = 'modal'
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="document.getElementById('star-form-modal').style.display='none'">&times;</span>
                <h2>Criar Sua Estrela</h2>
                <form id="star-form">
                    <input type="text" id="star-name" placeholder="Nome" required>
                    <input type="text" id="star-surname" placeholder="Sobrenome" required>
                    <textarea id="star-message" placeholder="Mensagem (compartilhe algo especial)" required></textarea>
                    <div class="file-input-wrapper">
                        <label for="star-photo" class="file-label">
                            <span id="file-label-text">Escolher Foto</span>
                        </label>
                        <input type="file" id="star-photo" accept="image/*">
                    </div>
                    <div id="photo-preview"></div>
                    <div id="star-form-error" class="error-message"></div>
                    <button type="submit" class="submit-btn">Criar Estrela</button>
                </form>
            </div>
        `
        document.body.appendChild(modal)

        const photoInput = document.getElementById('star-photo')
        photoInput.onchange = (e) => this.handlePhotoPreview(e)

        const form = document.getElementById('star-form')
        form.onsubmit = (e) => this.handleStarFormSubmit(e)
    }

    showStarFormModal() {
        const modal = document.getElementById('star-form-modal')
        const form = document.getElementById('star-form')
        form.reset()
        document.getElementById('photo-preview').innerHTML = ''
        document.getElementById('file-label-text').textContent = 'Escolher Foto'
        document.getElementById('star-form-error').textContent = ''
        modal.style.display = 'flex'
    }

    handlePhotoPreview(e) {
        const file = e.target.files[0]
        const preview = document.getElementById('photo-preview')
        const labelText = document.getElementById('file-label-text')

        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`
                labelText.textContent = file.name
            }
            reader.readAsDataURL(file)
        } else {
            preview.innerHTML = ''
            labelText.textContent = 'Escolher Foto'
        }
    }

    async handleStarFormSubmit(e) {
        e.preventDefault()
        const form = e.target
        const submitBtn = form.querySelector('.submit-btn')
        const errorDiv = document.getElementById('star-form-error')

        const name = document.getElementById('star-name').value
        const surname = document.getElementById('star-surname').value
        const message = document.getElementById('star-message').value
        const photoFile = document.getElementById('star-photo').files[0]

        submitBtn.disabled = true
        submitBtn.textContent = 'Criando...'
        errorDiv.textContent = ''

        try {
            let photoUrl = null

            if (photoFile) {
                submitBtn.textContent = 'Enviando foto...'
                const { data, error } = await uploadStarPhoto(this.currentUser.id, photoFile)
                if (error) throw error
                photoUrl = data
            }

            submitBtn.textContent = 'Criando estrela...'

            const position = this.galaxy.generateRandomPosition()
            const starType = Math.floor(Math.random() * starTypes.color.length)

            const starData = {
                user_id: this.currentUser.id,
                name,
                surname,
                message,
                photo_url: photoUrl,
                position_x: position.x,
                position_y: position.y,
                position_z: position.z,
                color_hex: '#' + starTypes.color[starType].getHexString(),
                size: starTypes.size[starType]
            }

            const { data, error } = await createCustomStar(starData)
            if (error) throw error

            await this.galaxy.addCustomStar(data)
            this.galaxy.animateNewStar(data.id)

            document.getElementById('star-form-modal').style.display = 'none'
            form.reset()
            await this.updateStarCount()

        } catch (error) {
            errorDiv.textContent = error.message
        } finally {
            submitBtn.disabled = false
            submitBtn.textContent = 'Criar Estrela'
        }
    }

    createStarDetailsModal() {
        const modal = document.createElement('div')
        modal.id = 'star-details-modal'
        modal.className = 'modal'
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="document.getElementById('star-details-modal').style.display='none'">&times;</span>
                <div id="star-details-content"></div>
            </div>
        `
        document.body.appendChild(modal)
    }

    showStarDetails(starData) {
        const modal = document.getElementById('star-details-modal')
        const content = document.getElementById('star-details-content')

        content.innerHTML = `
            <div class="star-details">
                ${starData.photo_url ? `<img src="${starData.photo_url}" alt="${starData.name}">` : ''}
                <h2>${starData.name} ${starData.surname}</h2>
                <p class="star-message">${starData.message}</p>
                <p class="star-date">Criada em: ${new Date(starData.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
        `

        modal.style.display = 'flex'
    }

    createMyStarsModal() {
        const modal = document.createElement('div')
        modal.id = 'my-stars-modal'
        modal.className = 'modal'
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="document.getElementById('my-stars-modal').style.display='none'">&times;</span>
                <h2>Minhas Estrelas</h2>
                <div id="my-stars-list"></div>
            </div>
        `
        document.body.appendChild(modal)
    }

    async showMyStarsModal() {
        const modal = document.getElementById('my-stars-modal')
        const list = document.getElementById('my-stars-list')

        list.innerHTML = '<p class="loading">Carregando...</p>'
        modal.style.display = 'flex'

        try {
            const { data, error } = await getUserStars(this.currentUser.id)
            if (error) throw error

            if (!data || data.length === 0) {
                list.innerHTML = '<p class="empty">Você ainda não criou nenhuma estrela.</p>'
                return
            }

            list.innerHTML = data.map(star => `
                <div class="star-item" data-star-id="${star.id}">
                    <div class="star-item-info">
                        ${star.photo_url ? `<img src="${star.photo_url}" alt="${star.name}">` : ''}
                        <div>
                            <h3>${star.name} ${star.surname}</h3>
                            <p>${star.message.substring(0, 50)}${star.message.length > 50 ? '...' : ''}</p>
                        </div>
                    </div>
                    <button class="locate-btn" onclick="window.uiManager.locateStar('${star.id}')">Localizar</button>
                </div>
            `).join('')

        } catch (error) {
            list.innerHTML = `<p class="error">Erro ao carregar estrelas: ${error.message}</p>`
        }
    }

    locateStar(starId) {
        document.getElementById('my-stars-modal').style.display = 'none'
        this.galaxy.navigateToStar(starId, this.camera, this.orbit)
    }
}
