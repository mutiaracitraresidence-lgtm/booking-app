import { supabase } from '../lib/supabase'

export const createBookingTransaction = async (bookingData, proofFile) => {
  let proofUrl = null

  // Jika metode pembayaran adalah TRANSFER dan ada file bukti yang diupload
  if (bookingData.payment_method === 'TRANSFER' && proofFile) {
    const fileExt = proofFile.name.split('.').pop()
    const fileName = `proof_${Date.now()}.${fileExt}`
    
    // Upload ke bucket kpr_documents yang sudah kita buat sebelumnya
    const { error: uploadError } = await supabase.storage
      .from('kpr_documents')
      .upload(fileName, proofFile, { cacheControl: '3600', upsert: true })

    if (uploadError) throw uploadError

    const { data: publicUrlData } = supabase.storage
      .from('kpr_documents')
      .getPublicUrl(fileName)
    
    proofUrl = publicUrlData.publicUrl
  }

  // Panggil RPC atau insert ke database
  const { data, error } = await supabase.from('bookings').insert([
    {
      unit_id: bookingData.unit_id,
      marketing_id: bookingData.marketing_id,
      customer_name: bookingData.customer_name,
      customer_phone: bookingData.customer_phone,
      customer_nik: bookingData.customer_nik,
      booking_fee: bookingData.booking_fee,
      payment_method: bookingData.payment_method,
      payment_proof_url: proofUrl,
      status: 'PENDING',
      kpr_status: 'Menunggu Dokumen'
    }
  ]).select()

  if (error) throw error
  return data
}

export const getBookings = async () => {
  const { data, error } = await supabase
    .from('bookings')
    // TAMBAHKAN agencies(name) DI DALAM SINI
    .select(`*, units (unit_code, price, projects(project_name)), marketing (name, agencies(name))`)
    .order('created_at', { ascending: false })
    
  if (error) throw error
  return data
}

export const processApproval = async (bookingId, newStatus) => {
  const { data, error } = await supabase.rpc('process_booking_status', { p_booking_id: bookingId, p_new_status: newStatus })
  if (error) throw error
  return data
}

// --- FUNGSI BARU: KHUSUS PORTAL AGENSI ---
export const getAgencyBookings = async (agencyId, isAgency) => {
  let query = supabase.from('bookings').select(`*, units(unit_code, projects(project_name)), marketing!inner(name, agency_id)`).order('created_at', { ascending: false })
  if (isAgency) query = query.eq('marketing.agency_id', agencyId)
  const { data, error } = await query
  if (error) throw error
  return data
}

export const submitBerkasKpr = async (bookingId) => {
  const { data, error } = await supabase.from('bookings').update({ kpr_status: 'Pemberkasan' }).eq('id', bookingId)
  if (error) throw error
  return data
}

// --- FUNGSI ADMIN KPR (Sudah Difilter) ---
export const getKprBookings = async () => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`*, units (unit_code, price, projects(project_name)), marketing (name)`)
    .eq('status', 'APPROVED')
    .neq('kpr_status', 'Menunggu Dokumen') // HANYA MUNCUL JIKA SUDAH DISUBMIT AGENSI
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export const updateKprStatusTransaction = async (bookingId, newKprStatus, bankName, bankBranch, customerName) => {
  const { data, error } = await supabase.rpc('update_kpr_status_v2', {
    p_booking_id: bookingId, p_new_kpr_status: newKprStatus, p_bank_name: bankName, p_bank_branch: bankBranch, p_customer_name: customerName
  })
  if (error) throw error
  return data
}

export const rejectKprTransaction = async (bookingId) => {
  const { data, error } = await supabase.rpc('process_kpr_rejection', { p_booking_id: bookingId })
  if (error) throw error
  return data
}

export const uploadKprDocument = async (bookingId, file, docColumn) => {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${bookingId}_${docColumn}_${Date.now()}.${fileExt}`
    const { error: uploadError } = await supabase.storage.from('kpr_documents').upload(fileName, file, { cacheControl: '3600', upsert: true })
    if (uploadError) throw uploadError
    const { data: publicUrlData } = supabase.storage.from('kpr_documents').getPublicUrl(fileName)
    const { error: updateError } = await supabase.from('bookings').update({ [docColumn]: publicUrlData.publicUrl }).eq('id', bookingId)
    if (updateError) throw updateError
    return publicUrlData.publicUrl
  } catch (error) { throw error }
}

// ==========================================
// 5. MANAJEMEN BIAYA PROSES (KEUANGAN)
// ==========================================
export const updateProcessingFee = async (bookingId, totalFee, paidFee) => {
  const { data, error } = await supabase
    .from('bookings')
    .update({ 
      processing_fee_total: totalFee, 
      processing_fee_paid: paidFee 
    })
    .eq('id', bookingId)
    
  if (error) throw error
  return data
}

// ==========================================
// 6. MASTER UNIT: RESET STATUS UNIT / BATAL
// ==========================================
export const forceResetUnitStatus = async (unitId, reason) => {
  try {
    // 1. Ubah status unit ke AVAILABLE
    const { error: unitError } = await supabase
      .from('units')
      .update({ status: 'AVAILABLE' })
      .eq('id', unitId)

    if (unitError) throw unitError

    // 2. Batalkan booking aktif yang terikat pada unit ini
    // Menggunakan status 'REJECTED' agar database tidak menolak (menghindari error 400)
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({ status: 'REJECTED', kpr_status: reason })
      .eq('unit_id', unitId)
      .in('status', ['PENDING', 'APPROVED'])

    if (bookingError) throw bookingError

    return { success: true, message: `Status unit berhasil direset karena ${reason}.` }
  } catch (error) {
    throw error
  }
}