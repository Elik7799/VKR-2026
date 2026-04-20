import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllCompanies, getCompanyIncidents, getCompanyPricePoints } from './services/googleSheets';
import './Company.css';

export default function Company() {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [pricePoints, setPricePoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoading(true);
        const companiesList = await getAllCompanies();
        setCompanies(companiesList);
      } catch (error) {
        console.error('Ошибка загрузки компаний:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadCompanies();
  }, []);

  const handleSelectCompany = async (company) => {
    try {
      setLoading(true);
      setSelectedCompany(company.name);
      
      const incidentsData = await getCompanyIncidents(company.name);
      setIncidents(incidentsData);
      
      const pricesData = await getCompanyPricePoints(company.name);
      setPricePoints(pricesData);
      
      const totalIncidents = incidentsData.length;
      const avgImpact = totalIncidents > 0 
        ? incidentsData.reduce((sum, inc) => sum + inc.impact, 0) / totalIncidents 
        : 0;
      const strongestIncident = totalIncidents > 0
        ? incidentsData.reduce((min, inc) => inc.impact < min.impact ? inc : min, incidentsData[0])
        : null;
      
      setCompanyData({
        ...company,
        stats: {
          totalIncidents,
          avgImpact: avgImpact.toFixed(1),
          strongestImpact: strongestIncident?.impact || 0,
          strongestImpactDate: strongestIncident?.date || '',
          strongestImpactType: strongestIncident?.type || ''
        }
      });
    } catch (error) {
      console.error('Ошибка загрузки инцидентов:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getImpactClass = (impact) => {
    if (impact > 0) return 'positive';
    if (impact < 0) return 'negative';
    return 'neutral';
  };

  const getSeverityInfo = (impact) => {
    if (impact <= -15) return { label: 'Критический', class: 'critical', icon: '🔴' };
    if (impact <= -10) return { label: 'Высокий', class: 'high', icon: '🟠' };
    if (impact <= -5) return { label: 'Средний', class: 'medium', icon: '🟡' };
    return { label: 'Низкий', class: 'low', icon: '🟢' };
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.ticker.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && companies.length === 0) {
    return (
      <div className="company-page loading">
        <div className="loader">Загрузка компаний...</div>
      </div>
    );
  }
  return (
    <div className="company-page">
      <div className="company-layout">
        <div className="company-sidebar">
          <div className="sidebar-header">
            <h2>🏢 Компании</h2>
            <div className="search-box">
              <input
                type="text"
                placeholder="Поиск по названию или тикеру..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>
          </div>
          
          <div className="company-list">
            {filteredCompanies.map((company) => (
              <div
                key={company.name}
                className={`company-item ${selectedCompany === company.name ? 'active' : ''}`}
                onClick={() => handleSelectCompany(company)}
              >
                <div className="company-info">
                  <div className="company-name">{company.name}</div>
                  <div className="company-ticker">{company.ticker}</div>
                </div>
                <div className="company-badges">
                  <span className="exchange-badge">{company.exchange}</span>
                  <span className={`impact-badge ${company.avgImpact < 0 ? 'negative' : 'positive'}`}>
                    {company.avgImpact > 0 ? `+${company.avgImpact.toFixed(1)}%` : `${company.avgImpact.toFixed(1)}%`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="company-detail">
          {selectedCompany && companyData ? (
            <>
              <div className="detail-header">
                <div className="company-title">
                  <h1>{companyData.name} ({companyData.ticker})</h1>
                  <div className="company-meta">
                    <span className="meta-item">📍 {companyData.country}</span>
                    <span className="meta-item">🏛️ {companyData.exchange}</span>
                    <span className="meta-item">💵 {companyData.currency}</span>
                  </div>
                </div>
                <div className="detail-actions">
                  <button className="action-btn">📥 Экспорт</button>
                  <button className="action-btn refresh-btn" onClick={() => handleSelectCompany(companyData)}>↻ Обновить</button>
                </div>
              </div>

              <div className="stats-section">
                <h3 className="section-title">📊 СТАТИСТИКА ПО ИНЦИДЕНТАМ</h3>
                <div className="stats-cards">
                  <div className="stat-card">
                    <div className="stat-value">{companyData.stats.totalIncidents}</div>
                    <div className="stat-label">Всего инцидентов</div>
                  </div>
                  <div className="stat-card">
                    <div className={`stat-value ${companyData.stats.avgImpact < 0 ? 'negative' : 'positive'}`}>
                      {companyData.stats.avgImpact > 0 ? `+${companyData.stats.avgImpact}%` : `${companyData.stats.avgImpact}%`}
                    </div>
                    <div className="stat-label">Среднее влияние</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value negative">{companyData.stats.strongestImpact}%</div>
                    <div className="stat-label">Самое сильное влияние</div>
                    <div className="stat-sub">{formatDate(companyData.stats.strongestImpactDate)}</div>
                  </div>
                </div>
              </div>

              {pricePoints.length > 0 && (
                <div className="chart-section">
                  <h3 className="section-title">📈 ДИНАМИКА ЦЕН (в дни инцидентов)</h3>
                  <div className="mini-chart">
                    <svg viewBox="0 0 600 150" className="chart-svg">
                      <line x1="40" y1="120" x2="560" y2="120" stroke="#e2e8f0" strokeWidth="1" />
                      
                      {pricePoints.map((point, idx) => {
                        const x = 40 + (idx / (pricePoints.length - 1 || 1)) * 520;
                        const y = 120 - (Math.abs(point.impact) / 40) * 100;
                        const isNegative = point.impact < 0;
                        
                        return (
                          <g key={idx}>
                            <circle cx={x} cy={y} r="6" fill={isNegative ? '#ef4444' : '#22c55e'} stroke="white" strokeWidth="2" />
                            <text x={x - 25} y={y - 8} fontSize="10" fill={isNegative ? '#ef4444' : '#22c55e'}>
                              {point.impact}%
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                    <div className="chart-legend">
                      {pricePoints.map((point, idx) => (
                        <div key={idx} className="legend-item">
                          <span className={`legend-dot ${point.impact < 0 ? 'negative' : 'positive'}`}></span>
                          <span className="legend-text">
                            {point.impact < 0 ? '🔴' : '🟢'} {formatDate(point.date)} - {point.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {incidents.length > 0 && (
                <div className="incidents-history">
                  <h3 className="section-title">📋 ИСТОРИЯ ИНЦИДЕНТОВ</h3>
                  <div className="history-table-container">
                    <table className="history-table">
                      <thead>
                        <tr>
                          <th>Дата</th>
                          <th>Тип атаки</th>
                          <th>Влияние</th>
                          <th>Цена до (T-5)</th>
                          <th>Цена в день</th>
                          <th>Цена после (T+5)</th>
                          <th>Детали</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incidents.map((incident) => {
                          const severity = getSeverityInfo(incident.impact);
                          return (
                            <tr key={incident.id}>
                              <td>{formatDate(incident.date)}</td>
                              <td>
                                <span className={`severity-badge ${severity.class}`}>
                                  {severity.icon} {incident.type}
                                </span>
                              </td>
                              <td className={getImpactClass(incident.impact)}>
                                {incident.impact > 0 ? `+${incident.impact}%` : `${incident.impact}%`}
                              </td>
                              <td>${incident.priceBefore?.toFixed(2) || '—'}</td>
                              <td>${incident.priceOnDay?.toFixed(2) || '—'}</td>
                              <td>${incident.priceAfter?.toFixed(2) || '—'}</td>
                              <td>
                                <Link to={`/analysis/${incident.id}`} className="detail-link">
                                  [Анализ] →
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              <div className="company-description">
                <h4>ℹ️ Общая информация</h4>
                <p>
                  Компания {companyData.name} зафиксировала {companyData.stats.totalIncidents} 
                  киберинцидент{companyData.stats.totalIncidents > 1 ? 'ов' : ''}. 
                  Среднее падение капитализации составило {companyData.stats.avgImpact > 0 ? `+${companyData.stats.avgImpact}` : companyData.stats.avgImpact}%.
                  Наиболее серьезный инцидент произошел {formatDate(companyData.stats.strongestImpactDate)} 
                  с падением на {companyData.stats.strongestImpact}%.
                </p>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🏢</div>
              <h3>Выберите компанию</h3>
              <p>Выберите компанию из списка слева, чтобы просмотреть детальную статистику по киберинцидентам</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}