import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabase'
import Login from './pages/Login'
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#2a2220', color: '#e8c84a',
      fontFamily: "'Bebas Neue', sans-serif", fontSize: '18px', letterSpacing: '2px'
    }}>
      LOADING...
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
        <Route path="/" element={session ? <Layout session={session} /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard />} />
          <Route path="sefa" element={<Sefa />} />
          <Route path="sefa/info" element={<SefaInfo />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="results" element={<Results />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="members" element={<Members />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="sponsors" element={<Sponsors />} />
          <Route path="orgchart" element={<OrgChart />} />
          <Route path="sns" element={<SNS />} />
          <Route path="rules" element={<Rules />} />
          <Route path="o40-policy" element={<O40Policy />} />
          <Route path="u40-policy" element={<U40Policy />} />
          <Route path="mypage" element={<MyPage />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
