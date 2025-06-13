import { useState } from 'react'
import './EmailList.css'

export default function EmailList() {
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const search = async params => {
    setLoading(true)
    setError('')
    const query = new URLSearchParams()
    if (params.query) query.append('q', params.query)
    if (params.account) query.append('account', params.account)
    if (params.category) query.append('category', params.category)
    try {
      const res = await fetch('/search?' + query.toString())
      const data = await res.json()
      setEmails(data)
    } catch (err) {
      setError('Failed to load emails')
    } finally {
      setLoading(false)
    }
  }

  const toggle = (idx) => {
    setEmails((arr) =>
      arr.map((e, i) => (i === idx ? { ...e, open: !e.open } : e))
    )
  }

  return (
    <div>
      {loading && <div className="spinner">Loading...</div>}
      {error && <div className="error">{error}</div>}
      <SearchPanel onSearch={search} />
      <ul className="email-list">
        {emails.map((e, idx) => (
          <li
            key={idx}
            className={'email-item' + (e.open ? ' open' : '')}
            onClick={() => toggle(idx)}
          >
            <div className="summary">
              <strong>{e.subject}</strong> - {e.from}
              <span className="badge">{e.category}</span>
            </div>
            <pre className="body">{e.body}</pre>
          </li>
        ))}
      </ul>
    </div>
  )
}

import SearchPanel from './SearchPanel'
