import { create } from "zustand";

const useWalletsStore = create((set) => ({
  wallets: [],

  transactions: [],

  stats: {
    totalTransactions: 0,
    suspiciousWallets: 0,
    highRiskWallets: 0,
    totalVolume: 0,
    uniqueWallets: 0,
    uniqueIPs: 0,
  },

  alerts: [],

  selectedFile: null,

  datasetName: null,

  setWallets: (wallets) =>
    set({
      wallets: Array.isArray(wallets)
        ? wallets
        : [],
    }),

  setTransactions: (transactions) =>
    set({
      transactions: Array.isArray(
        transactions
      )
        ? transactions
        : [],
    }),

  setStats: (stats) =>
    set({
      stats: {
        totalTransactions: 0,
        suspiciousWallets: 0,
        highRiskWallets: 0,
        totalVolume: 0,
        uniqueWallets: 0,
        uniqueIPs: 0,
        ...(stats || {}),
      },
    }),

  setAlerts: (alerts) =>
    set({
      alerts: Array.isArray(alerts)
        ? alerts
        : [],
    }),

  setSelectedFile: (file) =>
    set({
      selectedFile: file || null,
      datasetName:
        file?.name || null,
    }),

  clearData: () =>
    set({
      wallets: [],
      transactions: [],
      alerts: [],
      selectedFile: null,
      datasetName: null,

      stats: {
        totalTransactions: 0,
        suspiciousWallets: 0,
        highRiskWallets: 0,
        totalVolume: 0,
        uniqueWallets: 0,
        uniqueIPs: 0,
      },
    }),
}));

export default useWalletsStore;