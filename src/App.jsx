import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { supabase } from './lib/supabaseClient'
import Auth from './Auth'
import ForgotPassword from './ForgotPassword'
import ResetPassword from './ResetPassword'
import Terms from './Terms'
import Privacy from './Privacy'
import PropertySubmit from './PropertySubmit'
import Browse from './Browse'
import { FavoritesList } from './Favorites'
import Profile from './Profile'
import { ConversationsList, ChatWindow } from './Messaging'
import AdminDashboard from './AdminDashboard'
import MapView from './MapView'
import MyListings from './MyListings'
import NotFound from './NotFound'
import ErrorBoundary from './ErrorBoundary'
import DarkModeToggle from './DarkModeToggle'

function MessagesPage() {
  const location = useLocation()
  const [activeConversation, setActiveConversation] = useState(location.state?.conversationId || null)
  if (activeConversation) {
    return <ChatWindow conversationId={activeConversation} onBack={() => setActiveConversation(null)} />
  }
  return <ConversationsList onSelect={setActiveConversation} />
}

function NavLink({ to, children, onClick }) {
  const location = useLocation()
  const active = location.pathname === to
  return <Link to={to} className={active ? 'active' : ''} onClick={onClick}>{children}</Link>
}

function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [role, setRole] = useState(null)
  const closeMenu = () => setMenuOpen(false)
  const canSubmit = role === 'agent' || role === 'admin'
  const isAdmin = role === 'admin'

  useEffect(() => {
    async function checkRole() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      setRole(data?.role || null)
    }
    checkRole()
  }, [])

  return (
    <div>
      <nav className="navbar">
        <div className="brand-logo">
          <img src="/icons/icon-512.png" alt="CampusNest" />
          <span>CampusNest</span>
        </div>

        <div className="links desktop-links">
          <NavLink to="/">Browse</NavLink>
          <NavLink to="/map">Map</NavLink>
          {canSubmit && <NavLink to="/submit">Submit</NavLink>}
          {canSubmit && <NavLink to="/my-listings">My Listings</NavLink>}
          <NavLink to="/favorites">Favorites</NavLink>
          <NavLink to="/messages">Messages</NavLink>
          <NavLink to="/profile">Profile</NavLink>
          {isAdmin && <NavLink to="/admin">Admin</NavLink>}
          <DarkModeToggle />
          <button className="btn-outline" style={{ marginLeft: 16 }} onClick={() => supabase.auth.signOut()}>Sign Out</button>
        </div>

        <button className="menu-toggle" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {menuOpen && (
        <div className="mobile-menu">
          <NavLink to="/" onClick={closeMenu}>Browse</NavLink>
          <NavLink to="/map" onClick={closeMenu}>Map</NavLink>
          {canSubmit && <NavLink to="/submit" onClick={closeMenu}>Submit</NavLink>}
          {canSubmit && <NavLink to="/my-listings" onClick={closeMenu}>My Listings</NavLink>}
          <NavLink to="/favorites" onClick={closeMenu}>Favorites</NavLink>
          <NavLink to="/messages" onClick={closeMenu}>Messages</NavLink>
          <NavLink to="/profile" onClick={closeMenu}>Profile</NavLink>
          {isAdmin && <NavLink to="/admin" onClick={closeMenu}>Admin</NavLink>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <DarkModeToggle />
            <button className="btn-outline" onClick={() => supabase.auth.signOut()}>Sign Out</button>
          </div>
        </div>
      )}

      <Routes>
        <Route path="/" element={<Browse />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/submit" element={<PropertySubmit />} />
        <Route path="/my-listings" element={<MyListings />} />
        <Route path="/favorites" element={<FavoritesList />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      <div className="footer-links">
        <a href="/terms">Terms of Service</a> · <a href="/privacy">Privacy Policy</a>
      </div>
    </div>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => listener.subscription.unsubscribe()
  }, [])

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/*" element={!session ? <Auth /> : <AppShell />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
