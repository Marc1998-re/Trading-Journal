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
import { Trash2, Edit, ExternalLink, ChevronDown, ChevronUp, Download, ListFilter } from 'lucide-react';
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
        'Account ID', 'Symbol', 'Entry Date', 'Entry Time', 'Stop Loss (%)', 'Stop Loss (€)',
        'Stop Loss (Pips)', 'Risk/Reward Ratio', 'Status', 'Profit/Loss', 'Commission %',
        'RR Secured', 'Notes', 'Context URL', 'Validation URL', 'Entry URL'
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
      <main className="desk-shell market-grid">
        <div className="desk-container">
          <section className="command-panel rounded-lg p-5 sm:p-6 lg:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="section-kicker mb-3">Trade operations</p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <h1 className="text-3xl font-black tracking-normal sm:text-5xl">Execution Ledger</h1>
                  <Badge className="w-fit border-primary/30 bg-primary/15 px-3 py-1.5 text-primary hover:bg-primary/20">
                    {accountName}
                  </Badge>
                </div>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Record, filter and audit every trade with a desk-grade workflow.
                </p>
              </div>
              <Button onClick={handleExportCSV} disabled={isExporting} className="h-auto gap-2 bg-primary px-5 py-4 font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90">
                <Download className="w-4 h-4" />
                {isExporting ? 'Exporting...' : 'Export CSV'}
              </Button>
            </div>
          </section>

          <TradeEntryForm onTradeAdded={fetchTrades} />

          <Card className="glass-panel rounded-lg">
            <CardHeader className="border-b border-white/10">
              <p className="section-kicker mb-2">Search layer</p>
              <CardTitle className="flex items-center gap-2 text-2xl font-black">
                <ListFilter className="w-5 h-5 text-primary" />
                Filter Trades
              </CardTitle>
              <CardDescription>Narrow the table by symbol, status and date range</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <FilterBar />
            </CardContent>
          </Card>

          <Card className="command-panel rounded-lg">
            <CardHeader className="flex flex-col gap-3 border-b border-white/10 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="section-kicker mb-2">Ledger table</p>
                <CardTitle className="text-2xl font-black">Trade History</CardTitle>
                <CardDescription>
                  {trades.length} {trades.length === 1 ? 'trade' : 'trades'} found
                </CardDescription>
              </div>
              <Badge className="w-fit border-white/10 bg-white/[0.06] text-foreground hover:bg-white/[0.08]">
                {accountName}
              </Badge>
            </CardHeader>
            <CardContent className="p-0 sm:p-5">
              {loading ? (
                <div className="space-y-4 p-5">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full bg-white/10" />
                  ))}
                </div>
              ) : trades.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No trades found</p>
                  <p className="text-sm text-muted-foreground">Try adjusting your filters or add a new trade above.</p>
                </div>
              ) : (
                <div className="terminal-table overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-white/[0.04]">
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>SL (%)</TableHead>
                        <TableHead>SL (Pips)</TableHead>
                        <TableHead>RR</TableHead>
                        <TableHead>Commission</TableHead>
                        <TableHead>Net P/L</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
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
                              <TableCell className="font-black text-foreground">{displaySymbol}</TableCell>
                              <TableCell>{displayDate ? format(new Date(displayDate), 'MMM dd, yyyy') : '-'}</TableCell>
                              <TableCell>{displayTime || '-'}</TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span>{trade.stopLoss}%</span>
                                  <span className="text-xs text-muted-foreground">€{monetarySL.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                </div>
                              </TableCell>
                              <TableCell>{trade.stopLossPips || '-'}</TableCell>
                              <TableCell className={`font-black ${(trade.rrSecured || 0) > 0 ? 'text-success' : (trade.rrSecured || 0) < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                {Number(trade.rrSecured || 0).toFixed(2)}R
                              </TableCell>
                              <TableCell className="text-muted-foreground">€{commission.toFixed(2)}</TableCell>
                              <TableCell className={netProfit > 0 ? 'text-success font-black' : netProfit < 0 ? 'text-destructive font-black' : 'text-muted-foreground'}>
                                {netProfit > 0 ? '+' : netProfit < 0 ? '-' : ''}€{Math.abs(netProfit).toFixed(2)}
                              </TableCell>
                              <TableCell>{getStatusBadge(trade)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => setEditingTrade(trade)} title="Edit Trade" className="hover:bg-white/[0.06]">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleDelete(trade.id)} className="text-destructive hover:bg-destructive/10 hover:text-destructive" title="Delete Trade">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                  {(trade.contextUrl || trade.validationUrl || trade.entryUrl || trade.notes) && (
                                    <Button variant="ghost" size="icon" onClick={() => toggleExpandRow(trade.id)} title="View Details" className="hover:bg-white/[0.06]">
                                      {expandedRow === trade.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                            {expandedRow === trade.id && (
                              <TableRow className="expanded-row">
                                <TableCell colSpan={10} className="bg-black/20">
                                  <div className="space-y-4 px-2 py-4">
                                    {(trade.contextUrl || trade.validationUrl || trade.entryUrl) && (
                                      <div>
                                        <h4 className="mb-2 text-sm font-semibold text-foreground/80">Screenshots</h4>
                                        <div className="flex flex-wrap gap-3">
                                          {trade.contextUrl && <a href={trade.contextUrl} target="_blank" rel="noopener noreferrer" className="screenshot-link"><ExternalLink className="w-4 h-4" />Context</a>}
                                          {trade.validationUrl && <a href={trade.validationUrl} target="_blank" rel="noopener noreferrer" className="screenshot-link"><ExternalLink className="w-4 h-4" />Validation</a>}
                                          {trade.entryUrl && <a href={trade.entryUrl} target="_blank" rel="noopener noreferrer" className="screenshot-link"><ExternalLink className="w-4 h-4" />Entry</a>}
                                        </div>
                                      </div>
                                    )}
                                    {trade.notes && (
                                      <div>
                                        <h4 className="mb-2 text-sm font-semibold text-foreground/80">Notes</h4>
                                        <p className="rounded-md border border-white/10 bg-black/25 p-3 text-sm text-muted-foreground">{trade.notes}</p>
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
      </main>

      {editingTrade && (
        <EditTradeModal
          trade={editingTrade}
          open={!!editingTrade}
          onClose={() => setEditingTrade(null)}
          onSaved={fetchTrades}
        />
      )}
    </>
  );
};

export default TradesPage;
