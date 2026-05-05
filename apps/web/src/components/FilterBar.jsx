import React from 'react';
import { useFilters } from '@/contexts/FilterContext.jsx';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';

const FilterBar = () => {
  const { filters, setFilters, clearFilters, isFiltersActive } = useFilters();

  const handleChange = (field, value) => {
    setFilters({ [field]: value });
  };

  const activeFiltersCount = [
    filters.symbol,
    filters.startDate,
    filters.endDate,
    filters.status !== 'All' ? filters.status : null,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Filters</h3>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount} active
            </Badge>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
            <X className="w-4 h-4" />
            Clear all
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="symbol">Symbol</Label>
          <Input
            id="symbol"
            value={filters.symbol}
            onChange={(e) => handleChange('symbol', e.target.value)}
            placeholder="EUR/USD"
            className="bg-background text-foreground"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate">Start date</Label>
          <Input
            id="startDate"
            type="date"
            value={filters.startDate}
            onChange={(e) => handleChange('startDate', e.target.value)}
            className="bg-background text-foreground"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">End date</Label>
          <Input
            id="endDate"
            type="date"
            value={filters.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
            className="bg-background text-foreground"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={filters.status} onValueChange={(value) => handleChange('status', value)}>
            <SelectTrigger className="bg-background text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Win">Win</SelectItem>
              <SelectItem value="Loss">Loss</SelectItem>
              <SelectItem value="Breakeven">Breakeven</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.symbol && (
            <Badge variant="secondary" className="gap-2 filter-badge">
              Symbol: {filters.symbol}
              <button onClick={() => handleChange('symbol', '')} className="hover:text-foreground">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.startDate && (
            <Badge variant="secondary" className="gap-2 filter-badge">
              From: {filters.startDate}
              <button onClick={() => handleChange('startDate', '')} className="hover:text-foreground">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.endDate && (
            <Badge variant="secondary" className="gap-2 filter-badge">
              To: {filters.endDate}
              <button onClick={() => handleChange('endDate', '')} className="hover:text-foreground">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.status !== 'All' && (
            <Badge variant="secondary" className="gap-2 filter-badge">
              Status: {filters.status}
              <button onClick={() => handleChange('status', 'All')} className="hover:text-foreground">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterBar;