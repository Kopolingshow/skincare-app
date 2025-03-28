import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://njpyoqyrefdspcpdxrve.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qcHlvcXlyZWZkc3BjcGR4cnZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5Nzk1OTIsImV4cCI6MjA1ODU1NTU5Mn0.05vT73xMMqB7lnBuK0vjvWWoMfu08BdNcX2mb9ZBahs'

export const supabase = createClient(supabaseUrl, supabaseKey)
