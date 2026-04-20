import { NavLink } from 'react-router-dom'
import './Header.css'

export default function Header() {
  return (
    <nav className="header">
      <div className="header-container">
        <div className="nav-links">
          <NavLink to='/'>Главная</NavLink>
          <NavLink to='/incidents'>Инциденты</NavLink>
          <NavLink to='/company'>Компании</NavLink>
        </div>
      </div>
    </nav>
  )
}