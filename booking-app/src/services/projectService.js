import { supabase } from '../lib/supabase'

// Mengambil semua data project
export const getProjects = async () => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

// Menyimpan project baru
export const createProject = async (projectData) => {
  const { data, error } = await supabase
    .from('projects')
    .insert([projectData])
    .select()
    
  if (error) throw error
  return data
}