import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getIncidentById } from './services/googleSheets';
import './Analysis.css';

export default function Analysis() {
  const { id } = useParams();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('metrics');

  useEffect(() => {
    const loadIncident = async () => {
      try {
        setLoading(true);
        const found = await getIncidentById(id);

        if (found) {
          setIncident(found);
        } else {
          setError('Инцидент не найден');
        }
      } catch (err) {
        console.error('Ошибка загрузки:', err);
        setError('Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    };

    loadIncident();
  }, [id]);

  const getDailyReturns = () => {
    if (!incident || !incident.chartPrices || !incident.chartDates) return [];

    const marketReturns = [-0.3, -0.2, -0.4, -0.5, -0.3, -2.1, -1.2, -0.8, -0.5, -0.3, -0.2];

    return incident.chartDates.map((date, i) => {
      const prevPrice = i > 0 ? incident.chartPrices[i - 1] : incident.chartPrices[i];
      const stockReturn = ((incident.chartPrices[i] - prevPrice) / prevPrice) * 100;
      const abReturn = stockReturn - marketReturns[i];

      let cumulative = 0;
      for (let j = 0; j <= i; j++) {
        const pPrice = j > 0 ? incident.chartPrices[j - 1] : incident.chartPrices[j];
        const sReturn = ((incident.chartPrices[j] - pPrice) / pPrice) * 100;
        cumulative += sReturn - marketReturns[j];
      }

      return {
        date: date,
        price: incident.chartPrices[i].toFixed(2),
        stockReturn: stockReturn.toFixed(1),
        marketReturn: marketReturns[i].toFixed(1),
        abReturn: abReturn.toFixed(1),
        cumulative: cumulative.toFixed(1)
      };
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getSeverityInfo = (severity, impact) => {
    if (severity === 'critical' || impact <= -15) {
      return { label: 'Критический', class: 'critical', icon: '🔴' };
    } else if (severity === 'high' || impact <= -10) {
      return { label: 'Высокий', class: 'high', icon: '🟠' };
    } else if (severity === 'medium' || impact <= -5) {
      return { label: 'Средний', class: 'medium', icon: '🟡' };
    } else {
      return { label: 'Низкий', class: 'low', icon: '🟢' };
    }
  };

  if (loading) {
    return (
      <div className="analysis-page loading">
        <div className="loader">Загрузка данных...</div>
      </div>
    );
  }
  if (error || !incident) {
    return (
      <div className="analysis-page error">
        <div className="error-message">{error || 'Инцидент не найден'}</div>
        <Link to="/incidents" className="back-link">← Вернуться к списку</Link>
      </div>
    );
  }
  const severity = getSeverityInfo(incident.severity, incident.impact);
  const dailyReturns = getDailyReturns();

  const minPrice = Math.min(...incident.chartPrices);
  const maxPrice = Math.max(...incident.chartPrices);
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.1;
  const chartMin = minPrice - padding;
  const chartMax = maxPrice + padding;

  const getY = (price) => {
    return 260 - ((price - chartMin) / (chartMax - chartMin)) * 240;
  };

  return (
    <div className="analysis-page">
      <div className="analysis-header">
        <div className="header-left">
          <Link to="/incidents" className="back-button">← Назад</Link>
          <h1 className="page-title">
            Анализ: {incident.company} ({incident.ticker}) - {formatDate(incident.date)}
          </h1>
        </div>
        <div className="header-actions">
          <button className="action-btn refresh-btn" onClick={() => window.location.reload()}>↻ Обновить</button>
        </div>
      </div>

      <div className="analysis-tabs">
        <button className={`tab ${activeTab === 'metrics' ? 'active' : ''}`} onClick={() => setActiveTab('metrics')}>📊 Метрики</button>
        <button className={`tab ${activeTab === 'chart' ? 'active' : ''}`} onClick={() => setActiveTab('chart')}>📈 График</button>
        <button className={`tab ${activeTab === 'table' ? 'active' : ''}`} onClick={() => setActiveTab('table')}>📅 Дневная история</button>
        <button className={`tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>🏭 Информация</button>
      </div>

      <div className="analysis-content">
        {(activeTab === 'metrics' || activeTab === 'chart') && incident.chartPrices && (
          <div className="chart-section">
            <h3 className="section-title">ДИНАМИКА ЦЕН</h3>
            <div className="chart-container">
              <svg viewBox="0 0 800 300" className="chart-svg">
                <line x1="60" y1="20" x2="60" y2="280" stroke="#e2e8f0" strokeWidth="2" />
                <line x1="60" y1="280" x2="780" y2="280" stroke="#e2e8f0" strokeWidth="2" />

                {[0, 25, 50, 75, 100].map((val, idx) => {
                  const price = chartMin + (val / 100) * (chartMax - chartMin);
                  const y = getY(price);
                  return (
                    <g key={idx}>
                      <text x="45" y={y + 4} fontSize="10" fill="#64748b">${price.toFixed(1)}</text>
                      <line x1="57" y1={y} x2="60" y2={y} stroke="#94a3b8" strokeWidth="1" />
                    </g>
                  );
                })}

                <polyline
                  points={incident.chartPrices.map((price, i) => {
                    const x = 60 + (i / (incident.chartPrices.length - 1)) * 720;
                    const y = getY(price);
                    return `${x},${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#667eea"
                  strokeWidth="3"
                />

                {incident.chartPrices.map((price, i) => {
                  const x = 60 + (i / (incident.chartPrices.length - 1)) * 720;
                  const y = getY(price);
                  const isIncidentDay = i === 5;
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r={isIncidentDay ? 6 : 3}
                      fill={isIncidentDay ? '#ef4444' : '#667eea'}
                      stroke="white"
                      strokeWidth="2"
                    />
                  );
                })}

                {incident.chartDates.map((date, i) => {
                  const x = 60 + (i / (incident.chartDates.length - 1)) * 720;
                  const label = i === 5 ? 'T' : (i < 5 ? `T-${5 - i}` : `T+${i - 5}`);
                  return (
                    <text key={i} x={x - 12} y="295" fontSize="10" fill="#64748b">
                      {label}
                    </text>
                  );
                })}

                <text x="390" y="315" fontSize="11" fill="#ef4444" textAnchor="middle">↑ Incident Date</text>
              </svg>
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="metrics-row">
            <div className="metrics-card">
              <h3 className="card-title">📊 КЛЮЧЕВЫЕ МЕТРИКИ</h3>
              <div className="metrics-grid">
                <div className="metric-item">
                  <span className="metric-label">Цена до (T-5)</span>
                  <span className="metric-value">${incident.priceBefore?.toFixed(2) || '—'}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Цена после (T+5)</span>
                  <span className="metric-value">${incident.priceAfter?.toFixed(2) || '—'}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Абсолютное изменение</span>
                  <span className={`metric-value ${incident.impact < 0 ? 'negative' : 'positive'}`}>
                    ${incident.absoluteChange?.toFixed(2) || '—'}
                  </span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Относительное изменение</span>
                  <span className={`metric-value ${incident.impact < 0 ? 'negative' : 'positive'}`}>
                    {incident.impactFormatted}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'table' && dailyReturns.length > 0 && (
          <div className="table-section">
            <h3 className="section-title">📅 ДНЕВНАЯ ИСТОРИЯ (окно -5 до +5 дней)</h3>
            <div className="returns-table-container">
              <table className="returns-table">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Цена</th>
                    <th>Доходность</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyReturns.map((row, idx) => (
                    <tr key={idx} className={row.date === incident.date ? 'incident-row' : ''}>
                      <td>{formatDate(row.date)}</td>
                      <td>${row.price}</td>
                      <td className={parseFloat(row.stockReturn) < 0 ? 'negative' : 'positive'}>{row.stockReturn}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'info' && (
          <div className="info-section">
            <h3 className="section-title">🏭 ИНФОРМАЦИЯ О КОМПАНИИ</h3>
            <div className="company-info-grid">
              <div className="info-card">
                <span className="info-label">Компания</span>
                <span className="info-value">{incident.company}</span>
              </div>
              <div className="info-card">
                <span className="info-label">Тикер</span>
                <span className="info-value">{incident.ticker}</span>
              </div>
              <div className="info-card">
                <span className="info-label">Дата инцидента</span>
                <span className="info-value">{formatDate(incident.date)}</span>
              </div>
              <div className="info-card">
                <span className="info-label">Тип атаки</span>
                <span className="info-value">{incident.attackType}</span>
              </div>
              <div className="info-card">
                <span className="info-label">Тип акций</span>
                <span className="info-value">{incident.stockType}</span>
              </div>
              <div className="info-card">
                <span className="info-label">Влияние на капитализацию</span>
                <span className={`info-value ${incident.impact < 0 ? 'negative' : 'positive'}`}>
                  {incident.impactFormatted}
                </span>
              </div>
              <div className="info-card">
                <span className="info-label">Уровень серьезности</span>
                <span className={`severity-badge ${severity.class}`}>
                  {severity.icon} {severity.label}
                </span>
              </div>
              <div className="info-card">
                <span className="info-label">Страна</span>
                <span className="info-value">{incident.country}</span>
              </div>
              <div className="info-card">
                <span className="info-label">Биржа</span>
                <span className="info-value">{incident.exchange}</span>
              </div>
              <div className="info-card">
                <span className="info-label">Валюта</span>
                <span className="info-value">{incident.currency}</span>
              </div>
              <div className="info-card">
                <span className="info-label">ISIN</span>
                <span className="info-value">{incident.isin || '—'}</span>
              </div>
            </div>

            <div className="description-card">
              <h4>Описание инцидента</h4>
              <p>{incident.description}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}