import { apiClient, getPagedResult, type Page } from '@/lib/api-client'
import type { AdminWallet, AdminWithdrawal, Wallet, WalletTransaction, WithdrawalRequest, WithdrawalStatus } from '@/types/wallet'

export async function getMyWallet(): Promise<Wallet> {
  return apiClient.get<Wallet>('/wallet/me')
}

export async function listMyTransactions(page = 0, size = 20): Promise<Page<WalletTransaction>> {
  return getPagedResult<WalletTransaction>('/wallet/me/transactions', { page, size })
}

export async function getAdminWallet(userId: string): Promise<AdminWallet> {
  return apiClient.get<AdminWallet>(`/admin/wallets/${userId}`)
}

export async function listAdminWalletTransactions(userId: string, page = 0, size = 20): Promise<Page<WalletTransaction>> {
  return getPagedResult<WalletTransaction>(`/admin/wallets/${userId}/transactions`, { page, size })
}

export interface AdjustWalletBalanceInput {
  direction: 'CREDIT' | 'DEBIT'
  amountMinorUnits: number
  reason: string
}

export async function adjustWalletBalance(userId: string, input: AdjustWalletBalanceInput): Promise<AdminWallet> {
  return apiClient.post<AdminWallet>(`/admin/wallets/${userId}/adjustments`, input)
}

export async function setWalletStatus(userId: string, status: 'ACTIVE' | 'FROZEN', reason?: string): Promise<AdminWallet> {
  return apiClient.patch<AdminWallet>(`/admin/wallets/${userId}/status`, { status, reason })
}

// ---- Withdrawals ----

export async function requestWithdrawal(amountMinorUnits: number, note?: string): Promise<WithdrawalRequest> {
  return apiClient.post<WithdrawalRequest>('/wallet/withdrawals', { amountMinorUnits, note })
}

export async function listMyWithdrawals(page = 0, size = 20): Promise<Page<WithdrawalRequest>> {
  return getPagedResult<WithdrawalRequest>('/wallet/withdrawals', { page, size })
}

export async function cancelWithdrawal(id: string): Promise<WithdrawalRequest> {
  return apiClient.post<WithdrawalRequest>(`/wallet/withdrawals/${id}/cancel`)
}

export async function listAdminWithdrawals(
  params: { status?: WithdrawalStatus; page?: number; size?: number } = {},
): Promise<Page<AdminWithdrawal>> {
  return getPagedResult<AdminWithdrawal>('/admin/withdrawals', { ...params })
}

export async function approveWithdrawal(id: string): Promise<AdminWithdrawal> {
  return apiClient.patch<AdminWithdrawal>(`/admin/withdrawals/${id}/approve`, {})
}

export async function rejectWithdrawal(id: string, reason: string): Promise<AdminWithdrawal> {
  return apiClient.patch<AdminWithdrawal>(`/admin/withdrawals/${id}/reject`, { reason })
}
