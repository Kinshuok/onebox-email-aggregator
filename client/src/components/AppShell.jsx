import { Link, Outlet } from 'react-router-dom'
import './AppShell.css'

export default function AppShell() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Onebox</h1>
        <div className="account-controls">
          <Link to="/settings">Settings</Link>
        </div>
      </header>
      <div className="app-body">
        <nav className="sidebar">
          <ul>
            <li><Link to="/">Inbox</Link></li>
            <li><Link to="/settings">Settings</Link></li>
          </ul>
        </nav>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
