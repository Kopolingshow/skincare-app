import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import SkincareApp from './SkincareApp'
import Auth from './Auth'
import { supabase } from './supabaseClient'
import './index.css'

function AppWrapper() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  return session ? <SkincareApp session={session} /> : <Auth onAuth={setSession} />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>,
)
