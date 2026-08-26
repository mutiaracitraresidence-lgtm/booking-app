import { supabase } from '../lib/supabase'

export const getDashboardStats = async (userProfile) => {
  try {
    const userRole = userProfile?.roles?.name?.toLowerCase() || ''
    const isAgency = userRole === 'agency'
    const myAgencyId = userProfile?.agency_id || userProfile?.id

    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id, status, kpr_status, created_at,
        marketing:marketing_id (
          name, agency_id,
          agencies:agency_id (name)
        )
      `)

    if (bookingError) throw bookingError

    let filteredBookings = bookings || []
    if (isAgency) {
      filteredBookings = filteredBookings.filter(b => b.marketing?.agency_id === myAgencyId)
    }

    // 1. VARIABEL KARTU METRIK (Ada tambahan Batal)
    let jumlahBooking = 0
    let berkasProses = 0
    let sp3k = 0
    let akadKredit = 0
    let berkasBatal = 0

    const currentYear = new Date().getFullYear()
    const monthlyData = Array(12).fill(0).map((_, i) => ({
      month: new Date(0, i).toLocaleString('id-ID', { month: 'short' }),
      booking: 0,
      akad: 0
    }))

    const performanceMap = {}

    filteredBookings.forEach(b => {
      const status = b.status
      const kprStatus = b.kpr_status || ''
      const date = new Date(b.created_at)
      const month = date.getMonth()
      const year = date.getFullYear()

      // Deteksi Berkas Batal / Mundur
      if (status === 'REJECTED' || status === 'CANCELED' || kprStatus.includes('Gagal')) {
        berkasBatal++
      } else {
        // Hitung yang masih aktif
        jumlahBooking++
        
        if (['Pemberkasan', 'Berkas Lengkap', 'Verifikasi Bank'].includes(kprStatus)) {
          berkasProses++
        } else if (kprStatus === 'SP3K') {
          sp3k++
        } else if (kprStatus === 'Akad Kredit' || status === 'SOLD') {
          akadKredit++
        }

        // Hitung Grafik Bulanan (Hanya yang tidak batal)
        if (year === currentYear) {
          monthlyData[month].booking++
          if (kprStatus === 'Akad Kredit' || status === 'SOLD') {
            monthlyData[month].akad++
          }
        }

        // Hitung Performa (Leaderboard)
        const mktName = b.marketing?.name || 'Tanpa Nama Marketing'
        const agencyData = b.marketing?.agencies
        let agencyName = 'Independen / In-House'
        
        if (agencyData) {
          if (Array.isArray(agencyData) && agencyData.length > 0) {
            agencyName = agencyData[0].name
          } else if (agencyData.name) {
            agencyName = agencyData.name
          }
        }

        const key = `${agencyName}-${mktName}`
        if (!performanceMap[key]) {
          performanceMap[key] = { agency: agencyName, marketing: mktName, total_booking: 0, total_akad: 0 }
        }
        
        performanceMap[key].total_booking++
        if (kprStatus === 'Akad Kredit' || status === 'SOLD') {
          performanceMap[key].total_akad++
        }
      }
    })

    const performanceRank = Object.values(performanceMap).sort((a, b) => {
      if (b.total_akad !== a.total_akad) return b.total_akad - a.total_akad
      return b.total_booking - a.total_booking
    })

    return {
      jumlahBooking, berkasProses, sp3k, akadKredit, berkasBatal,
      monthlyData, performanceRank, currentYear
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    throw error
  }
}