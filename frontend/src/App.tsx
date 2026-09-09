import TicketList from './components/ticketList.tsx'
import './App.css'

function App() {
  return (
    <main className="board">
      <TicketList title="Backlog" />
      <TicketList title="In Progress" />
      <TicketList title="Under Review" />
      <TicketList title="Completed" />
    </main>
  )
}

export default App
