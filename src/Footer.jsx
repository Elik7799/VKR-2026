import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Южный федеральный университет</h3>
            <p>Институт компьютерных технологий и информационной безопасности</p>
            <p>Кафедра информационно-аналитических систем безопасности</p>
          </div>
          
          <div className="footer-section">
            <h3>Выпускная квалификационная работа</h3>
            <p>Направление: 10.03.01 Информационная безопасность</p>
            <p>Тема: Оценка влияния киберинцидентов на рыночную капитализацию</p>
          </div>
          
          <div className="footer-section">
            <h3>Выполнил ВКР:</h3>

            <p>Е. Е. Корень (КТбо4-12)</p>
            <p>Таганрог, 2025</p>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© 2025 ЮФУ | Министерство науки и высшего образования РФ</p>
        </div>
      </div>
    </footer>
  )
}