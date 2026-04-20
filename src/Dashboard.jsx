import { useState, useEffect } from 'react';
import { getMetrics, getRecentIncidents, getTopImpact, getTrend } from './services/googleSheets';
import './Dashboard.css';

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    totalIncidents: '--',
    incidentsPerMonth: '--',
    avgDrop: '--',
    topVictim: '--',
    topVictimPercent: '--'
  });

  const [recentIncidents, setRecentIncidents] = useState([]);
  const [topImpact, setTopImpact] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        metricsData,
        incidentsData,
        topImpactData,
        trendData
      ] = await Promise.all([
        getMetrics(),
        getRecentIncidents(),
        getTopImpact(),
        getTrend()
      ]);

      setMetrics({
        totalIncidents: metricsData.totalIncidents || '0',
        incidentsPerMonth: metricsData.incidentsPerMonth || '0',
        avgDrop: metricsData.avgDrop || '0%',
        topVictim: metricsData.topVictim || 'Нет данных',
        topVictimPercent: metricsData.topVictimPercent || '0%'
      });

      setRecentIncidents(incidentsData);
      setTopImpact(topImpactData);
      setTrend(trendData);

    } catch (err) {
      console.error('Ошибка загрузки:', err);
      setError('Не удалось загрузить данные из таблицы');
    } finally {
      setLoading(false);
    }
  };

  const getStatusByImpact = (impact) => {
    const numImpact = parseFloat(impact);
    if (isNaN(numImpact)) return 'low';
    if (numImpact <= -5) return 'high';
    if (numImpact <= -2) return 'medium';
    return 'low';
  };

  if (loading) {
    return (
      <div className="dashboard loading">
        <div className="loader">Загрузка данных...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="dashboard error">
        <div className="error-message">{error}</div>
        <button onClick={loadData} className="retry-btn">Повторить</button>
      </div>
    );
  }
  return (
    <div className="dashboard">
      <div className="metrics-section">
        <h2 className="section-title">📊 КЛЮЧЕВЫЕ МЕТРИКИ</h2>
        <div className="metrics-cards">
          <div className="metric-card">
            <div className="metric-value">{metrics.totalIncidents}</div>
            <div className="metric-label"><span>Всего инцидентов</span></div>
            <div className="metric-trend positive">+{metrics.incidentsPerMonth} за месяц</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{metrics.avgDrop}</div>
            <div className="metric-label"><span>Среднее падение</span></div>
            <div className="metric-trend negative">за 5 дней после атаки</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{metrics.topVictim}</div>
            <div className="metric-label"><span>Самый пострадавший</span></div>
            <div className="metric-trend negative">{metrics.topVictimPercent}</div>
          </div>
        </div>
      </div>

      <div className="trend-section">
        <h2 className="section-title">📈 ТРЕНД ПОСЛЕДНИХ ИНЦИДЕНТОВ</h2>
        <div className="chart-container">
          <div className="chart">
            <div className="chart-title">Влияние по типам инцидентов</div>
            {trend.length > 0 ? (
              <div className="trend-list">
                {trend.slice(-10).map((item, index) => (
                  <div key={index} className="trend-item">
                    <span className="trend-type">{item.type}</span>
                    <div className="trend-bar-container">
                      <div
                        className="trend-bar"
                        style={{
                          width: `${Math.min(Math.abs(item.impact) * 2, 100)}%`,
                          background: item.impact < 0 ? '#ef4444' : '#22c55e'
                        }}
                      />
                    </div>
                    <span className="trend-impact">{item.impact}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">Нет данных для отображения</div>
            )}
          </div>
        </div>
      </div>

      <div className="incidents-section">
        <div className="section-header">
          <h2 className="section-title">🔥 ПОСЛЕДНИЕ ИНЦИДЕНТЫ</h2>
          <a href="/incidents" className="view-all">Все инциденты →</a>
        </div>
        <div className="incidents-table">
          <table>
            <thead>
              <tr>
                <th>Компания</th>
                <th>Тикер</th>
                <th>Дата</th>
                <th>Влияние</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {recentIncidents.length > 0 ? (
                recentIncidents.map((incident, index) => (
                  <tr key={index}>
                    <td>{incident.company}</td>
                    <td>{incident.ticker}</td>
                    <td>{incident.date}</td>
                    <td className={incident.impact?.includes('+') ? 'positive' : 'negative'}>
                      {incident.impact}
                    </td>
                    <td>
                      <span className={`status-badge status-${getStatusByImpact(incident.impact)}`}>
                        {getStatusByImpact(incident.impact) === 'high' ? '🔴' :
                          getStatusByImpact(incident.impact) === 'medium' ? '🟡' : '🟢'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="no-data">Нет данных</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="top-section">
        <h2 className="section-title">🏆 ТОП-5 ПО ВЛИЯНИЮ (за все время)</h2>
        <div className="top-list">
          {topImpact.length > 0 ? (
            topImpact.map((item, index) => {
              const maxImpact = Math.abs(parseFloat(topImpact[0]?.impact || -32.4));
              const currentImpact = Math.abs(parseFloat(item.impact));
              const barWidth = !isNaN(currentImpact) && !isNaN(maxImpact) && maxImpact > 0
                ? (currentImpact / maxImpact) * 100
                : 0;

              return (
                <div key={index} className="top-item">
                  <div className="top-rank">{index + 1}</div>
                  <div className="top-info">
                    <div className="top-company">
                      {item.company}
                    </div>
                    <div className="impact-bar">
                      <div className="bar" style={{ width: `${barWidth}%` }}></div>
                    </div>
                  </div>
                  <div className="top-impact negative">{item.impact}</div>
                </div>
              );
            })
          ) : (
            <div className="no-data">Нет данных</div>
          )}
        </div>
      </div>
    </div>
  );
}