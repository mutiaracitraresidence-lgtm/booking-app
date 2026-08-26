import { supabase } from '../lib/supabase'

// Mengambil semua data unit
export const getUnits = async () => {
  const { data, error } = await supabase
    .from('units')
    .select(`*, projects(project_name)`)
    .order('block', { ascending: true })
    .order('unit_number', { ascending: true })
  
  if (error) throw error
  return data
}

// Menyimpan unit baru
export const createUnit = async (unitData) => {
  const { data, error } = await supabase
    .from('units')
    .insert([unitData])
    .select()
    
  if (error) throw error
  return data
}