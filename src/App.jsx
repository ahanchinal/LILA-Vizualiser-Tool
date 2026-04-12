import { useMatchData } from './hooks/useMatchData.js'
import AppShell from './components/layout/AppShell.jsx'

export default function App() {
  useMatchData()
  return <AppShell />
}
