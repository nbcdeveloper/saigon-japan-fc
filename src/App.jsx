import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabase'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Schedule from './pages/Schedule'
import Results from './pages/Results'
import Sefa from './pages/Sefa'
import SefaInfo from './pages/SefaInfo'
import Attendance from './pages/Attendance'
import Members from './pages/Members'
import Announcements from './pages/Announcements'
import Sponsors from './pages/Sponsors'
import OrgChart from './pages/OrgChart'
import Rules from './pages/Rules'
import O40Policy from './pages/O40Policy'
import U40Policy from './pages/U40Policy'
import SNS from './pages/SNS'
import MyPage from './pages/MyPage'
import Admin from './pages/Admin'
import Layout from './components/Layout'

function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, teams(*)')
      .eq('id', userId)
      .single()
    if (!error) setProfile(data)
    setLoading(false)
  }

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#2a2220', color: '#e8c84a',
      fontFamily: "'Bebas Neue', sans-serif", fontSize: '18px', letterSpacing: '2px'
    }}>
      LOADING...
    </div>
  )

  // team_idをグローバルに使えるようにwindowに設定
  if (profile) {
    window.__teamId = profile.team_id
    window.__profile = profile
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!session ? <Register /> : <Navigate to="/" />} />
        <Route path="/" element={session ? <Layout session={session} profile={profile} /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard profile={profile} />} />
          <Route path="sefa" element={<Sefa profile={profile} />} />
          <Route path="sefa/info" element={<SefaInfo profile={profile} />} />
          <Route path="schedule" element={<Schedule profile={profile} />} />
          <Route path="results" element={<Results profile={profile} />} />
          <Route path="attendance" element={<Attendance profile={profile} />} />
          <Route path="members" element={<Members profile={profile} />} />
          <Route path="announcements" element={<Announcements profile={profile} />} />
          <Route path="sponsors" element={<Sponsors profile={profile} />} />
          <Route path="orgchart" element={<OrgChart profile={profile} />} />
          <Route path="sns" element={<SNS profile={profile} />} />
          <Route path="rules" element={<Rules profile={profile} />} />
          <Route path="o40-policy" element={<O40Policy profile={profile} />} />
          <Route path="u40-policy" element={<U40Policy profile={profile} />} />
          <Route path="mypage" element={<MyPage profile={profile} />} />
          <Route path="admin" element={<Admin profile={profile} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
