import React, { useState } from 'react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, Plus, Edit2, Trash2, Wallet } from 'lucide-react';
import { useAccount } from '@/contexts/AccountContext.jsx';
import { CreateAccountModal, RenameAccountModal, DeleteAccountModal } from '@/components/AccountModals.jsx';

const AccountSwitcher = ({ isMobile = false }) => {
  const { 
    accounts, 
    selectedAccountId, 
    selectAccount, 
    selectAllAccounts, 
    createAccount, 
    renameAccount, 
    deleteAccount 
  } = useAccount();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeAccountAction, setActiveAccountAction] = useState(null);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const displayName = selectedAccountId && selectedAccount ? selectedAccount.accountName : 'All Accounts';

  const handleOpenRename = (e, account) => {
    e.stopPropagation();
    setActiveAccountAction(account);
    setRenameModalOpen(true);
  };

  const handleOpenDelete = (e, account) => {
    e.stopPropagation();
    setActiveAccountAction(account);
    setDeleteModalOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            role="combobox" 
            aria-label="Select account" 
            className={`justify-between gap-2 border-border/50 bg-background/50 hover:bg-muted ${isMobile ? 'w-full' : 'w-[200px]'}`}
          >
            <div className="flex items-center gap-2 truncate">
              <Wallet className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="truncate font-medium">{displayName}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[240px] p-2" align={isMobile ? "center" : "end"}>
          <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            Trading Accounts
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuGroup className="max-h-[300px] overflow-y-auto">
            <DropdownMenuItem 
              onClick={selectAllAccounts}
              className="flex items-center justify-between cursor-pointer rounded-md mb-1 py-2"
            >
              <span className={!selectedAccountId ? "font-medium text-foreground" : "text-muted-foreground"}>
                All Accounts
              </span>
              {!selectedAccountId && <Check className="w-4 h-4 text-primary" />}
            </DropdownMenuItem>

            {accounts.map((account) => (
              <DropdownMenuItem 
                key={account.id}
                onClick={() => selectAccount(account.id)}
                className="flex items-center justify-between cursor-pointer rounded-md mb-1 group py-2"
              >
                <div className="flex items-center gap-2 truncate pr-4">
                  <span className={`truncate ${selectedAccountId === account.id ? "font-medium text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                    {account.accountName}
                  </span>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {selectedAccountId === account.id && <Check className="w-4 h-4 text-primary mr-1" />}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={(e) => handleOpenRename(e, account)}
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={(e) => handleOpenDelete(e, account)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 cursor-pointer text-primary font-medium py-2 rounded-md focus:text-primary focus:bg-primary/10"
          >
            <Plus className="w-4 h-4" />
            Create Account
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateAccountModal 
        isOpen={createModalOpen} 
        onClose={() => setCreateModalOpen(false)} 
        onCreate={createAccount}
      />
      
      <RenameAccountModal 
        isOpen={renameModalOpen} 
        onClose={() => setRenameModalOpen(false)} 
        onRename={renameAccount}
        account={activeAccountAction}
      />

      <DeleteAccountModal 
        isOpen={deleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)} 
        onDelete={deleteAccount}
        account={activeAccountAction}
        availableAccounts={accounts}
      />
    </>
  );
};

export default AccountSwitcher;