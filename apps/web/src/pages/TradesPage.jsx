import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useAccount } from '@/contexts/AccountContext.jsx';
import { useFilters, buildTradeFilterString } from '@/contexts/FilterContext.jsx';
import pb from '@/lib/pocketbaseClient';
import TradeEntryForm from '@/components/TradeEntryForm.jsx';
import EditTradeModal from '@/components/EditTradeModal.jsx';
import FilterBar from '@/components/FilterBar.jsx';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Trash2, Edit, ExternalLink, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { format } from 'date-fns';
import { getTradeGrossProfit, calculateCommissionAmount, calculateNetProfit, calculateStopLossInEuro } from '@/lib/tradeCalculations.js';

const TradesPage = () => {
  const { currentUser } = useAuth();
  const { selectedAccountId, accounts, originalBalances } = useAccount();
  const { filters } = useFilters();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const accountName = selectedAccount ? selectedAccount.accountName : 'All Accounts';

  const currentBalancesMap = accounts.reduce((acc, a) => { acc[a.id] = a.startingBalance; return acc; }, {});

  const fetchTrades = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const filterString = buildTradeFilterString(currentUser.id, filters, selectedAccountId);
      
      const result = await pb.collection('trades').getFullList({
        filter: filterString,
        sort: '-entryDate',
        $autoCancel: false,
      });

      setTrades(result);
    } catch (err) {
      toast.error('Failed to load trades');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTrades();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [currentUser, filters, selectedAccountId]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this trade? This action cannot be undone.')) return;

    try {
      await pb.collection('trades').delete(id, { $autoCancel: false });
      toast.success('Trade deleted');
      fetchTrades();
    } catch (err) {
      toast.error('Failed to delete trade');
    }
  };

  const handleEdit = (trade) => {
    setEditingTrade(trade);
  };

  const handleSaved = () => {
    fetchTrades();
  };

  const handleExportCSV = async () => {
    if (!currentUser) return;
    
    setIsExporting(true);
    try {
      const filterString = buildTradeFilterString(currentUser.id, filters, selectedAccountId);
      const tradesToExport = await pb.collection('trades').getFullList({
        filter: filterString,
        sort: '-entryDate',
        $autoCancel: false
      });

      if (tradesToExport.length === 0) {
        toast.info('No trades found to export');
        setIsExporting(false);
        return;
      }

      const headers = [
        'Account ID',
        'Symbol',
        'Entry Date',
        'Entry Time',
        'Stop Loss (%)',
        'Stop Loss (€)',
        'Stop Loss (Pips)',
        'Risk/Reward Ratio',
        'Status',
        'Profit/Loss',
        'Commission %',
        'RR Secured',
        'Notes',
        'Context URL',
        'Validation URL',
        'Entry URL'
      ];

      const csvRows = [headers.join(',')];

      tradesToExport.forEach(trade => {
        const currBal = currentBalancesMap[trade.accountId] || 10000;
        const monetarySL = calculateStopLossInEuro(currBal, trade.stopLoss);
        const row = [
          `"${trade.accountId || ''}"`,
          `"${trade.symbol || trade.instrument || ''}"`,
          `"${trade.entryDate || trade.date ? format(new Date(trade.entryDate || trade.date), 'yyyy-MM-dd') : ''}"`,
          `"${trade.entryTime || trade.time || ''}"`,
          `"${trade.stopLoss || ''}"`,
          `"${monetarySL.toFixed(2)}"`,
          `"${trade.stopLossPips || ''}"`,
          `"${trade.riskRewardRatio || ''}"`,
          `"${trade.status || ''}"`,
          `"${trade.profitLoss || ''}"`,
          `"${trade.commissionPercentage || ''}"`,
          `"${trade.rrSecured || ''}"`,
          `"${(trade.notes || '').replace(/"/g, '""')}"`,
          `"${trade.contextUrl || ''}"`,
          `"${trade.validationUrl || ''}"`,
          `"${trade.entryUrl || ''}"`
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      link.setAttribute('download', `trades_${accountName.replace(/\s+/g, '_')}_${dateStr}.csv`);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Trades exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export trades');
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (trade) => {
    if (trade.status === 'Win') return <Badge className="status-badge-win">Win</Badge>;
    if (trade.status === 'Loss') return <Badge className="status-badge-loss">Loss</Badge>;
    if (trade.status === 'Breakeven') return <Badge className="status-badge-breakeven">Breakeven</Badge>;
    
    // Fallback to rrSecured if status is not set
    const rr = parseFloat(trade.rrSecured) || 0;
    if (rr >= 1) return <Badge className="status-badge-win">Win</Badge>;
    if (rr < 0) return <Badge className="status-badge-loss">Loss</Badge>;
    return <Badge className="status-badge-breakeven">Breakeven</Badge>;
  };

  const toggleExpandRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <>
      <Helmet>
        <title>Trades - Trading Journal</title>
        <meta name="description" content="View and manage your trading history" />
      </Helmet>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">Trades</h1>
              <Badge variant="secondary" className="font-medium text-sm px-3 py-1 bg-primary/10 text-primary">
                {accountName}
              </Badge>
            </div>
            <p className="text-muted-foreground">Record and manage your trading activity</p>
          </div>
          <Button onClick={handleExportCSV} disabled={isExporting} variant="outline" className="bg-card">
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export to CSV'}
          </Button>
        </div>

        <TradeEntryForm onTradeAdded={fetchTrades} />

        <Card>
          <CardHeader>
            <CardTitle>Filter trades</CardTitle>
            <CardDescription>Narrow down your trade history</CardDescription>
          </CardHeader>
          <CardContent>
            <FilterBar />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trade history</CardTitle>
            <CardDescription>
              {trades.length} {trades.length === 1 ? 'trade' : 'trades'} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : trades.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No trades found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters or add a new trade above.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[10%]">Symbol</TableHead>
                      <TableHead className="w-[10%]">Date</TableHead>
                      <TableHead className="w-[8%]">Time</TableHead>
                      <TableHead className="w-[12%]">SL (%)</TableHead>
                      <TableHead className="w-[8%]">SL (Pips)</TableHead>
                      <TableHead className="w-[8%]">RR</TableHead>
                      <TableHead className="w-[10%]">Commission</TableHead>
                      <TableHead className="w-[10%]">Net P/L</TableHead>
                      <TableHead className="w-[10%]">Status</TableHead>
                      <TableHead className="w-[14%] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trades.map((trade) => {
                      const displayDate = trade.entryDate || trade.date;
                      const displayTime = trade.entryTime || trade.time;
                      const displaySymbol = trade.symbol || trade.instrument;
                      
                      const grossProfit = getTradeGrossProfit(trade, originalBalances, currentBalancesMap);
                      const commission = calculateCommissionAmount(grossProfit, trade.commissionPercentage, originalBalances, currentBalancesMap);
                      const netProfit = calculateNetProfit(grossProfit, trade.commissionPercentage, originalBalances, currentBalancesMap);
                      
                      const currBal = currentBalancesMap[trade.accountId] || 10000;
                      const monetarySL = calculateStopLossInEuro(currBal, trade.stopLoss);
                      
                      return (
                        <React.Fragment key={trade.id}>
                          <TableRow className="trade-row">
                            <TableCell className="font-medium">{displaySymbol}</TableCell>
                            <TableCell>
                              {displayDate ? format(new Date(displayDate), 'MMM dd, yyyy') : '-'}
                            </TableCell>
                            <TableCell>{displayTime || '-'}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span>{trade.stopLoss}%</span>
                                <span className="text-xs text-muted-foreground">€{monetarySL.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                              </div>
                            </TableCell>
                            <TableCell>{trade.stopLossPips || '-'}</TableCell>
                            <TableCell className="font-medium">{trade.rrSecured?.toFixed(2) || '0.00'}R</TableCell>
                            <TableCell className="text-muted-foreground">
                              €{commission.toFixed(2)}
                            </TableCell>
                            <TableCell className={netProfit > 0 ? 'text-emerald-600 font-medium' : netProfit < 0 ? 'text-rose-600 font-medium' : 'text-muted-foreground'}>
                              {netProfit > 0 ? '+' : netProfit < 0 ? '-' : ''}€{Math.abs(netProfit).toFixed(2)}
                            </TableCell>
                            <TableCell>{getStatusBadge(trade)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(trade)}
                                  title="Edit Trade"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(trade.id)}
                                  className="text-destructive hover:text-destructive"
                                  title="Delete Trade"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                                {(trade.contextUrl || trade.validationUrl || trade.entryUrl || trade.notes) && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => toggleExpandRow(trade.id)}
                                    title="View Details"
                                  >
                                    {expandedRow === trade.id ? (
                                      <ChevronUp className="w-4 h-4" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                          {expandedRow === trade.id && (
                            <TableRow className="expanded-row">
                              <TableCell colSpan={10} className="bg-muted/30">
                                <div className="py-4 px-2 space-y-4">
                                  {(trade.contextUrl || trade.validationUrl || trade.entryUrl) && (
                                    <div>
                                      <h4 className="text-sm font-semibold mb-2 text-foreground/80">Screenshots</h4>
                                      <div className="flex flex-wrap gap-4">
                                        {trade.contextUrl && (
                                          <a
                                            href={trade.contextUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="screenshot-link"
                                          >
                                            <ExternalLink className="w-4 h-4" />
                                            Context
                                          </a>
                                        )}
                                        {trade.validationUrl && (
                                          <a
                                            href={trade.validationUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="screenshot-link"
                                          >
                                            <ExternalLink className="w-4 h-4" />
                                            Validation
                                          </a>
                                        )}
                                        {trade.entryUrl && (
                                          <a
                                            href={trade.entryUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="screenshot-link"
                                          >
                                            <ExternalLink className="w-4 h-4" />
                                            Entry
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  {trade.notes && (
                                    <div>
                                      <h4 className="text-sm font-semibold mb-2 text-foreground/80">Notes</h4>
                                      <p className="text-sm text-muted-foreground bg-background/50 p-3 rounded-md border border-border/50">
                                        {trade.notes}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {editingTrade && (
        <EditTradeModal
          trade={editingTrade}
          open={!!editingTrade}
          onClose={() => setEditingTrade(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
};

export default TradesPage;
