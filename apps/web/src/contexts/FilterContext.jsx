import React, { createContext, useContext, useState } from 'react';

const FilterContext = createContext(null);

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};

export const FilterProvider = ({ children }) => {
  const [filters, setFiltersState] = useState({
    symbol: '',
    startDate: '',
    endDate: '',
    status: 'All',
  });

  const setFilters = (newFilters) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFiltersState({
      symbol: '',
      startDate: '',
      endDate: '',
      status: 'All',
    });
  };

  const isFiltersActive = () => {
    return (
      filters.symbol !== '' ||
      filters.startDate !== '' ||
      filters.endDate !== '' ||
      filters.status !== 'All'
    );
  };

  return (
    <FilterContext.Provider value={{ filters, setFilters, clearFilters, isFiltersActive }}>
      {children}
    </FilterContext.Provider>
  );
};

export const buildTradeFilterString = (userId, filters, accountId = null) => {
  let filterParts = [`userId = "${userId}"`];

  if (accountId) {
    filterParts.push(`accountId = "${accountId}"`);
  }

  if (filters.symbol) {
    // Case-insensitive match for symbol or instrument
    filterParts.push(`(symbol ~ "${filters.symbol}" || instrument ~ "${filters.symbol}")`);
  }
  
  if (filters.startDate) {
    filterParts.push(`(entryDate >= "${filters.startDate} 00:00:00.000Z" || date >= "${filters.startDate} 00:00:00.000Z")`);
  }
  
  if (filters.endDate) {
    filterParts.push(`(entryDate <= "${filters.endDate} 23:59:59.999Z" || date <= "${filters.endDate} 23:59:59.999Z")`);
  }
  
  if (filters.status !== 'All') {
    if (filters.status === 'Win') {
      filterParts.push(`(status = 'Win' || rrSecured >= 1)`);
    } else if (filters.status === 'Loss') {
      filterParts.push(`(status = 'Loss' || rrSecured < 0)`);
    } else if (filters.status === 'Breakeven') {
      filterParts.push(`(status = 'Breakeven' || (rrSecured >= 0 && rrSecured < 1))`);
    }
  }

  return filterParts.join(' && ');
};