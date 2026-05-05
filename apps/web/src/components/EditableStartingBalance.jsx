import React, { useState, useEffect } from 'react';
import { Pencil, Save, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const EditableStartingBalance = ({ accounts, selectedAccountId, onSave }) => {
  const isAllAccounts = !selectedAccountId;
  const currentAccount = accounts.find(a => a.id === selectedAccountId);
  const displayBalance = isAllAccounts
    ? accounts.reduce((sum, a) => sum + (Number(a.startingBalance) || 0), 0)
    : (currentAccount?.startingBalance || 10000);

  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(displayBalance.toString());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setValue(displayBalance.toString());
    setIsEditing(false);
  }, [displayBalance, selectedAccountId]);

  const handleSave = async () => {
    if (isAllAccounts) return;
    
    const numVal = parseFloat(value);
    if (isNaN(numVal) || numVal <= 0) {
      toast.error('Please enter a valid positive number');
      return;
    }
    
    setIsSaving(true);
    try {
      await onSave(selectedAccountId, numVal);
      setIsEditing(false);
    } catch (error) {
      setValue(displayBalance.toString());
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setValue(displayBalance.toString());
  };

  if (isAllAccounts) {
    return (
      <div className="metric-card bg-accent/10 border-accent/20 text-accent-foreground group transition-all duration-300">
        <div className="flex justify-between items-start mb-1">
          <p className="metric-label flex items-center gap-2 text-accent-foreground/80">
            Total Starting Balance
          </p>
        </div>
        <p className="metric-value">${parseFloat(displayBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        <p className="text-xs text-accent-foreground/60 mt-2">Combined across all accounts</p>
      </div>
    );
  }

  if (!isEditing) {
    return (
      <div 
        className="metric-card bg-accent/10 border-accent/20 text-accent-foreground hover:shadow-accent/10 group cursor-pointer transition-all duration-300" 
        onClick={() => setIsEditing(true)}
      >
        <div className="flex justify-between items-start mb-1">
          <p className="metric-label flex items-center gap-2 text-accent-foreground/80">
            Starting Balance
            <Pencil className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </div>
        <p className="metric-value">${parseFloat(displayBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        <p className="text-xs text-accent-foreground/60 mt-2">{currentAccount?.accountName}</p>
      </div>
    );
  }

  return (
    <div className="metric-card bg-accent/15 border-accent/30 shadow-md ring-1 ring-accent/20">
      <div className="flex justify-between items-center mb-3">
        <p className="metric-label text-accent-foreground/90">Set Account Balance</p>
        <button onClick={handleCancel} className="text-accent-foreground/50 hover:text-accent-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-foreground/50 font-medium">$</span>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="pl-8 h-10 bg-background/80 border-accent/30 focus-visible:ring-accent text-foreground font-medium"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
          />
        </div>
        <Button 
          size="sm" 
          onClick={handleSave} 
          disabled={isSaving} 
          className="h-10 px-4 bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default EditableStartingBalance;