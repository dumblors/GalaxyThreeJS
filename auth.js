import { supabase, signIn, signUp, signOut, getCurrentUser } from './supabaseClient.js'

export class AuthManager {
    constructor() {
        this.currentUser = null
        this.listeners = []
        this.init()
    }

    async init() {
        this.currentUser = await getCurrentUser()
        this.notifyListeners()

        supabase.auth.onAuthStateChange((event, session) => {
            (async () => {
                this.currentUser = session?.user || null
                this.notifyListeners()
            })()
        })
    }

    onAuthChange(callback) {
        this.listeners.push(callback)
        callback(this.currentUser)
    }

    notifyListeners() {
        this.listeners.forEach(callback => callback(this.currentUser))
    }

    async login(email, password) {
        const { data, error } = await signIn(email, password)
        if (error) throw error
        return data
    }

    async register(email, password) {
        const { data, error } = await signUp(email, password)
        if (error) throw error
        return data
    }

    async logout() {
        const { error } = await signOut()
        if (error) throw error
    }

    isAuthenticated() {
        return this.currentUser !== null
    }

    getUser() {
        return this.currentUser
    }
}

export const authManager = new AuthManager()
