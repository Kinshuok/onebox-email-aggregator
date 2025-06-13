import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppShell from './components/AppShell'
import EmailList from './components/EmailList'
import OAuthCallback from './components/OAuthCallback'
import Settings from './components/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<EmailList />} />
          <Route path="oauth2callback" element={<OAuthCallback />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
