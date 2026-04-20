import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllIncidents, getStockTypes, getAttackTypes } from './services/googleSheets';
import './Incidents.css';

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [filteredIncidents, setFilteredIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockTypes, setStockTypes] = useState(['all']);
  const [attackTypes, setAttackTypes] = useState(['all']);

  const [filters, setFilters] = useState({
    stockType: 'all',
    attackType: 'all',
    date: 'all',
    impact: 'all'
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [incidentsData, stocks, attacks] = await Promise.all([
          getAllIncidents(),
          getStockTypes(),
          getAttackTypes()
        ]);

        setIncidents(incidentsData);
        setFilteredIncidents(incidentsData);
        setStockTypes(stocks);
        setAttackTypes(attacks);

      } catch (error) {
        console.error('Ошибка загрузки:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    let filtered = [...incidents];

    if (searchTerm) {
      filtered = filtered.filter(incident =>
        incident.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filters.stockType !== 'all') {
      filtered = filtered.filter(incident => incident.stockType === filters.stockType);
    }
    if (filters.attackType !== 'all') {
      filtered = filtered.filter(incident => incident.attackType === filters.attackType);
    }
    if (filters.date !== 'all') {
      const now = new Date();
      const days = parseInt(filters.date);
      const cutoffDate = new Date(now.setDate(now.getDate() - days));
      filtered = filtered.filter(incident => new Date(incident.date) >= cutoffDate);
    }
    if (filters.impact !== 'all') {
      filtered = filtered.filter(incident => {
        switch (filters.impact) {
          case 'critical': return incident.impact <= -15;
          case 'high': return incident.impact > -15 && incident.impact <= -10;
          case 'medium': return incident.impact > -10 && incident.impact <= -5;
          case 'low': return incident.impact > -5;
          default: return true;
        }
      });
    }
    setFilteredIncidents(filtered);
    setCurrentPage(1);
  }, [searchTerm, filters, incidents]);

  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedIncidents = filteredIncidents.slice(startIndex, startIndex + itemsPerPage);

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

  if (loading) {
    return (
      <div className="incidents-page loading">
        <div className="loader">Загрузка инцидентов...</div>
      </div>
    );
  }
  return (
    <div className="incidents-page">
      <div className="incidents-header">
        <h1 className="page-title">📋 Инциденты</h1>
      </div>

      <div className="filters-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Поиск по компании, тикеру или описанию..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="filters-row">
          <select
            value={filters.stockType}
            onChange={(e) => setFilters({ ...filters, stockType: e.target.value })}
            className="filter-select"
          >
            {stockTypes.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'Все типы акций' : type}
              </option>
            ))}
          </select>

          <select
            value={filters.attackType}
            onChange={(e) => setFilters({ ...filters, attackType: e.target.value })}
            className="filter-select"
          >
            {attackTypes.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'Все типы атак' : type}
              </option>
            ))}
          </select>

          <select
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            className="filter-select"
          >
            <option value="all">Все даты</option>
            <option value="30">Последние 30 дней</option>
            <option value="90">Последние 90 дней</option>
            <option value="365">Последний год</option>
          </select>

          <select
            value={filters.impact}
            onChange={(e) => setFilters({ ...filters, impact: e.target.value })}
            className="filter-select"
          >
            <option value="all">Все уровни</option>
            <option value="critical">Критический (≤ -15%)</option>
            <option value="high">Высокий (-15% до -10%)</option>
            <option value="medium">Средний (-10% до -5%)</option>
            <option value="low">Низкий (&gt; -5%)</option>
          </select>
        </div>
      </div>

      <div className="incidents-list">
        {paginatedIncidents.length > 0 ? (
          paginatedIncidents.map((incident) => {
            const severity = getSeverityInfo(incident.severity, incident.impact);
            return (
              <div key={incident.id} className="incident-card">
                <div className="incident-card-header">
                  <div className="incident-title">
                    <span className="incident-id">ИНЦИДЕНТ #{incident.id.toString().padStart(3, '0')}</span>
                    <span className="incident-company">{incident.company}</span>
                  </div>
                  <Link to={`/analysis/${incident.id}`} className="analyze-btn">
                    Анализ →
                  </Link>
                </div>

                <div className="incident-card-content">
                  <div className="incident-details">
                    <div className="detail-item">
                      <span className="detail-icon">📅</span>
                      <span className="detail-text">{formatDate(incident.date)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">🏷️</span>
                      <span className="detail-text">{incident.ticker || '—'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">📉</span>
                      <span className={`detail-text ${getImpactClass(incident.impact)}`}>
                        {incident.impact > 0 ? `+${incident.impact}%` : `${incident.impact}%`}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className={`severity-badge ${severity.class}`}>
                        {severity.icon} {severity.label}
                      </span>
                    </div>
                  </div>

                  <div className="incident-meta">
                    <span className="meta-badge">⚔️ {incident.attackType}</span>
                    <span className="meta-badge">📊 {incident.stockType}</span>
                  </div>

                  <p className="incident-description">{incident.description}</p>

                  <div className="incident-footer">
                    <span className="incident-source">Источник: {incident.source}</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="no-incidents">
            <p>😕 Инциденты не найдены</p>
            <p className="no-incidents-sub">Попробуйте изменить параметры фильтрации</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            &lt;
          </button>

          {[...Array(Math.min(5, totalPages))].map((_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            &gt;
          </button>

          <span className="pagination-info">
            Показано: {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredIncidents.length)} из {filteredIncidents.length}
          </span>
        </div>
      )}
    </div>
  );
}