export type WalletStatus = 'ACTIVE' | 'FROZEN'
export type WalletTransactionType = 'CREDIT' | 'DEBIT'
export type WalletTransactionStatus = 'COMPLETED'
export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export interface Wallet {
  id: string
  currency: string
  balanceMinorUnits: number
  status: WalletStatus
  createdAt: string
  updatedAt: string
}

export interface WalletTransaction {
  id: string
  type: WalletTransactionType
  amountMinorUnits: number
  currency: string
  status: WalletTransactionStatus
  referenceType: string | null
  referenceId: string | null
  description: string | null
  createdAt: string
  completedAt: string | null
}

export interface AdminWallet extends Wallet {
  userId: string
  userName: string | null
  userEmail: string | null
}

export interface WithdrawalRequest {
  id: string
  amountMinorUnits: number
  currency: string
  note: string | null
  status: WithdrawalStatus
  decisionNote: string | null
  createdAt: string
  decidedAt: string | null
}

export interface AdminWithdrawal extends WithdrawalRequest {
  userId: string
  userName: string | null
  userEmail: string | null
  decidedByAdminId: string | null
}
