import Papa from 'papaparse';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQlYI4z8BpzDhBzugv6AF5mgSRvuljyB0MyxM-tF6kPnmLD8enP6-YYdqsGkgF17xreD6XTgebsSGvh/pub?gid=1557146001&output=csv';

const parseNumber = (str) => {
  if (!str || str === '') return 0;
  const cleaned = str.toString().replace(',', '.').replace('%', '');
  return parseFloat(cleaned) || 0;
};

const formatPercent = (value) => {
  if (!value && value !== 0) return '0%';
  const num = typeof value === 'number' ? value : parseNumber(value);
  return `${num > 0 ? '+' : ''}${num}%`;
};

const fetchCSV = async () => {
  try {
    const response = await fetch(CSV_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    const result = Papa.parse(text, { header: false, skipEmptyLines: true });
    return result.data;
  } catch (error) {
    console.error('Ошибка загрузки CSV:', error);
    return [];
  }};

export const getMetrics = async () => {
  const data = await fetchCSV();
  if (!data.length) {
    return {
      totalIncidents: '0',
      incidentsPerMonth: '0',
      avgDrop: '0%',
      topVictim: 'Нет данных',
      topVictimPercent: '0%'
    };
  }
  return {
    totalIncidents: data[0]?.[1] || '0',
    incidentsPerMonth: data[1]?.[1] || '0',
    avgDrop: data[2]?.[1] || '0%',
    topVictim: data[3]?.[1] || 'Нет данных',
    topVictimPercent: data[4]?.[1] || '0%'
  };
};

export const getTrend = async () => {
  const data = await fetchCSV();
  if (!data.length) return [];

  const trend = [];
  for (let i = 0; i < data.length; i++) {
    const type = data[i][4];
    const impactRaw = data[i][5];

    if (type && type.trim() && impactRaw && impactRaw.trim()) {
      if (type.includes('Тип') || type.includes('ПОСЛЕДНИЕ') || type.includes('ТОП')) continue;
      trend.push({
        type: type.trim(),
        impact: parseNumber(impactRaw)
      });
    }  }  return trend;
};

export const getTopImpact = async () => {
  const data = await fetchCSV();
  if (!data.length) return [];

  const top = [];
  for (let i = 6; i <= 10 && i < data.length; i++) {
    const row = data[i];
    const company = row[0];
    const impact = row[1];

    if (company && company.trim() && !company.includes('ТОП') && !company.includes('ПОСЛЕДНИЕ')) {
      top.push({
        company: company.trim(),
        impact: impact?.trim() || '0%'
      });
    }  }  return top;
};

export const getRecentIncidents = async () => {
  const data = await fetchCSV();
  if (!data.length) return [];

  const incidents = [];
  for (let i = 12; i <= 16 && i < data.length; i++) {
    const row = data[i];
    const company = row[0];
    const ticker = row[1];
    const date = row[2];
    const impact = row[3];

    if (company && company.trim() && !company.includes('ПОСЛЕДНИЕ')) {
      incidents.push({
        company: company.trim(),
        ticker: ticker?.trim() || '',
        date: date?.trim() || '',
        impact: impact?.trim() || '0%'
      });
    }  }  return incidents;
};

export const getStockTypes = async () => {
  const data = await fetchCSV();
  if (!data.length) return ['all'];

  const types = new Set();
  for (let i = 0; i < data.length; i++) {
    const type = data[i][9];
    if (type && type.trim() && !type.includes('Тип') && !type.includes('ПОСЛЕДНИЕ')) {
      types.add(type.trim());
    }  }  return ['all', ...Array.from(types)];
};

export const getAttackTypes = async () => {
  const data = await fetchCSV();
  if (!data.length) return ['all'];

  const types = new Set();
  for (let i = 0; i < data.length; i++) {
    const type = data[i][10];
    if (type && type.trim() && !type.includes('Тип') && !type.includes('ПОСЛЕДНИЕ')) {
      types.add(type.trim());
    }  }  return ['all', ...Array.from(types)];
};

export const getAllIncidents = async () => {
  const data = await fetchCSV();
  if (!data.length) return [];

  const incidents = [];
  let id = 1;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const company = row[11];
    const incidentDate = row[12];

    if (!company || company.trim() === '') continue;
    if (company.includes('Наименование') || company.includes('ПОСЛЕДНИЕ')) continue;

    const prices = [];
    for (let p = 28; p <= 38; p++) {
      prices.push(parseNumber(row[p]));
    }
    const dates = [];
    for (let d = 17; d <= 27; d++) {
      dates.push(row[d]?.trim() || '');
    }
    incidents.push({
      id: id++,
      company: company.trim(),
      date: incidentDate?.trim() || '',
      ticker: row[13]?.trim() || '',
      impact: parseNumber(row[14]),
      impactFormatted: formatPercent(parseNumber(row[14])),
      attackType: row[15]?.trim() || 'Не указан',
      stockType: row[16]?.trim() || 'Не указан',
      chartDates: dates,
      chartPrices: prices,
      priceBefore: prices[0] || 0,
      priceAfter: prices[10] || 0,
      absoluteChange: parseNumber(row[39]),
      relativeChange: row[40]?.trim() || `${incidents.impact}%`,
      country: row[41]?.trim() || 'Не указана',
      exchange: row[42]?.trim() || 'Не указана',
      currency: row[43]?.trim() || 'USD',
      isin: row[44]?.trim() || '',
      title: `${company.trim()} - киберинцидент`,
      description: `${row[15]?.trim() || 'Киберинцидент'} повлиял на капитализацию компании`,
      severity: getSeverityByImpact(parseNumber(row[14])),
      source: 'Google Sheets',
      addedDate: new Date().toISOString().split('T')[0]
    });
  }
  return incidents.sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const getIncidentById = async (id) => {
  const incidents = await getAllIncidents();
  return incidents.find(i => i.id === parseInt(id));
};

const getSeverityByImpact = (impact) => {
  if (impact <= -15) return 'critical';
  if (impact <= -10) return 'high';
  if (impact <= -5) return 'medium';
  return 'low';
};

export const getAllCompanies = async () => {
  const data = await fetchCSV();
  if (!data.length) return [];

  const companies = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const companyName = row[45];
    const ticker = row[46];
    const exchange = row[47];
    const avgImpact = row[48];
    const country = row[49];
    const currency = row[50];
    const totalIncidents = row[51];
    const strongestImpact = row[52];

    if (companyName && companyName.trim() && !companyName.includes('Наименование')) {
      companies.push({
        name: companyName.trim(),
        ticker: ticker?.trim() || '',
        exchange: exchange?.trim() || 'Не указана',
        avgImpact: parseNumber(avgImpact),
        country: country?.trim() || 'Не указана',
        currency: currency?.trim() || 'USD',
        totalIncidents: parseInt(totalIncidents) || 0,
        strongestImpact: parseNumber(strongestImpact)
      });
    }  }
  return companies;
};

export const getCompanyIncidents = async (companyName) => {
  const data = await fetchCSV();
  if (!data.length) return [];

  const incidents = [];
  let id = 1;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const name = row[11];

    if (name && name.trim() === companyName) {
      const date = row[12];
      const impact = row[14];
      const attackType = row[15];
      const priceBefore = row[28];
      const priceAfter = row[38];
      const priceOnDay = row[33];

      const impactNum = parseNumber(impact);

      incidents.push({
        id: id++,
        date: date?.trim() || '',
        type: attackType?.trim() || 'Не указан',
        impact: impactNum,
        impactFormatted: formatPercent(impactNum),
        priceBefore: parseNumber(priceBefore),
        priceAfter: parseNumber(priceAfter),
        priceOnDay: parseNumber(priceOnDay),
        severity: getSeverityByImpact(impactNum)
      });
    }  }
  return incidents.sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const getCompanyPricePoints = async (companyName) => {
  const incidents = await getCompanyIncidents(companyName);

  return incidents.map(incident => ({
    date: incident.date,
    price: incident.priceOnDay,
    impact: incident.impact,
    type: incident.type
  }));
};