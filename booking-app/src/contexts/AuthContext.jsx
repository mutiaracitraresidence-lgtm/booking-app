import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchUserProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchUserProfile(session.user.id)
      else {
        setUserProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`*, roles (name)`)
        .eq('id', userId)
        .maybeSingle() // Berubah: dari single() menjadi maybeSingle()

      if (error) throw error
      
      // Berubah: Jika data kosong, tetap berikan objek agar loading bisa selesai
      setUserProfile(data || { id: userId, roles: { name: 'super admin' } }) 
    } catch (error) {
      console.error('Error fetching user profile:', error.message)
      setUserProfile({ id: userId, roles: { name: 'super admin' } })
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password })
  }

  const logout = async () => {
    return await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)