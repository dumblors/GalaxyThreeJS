import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
}

export async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    })
    return { data, error }
}

export async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })
    return { data, error }
}

export async function signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
}

export async function uploadStarPhoto(userId, file) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage
        .from('star-photos')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
        })

    if (error) return { data: null, error }

    const { data: { publicUrl } } = supabase.storage
        .from('star-photos')
        .getPublicUrl(fileName)

    return { data: publicUrl, error: null }
}

export async function createCustomStar(starData) {
    const { data, error } = await supabase
        .from('custom_stars')
        .insert([starData])
        .select()
        .single()

    return { data, error }
}

export async function getCustomStars() {
    const { data, error } = await supabase
        .from('custom_stars')
        .select('*')
        .order('created_at', { ascending: false })

    return { data, error }
}

export async function getUserStars(userId) {
    const { data, error } = await supabase
        .from('custom_stars')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    return { data, error }
}

export async function incrementStarViews(starId) {
    const { error } = await supabase.rpc('increment_star_views', { star_id: starId })
    return { error }
}
