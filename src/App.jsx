import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import Header from './Header'
import Footer from './Footer'
import Dashboard from './Dashboard'
import Incidents from './Incidents'
import Analysis from './Analysis'
import Company from './Company'

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Header />
        <div className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/incidents" element={<Incidents />} />
            <Route path="/analysis/:id" element={<Analysis />} />
            <Route path="/company" element={<Company />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
export default App