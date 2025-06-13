import { useState, useEffect } from 'react'
import './SearchPanel.css'

export default function SearchPanel({ onSearch }) {
  const [accounts, setAccounts] = useState([])
  const [query, setQuery] = useState('')
  const [account, setAccount] = useState('')
  const [category, setCategory] = useState('')

  useEffect(() => {
    fetch('/accounts')
      .then(res => res.json())
      .then(setAccounts)
      .catch(() => {})
  }, [])

  const handleSearch = () => {
    onSearch({ query, account, category })
  }

  const connect = async () => {
    const res = await fetch('/auth-url')
    const data = await res.json()
    window.location.href = data.url
  }

  return (
    <div className="search-panel">
      <button className="connect" onClick={connect}>Connect Gmail</button>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search"
      />
      <select value={account} onChange={e => setAccount(e.target.value)}>
        <option value="">All accounts</option>
        {accounts.map(a => (
          <option key={a}>{a}</option>
        ))}
      </select>
      <select value={category} onChange={e => setCategory(e.target.value)}>
        <option value="">All categories</option>
        <option>Interested</option>
        <option>Meeting Booked</option>
        <option>Not Interested</option>
        <option>Spam</option>
        <option>Out of Office</option>
      </select>
      <button onClick={handleSearch}>Search</button>
    </div>
  )
}
