import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import AuthVerify from './pages/AuthVerify'
import Dashboard from './pages/Dashboard'
import CreateEvent from './pages/CreateEvent'
import EventView from './pages/EventView'
import EventAdmin from './pages/EventAdmin'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/verify" element={<AuthVerify />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create" element={<CreateEvent />} />
            <Route path="/e/:accessCode" element={<EventView />} />
            <Route path="/e/:accessCode/admin" element={<EventAdmin />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
