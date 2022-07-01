import React, { ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { TransactionStatus } from "../models/enums";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useAccountsContext } from "./accounts";
import { TokenInfo, TokenListProvider } from "@solana/spl-token-registry";
import { TransactionStatusInfo } from "../models/transactions";
import { BANNED_TOKENS, DEDICATED_FREE_FAST_RPC, MONEY_STREAMING_PROGRAM_ADDRESS, PRICE_REFRESH_TIMEOUT, STREAMS_REFRESH_TIMEOUT } from "../constants";
import { findATokenAddress, getChainIdByClusterName } from "../helpers/common";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { MSP, Stream, StreamActivity } from "@mean-dao/msp";
import { initialSummary, StreamsSummary } from "../models/streams";
import { getPrices } from "../helpers/api";
import { shortenAddress } from "../helpers/ui";

export interface AppStateProviderProps {
  children: ReactNode;
  network: WalletAdapterNetwork;
  endpoint: string;
}

interface AppStateConfig {
  connection: Connection;
  network: WalletAdapterNetwork;
  endpoint: string;
  detailsPanelOpen: boolean;
  tokenList: TokenInfo[];
  selectedToken: TokenInfo | undefined;
  tokenBalance: number;
  effectiveRate: number;
  coinPrices: any | null;
  loadingPrices: boolean;
  transactionStatus: TransactionStatusInfo;
  loadingStreams: boolean;
  streamList: Array<Stream> | undefined;
  selectedStream: Stream | undefined;
  streamDetail: Stream | undefined;
  highLightableStreamId: string | undefined;
  streamProgramAddress: string;
  loadingStreamActivity: boolean;
  streamActivity: StreamActivity[];
  hasMoreStreamActivity: boolean;
  streamsSummary: StreamsSummary;
  lastStreamsSummary: StreamsSummary;
  loadingStreamsSummary: boolean;
  getTokenByMintAddress: (address: string) => TokenInfo | undefined;
  setDtailsPanelOpen: (state: boolean) => void;
  setSelectedToken: (token: TokenInfo | undefined) => void;
  setSelectedTokenBalance: (balance: number) => void;
  refreshPrices: () => void;
  setEffectiveRate: (rate: number) => void;
  setCoinPrices: (prices: any) => void;
  refreshTokenBalance: () => void;
  resetStreamsState: () => void;
  refreshStreamList: (reset?: boolean) => void;
  setTransactionStatus: (status: TransactionStatusInfo) => void;
  setStreamList: (list: Array<Stream> | undefined) => void;
  setSelectedStream: (stream: Stream | undefined) => void;
  setStreamDetail: (stream: Stream | undefined) => void;
  setHighLightableStreamId: (id: string | undefined) => void,
  getStreamActivity: (streamId: string, version: number) => void;
  setStreamsSummary: (summary: StreamsSummary) => void;
  setLastStreamsSummary: (summary: StreamsSummary) => void;
  setLoadingStreamsSummary: (state: boolean) => void;
}

const contextDefaultValues: AppStateConfig = {
  connection: null,
  network: WalletAdapterNetwork.Mainnet,
  endpoint: DEDICATED_FREE_FAST_RPC,
  detailsPanelOpen: false,
  tokenList: [],
  selectedToken: undefined,
  tokenBalance: 0,
  effectiveRate: 0,
  coinPrices: null,
  loadingPrices: false,
  transactionStatus: {
    lastOperation: TransactionStatus.Iddle,
    currentOperation: TransactionStatus.Iddle
  },
  loadingStreams: false,
  streamList: undefined,
  selectedStream: undefined,
  streamDetail: undefined,
  highLightableStreamId: undefined,
  streamProgramAddress: '',
  loadingStreamActivity: false,
  streamActivity: [],
  hasMoreStreamActivity: true,
  streamsSummary: initialSummary,
  lastStreamsSummary: initialSummary,
  loadingStreamsSummary: false,
  getTokenByMintAddress: () => undefined,
  setDtailsPanelOpen: () => {},
  setSelectedToken: () => {},
  setSelectedTokenBalance: () => {},
  refreshPrices: () => {},
  setEffectiveRate: () => {},
  setCoinPrices: () => {},
  refreshTokenBalance: () => {},
  resetStreamsState: () => {},
  refreshStreamList: () => {},
  setTransactionStatus: () => {},
  setStreamList: () => {},
  setSelectedStream: () => {},
  setStreamDetail: () => {},
  setHighLightableStreamId: () => {},
  getStreamActivity: () => {},
  setStreamsSummary: () => {},
  setLastStreamsSummary: () => {},
  setLoadingStreamsSummary: () => {},
};

export const AppStateContext = React.createContext<AppStateConfig>(contextDefaultValues);

const AppStateProvider: React.FC<AppStateProviderProps> = (props) => {
  // Parent contexts
  const network = props.network;
  const endpoint = props.endpoint;
  const { publicKey, connected } = useWallet();
  const accounts = useAccountsContext();
  const [streamProgramAddress, setStreamProgramAddress] = useState('');
  const streamProgramAddressFromConfig = MONEY_STREAMING_PROGRAM_ADDRESS;

  if (!streamProgramAddress) {
    setStreamProgramAddress(streamProgramAddressFromConfig);
  }

  const connection = useMemo(() => new Connection(endpoint, "confirmed"), [endpoint]);

  // Create and cache Money Streaming Program instance
  const msp = useMemo(() => {
    if (publicKey) {
      console.log('endpoint:', endpoint);
      console.log('network:', network);
      console.log('connection.getVersion():', connection.getVersion());
      console.log('MSP instance from appState');
      return new MSP(
        endpoint,
        streamProgramAddressFromConfig,
        "finalized"
      );
    }
  }, [
    network,
    endpoint,
    publicKey,
    connection,
    streamProgramAddressFromConfig
  ]);

  const [detailsPanelOpen, updateDetailsPanelOpen] = useState(contextDefaultValues.detailsPanelOpen);
  const [transactionStatus, updateTransactionStatus] = useState<TransactionStatusInfo>(contextDefaultValues.transactionStatus);
  const [tokenList, updateTokenlist] = useState<TokenInfo[]>(contextDefaultValues.tokenList);
  const [loadingStreams, updateLoadingStreams] = useState(contextDefaultValues.loadingStreams);
  const [loadingStreamActivity, setLoadingStreamActivity] = useState(contextDefaultValues.loadingStreamActivity);
  const [streamActivity, setStreamActivity] = useState<StreamActivity[]>(contextDefaultValues.streamActivity);
  const [hasMoreStreamActivity, setHasMoreStreamActivity] = useState<boolean>(contextDefaultValues.hasMoreStreamActivity);
  const [streamList, setStreamList] = useState<Array<Stream> | undefined>(contextDefaultValues.streamList);
  const [selectedStream, updateSelectedStream] = useState<Stream | undefined>(contextDefaultValues.selectedStream);
  const [streamDetail, updateStreamDetail] = useState<Stream | undefined>(contextDefaultValues.streamDetail);
  const [highLightableStreamId, setHighLightableStreamId] = useState<string | undefined>(contextDefaultValues.highLightableStreamId);
  const [streamsSummary, setStreamsSummary] = useState<StreamsSummary>(contextDefaultValues.streamsSummary);
  const [lastStreamsSummary, setLastStreamsSummary] = useState<StreamsSummary>(contextDefaultValues.lastStreamsSummary);
  const [loadingStreamsSummary, setLoadingStreamsSummary] = useState(contextDefaultValues.loadingStreamsSummary);
  const [selectedToken, updateSelectedToken] = useState<TokenInfo>(contextDefaultValues.selectedToken);
  const [tokenBalance, updateTokenBalance] = useState<number>(contextDefaultValues.tokenBalance);
  const [coinPrices, setCoinPrices] = useState<any>(contextDefaultValues.coinPrices);
  const [loadingPrices, setLoadingPrices] = useState<boolean>(contextDefaultValues.loadingPrices);
  const [effectiveRate, updateEffectiveRate] = useState<number>(contextDefaultValues.effectiveRate);
  const [shouldLoadCoinPrices, setShouldLoadCoinPrices] = useState(true);
  const [shouldUpdateToken, setShouldUpdateToken] = useState<boolean>(true);

  const setDtailsPanelOpen = (state: boolean) => {
    updateDetailsPanelOpen(state);
  }

  const getTokenByMintAddress = useCallback((address: string): TokenInfo | undefined => {
    if (tokenList) {
      const tokenFromTokenList = tokenList.find(t => t.address === address);
      if (tokenFromTokenList) {
        return tokenFromTokenList;
      }
    }
    const unkToken: TokenInfo = {
      address: address,
      name: 'Unknown',
      chainId: 101,
      decimals: 6,
      logoURI: undefined,
      symbol: shortenAddress(address),
    };

    return unkToken;
  }, [tokenList]);

  const setTransactionStatus = (status: TransactionStatusInfo) => {
    updateTransactionStatus(status);
  }

  const resetStreamsState = () => {
    setStreamList(contextDefaultValues.streamList);
    setStreamActivity(contextDefaultValues.streamActivity);
    setStreamDetail(contextDefaultValues.streamDetail);
    updateSelectedStream(contextDefaultValues.selectedStream);
    setLoadingStreamActivity(contextDefaultValues.loadingStreamActivity);
    setHasMoreStreamActivity(contextDefaultValues.hasMoreStreamActivity);
  }

  const setSelectedToken = (token: TokenInfo | undefined) => {
    updateSelectedToken(token);
    setShouldUpdateToken(true);
  }

  const setSelectedTokenBalance = (balance: number) => {
    updateTokenBalance(balance);
  }

  const setEffectiveRate = (rate: number) => {
    updateEffectiveRate(rate);
  }

  // Fetch coin prices
  const getCoinPrices = useCallback(async () => {
    try {
      const prices = await getPrices();
      if (prices) {
        console.log("Coin prices:", prices);
        setCoinPrices(prices);
        if (selectedToken) {
          const tokenSymbol = selectedToken.symbol.toUpperCase();
          const symbol = tokenSymbol[0] === 'W' ? tokenSymbol.slice(1) : tokenSymbol;
          updateEffectiveRate(
            prices[symbol] ? prices[symbol] : 0
          );
        }
      } else {
        setCoinPrices(null);
      }
      setLoadingPrices(false);
    } catch (error) {
      setCoinPrices(null);
      setLoadingPrices(false);
    }
  },[selectedToken]);

  // Reload coin price list on demmand
  const refreshPrices = useCallback(() => {
    setLoadingPrices(true);
    getCoinPrices();
  }, [getCoinPrices]);

  // Reload coin prices every 10 min
  useEffect(() => {
    let coinTimer: any;

    if (shouldLoadCoinPrices) {
      setShouldLoadCoinPrices(false);
      setLoadingPrices(true);
      getCoinPrices();
    }

    coinTimer = window.setInterval(() => {
      console.log(`Refreshing prices past ${PRICE_REFRESH_TIMEOUT / 60 / 1000}min...`);
      setLoadingPrices(true);
      getCoinPrices();
    }, PRICE_REFRESH_TIMEOUT);

    // Return callback to run on unmount.
    return () => {
      if (coinTimer) {
        window.clearInterval(coinTimer);
      }
    };
  }, [
    coinPrices,
    shouldLoadCoinPrices,
    getCoinPrices
  ]);

  // Load token list
  useEffect(() => {
    (async () => {
      const res = await new TokenListProvider().resolve();
      const mainnetList = res
        .filterByChainId(getChainIdByClusterName(network))
        .excludeByTag("nft")
        .getList();
      // Filter out the banned tokens
      const filteredTokens = mainnetList.filter(t => !BANNED_TOKENS.some(bt => bt === t.symbol));
      // Sort the big list
      const sortedMainnetList = filteredTokens.sort((a, b) => {
        var nameA = a.symbol.toUpperCase();
        var nameB = b.symbol.toUpperCase();
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
        // names must be equal
        return 0;
      });

      updateTokenlist(sortedMainnetList);
    })();

    return () => { }

  }, [network]);

  // Refresh user token balance on demmand
  const refreshTokenBalance = useCallback(async () => {

    if (!connection || !publicKey || !tokenList || !accounts || !accounts.tokenAccounts || !accounts.tokenAccounts.length) {
      return;
    }

    const getTokenAccountBalanceByAddress = async (address: string): Promise<number> => {
      if (!address) return 0;
      try {
        const accountInfo = await connection.getAccountInfo(address.toPublicKey());
        if (!accountInfo) return 0;
        if (address === publicKey?.toBase58()) {
          return accountInfo.lamports / LAMPORTS_PER_SOL;
        }
        const tokenAmount = (await connection.getTokenAccountBalance(address.toPublicKey())).value;
        return tokenAmount.uiAmount || 0;
      } catch (error) {
        console.error(error);
        throw(error);
      }
    }

    if (!selectedToken) return;

    let balance = 0;
    const selectedTokenAddress = await findATokenAddress(publicKey as PublicKey, selectedToken.address.toPublicKey());
    balance = await getTokenAccountBalanceByAddress(selectedTokenAddress.toBase58());
    updateTokenBalance(balance);

  }, [
    accounts,
    connection,
    publicKey,
    selectedToken,
    tokenList
  ]);

  // Effect to refresh token balance if needed
  useEffect(() => {

    if (!publicKey || !accounts || !accounts.tokenAccounts || !accounts.tokenAccounts.length) {
      return;
    }

    if (shouldUpdateToken) {
      setShouldUpdateToken(false);
      refreshTokenBalance();
    }

    return () => {};

  }, [
    accounts,
    publicKey,
    shouldUpdateToken,
    refreshTokenBalance
  ]);

  const setSelectedStream = (stream: Stream | undefined) => {
    updateSelectedStream(stream);
    updateStreamDetail(stream);
    if (stream) {
      msp.getStream(new PublicKey(stream.id as string))
        .then((detail: Stream) => {
          console.log('detail:', detail);
          if (detail) {
            if (detail.id !== streamDetail?.id) {
              setTimeout(() => {
                setStreamActivity([]);
                setHasMoreStreamActivity(true);
                setLoadingStreamActivity(true);
              });
              getStreamActivity(detail.id as string, detail.version, true);
            }
            updateStreamDetail(detail);
            updateSelectedStream(detail);
            const token = getTokenByMintAddress(detail.associatedToken as string);
            setSelectedToken(token);
          }
        })
        .catch((error: any) => {
          console.error(error);
          setStreamActivity([]);
          setHasMoreStreamActivity(false);
        });
    } else {
      setStreamActivity([]);
      setHasMoreStreamActivity(false);
    }
  }

  const setStreamDetail = (stream: Stream | undefined) => {
    updateStreamDetail(stream);
  }

  const getStreamActivity = useCallback((streamId: string, version: number, clearHistory = false) => {
    if (!connected || !streamId || !msp) { return; }

    if (!loadingStreamActivity) {

      console.log('Loading stream activity...');

      setLoadingStreamActivity(true);
      const streamPublicKey = new PublicKey(streamId);

      const before = clearHistory
        ? ''
        : streamActivity && streamActivity.length > 0
          ? streamActivity[streamActivity.length - 1].signature
          : '';
      console.log('before:', before);
      msp.listStreamActivity(streamPublicKey, before, 5)
        .then((value: StreamActivity[]) => {
          console.log('activity:', value);
          const activities = clearHistory
            ? []
            : streamActivity && streamActivity.length > 0
              ? JSON.parse(JSON.stringify(streamActivity)) // Object.assign({}, streamActivity)
              : [];

          if (value && value.length > 0) {
            activities.push(...value);
            setHasMoreStreamActivity(true);
          } else {
            setHasMoreStreamActivity(false);
          }
          setStreamActivity(activities);
          setLoadingStreamActivity(false);
        })
        .catch(err => {
          console.error(err);
          setStreamActivity([]);
          setHasMoreStreamActivity(false);
          setLoadingStreamActivity(false);
        });
    }

  }, [
    msp,
    connected,
    streamActivity,
    loadingStreamActivity
  ]);

  // Refresh streams list on demmand
  const refreshStreamList = useCallback((reset = false) => {
    if (!publicKey || loadingStreams || !msp) {
      return;
    }

    setTimeout(() => {
      updateLoadingStreams(true);
    });

    console.log("map...")
    msp?.listStreams({treasurer: publicKey, beneficiary: publicKey})
      .then(streams => {
        console.log("in map!")
        const rawStreams = streams;
        console.log("rawStreams", rawStreams);
        const sortedStreams = rawStreams.sort((a, b) => (a.createdBlockTime < b.createdBlockTime) ? 1 : -1);
        console.log('Sorted Streams:', sortedStreams);
        
        console.log("here... 2")
        // Sort debugging block
        const debugTable: any[] = [];
        rawStreams.forEach(item => debugTable.push({
          createdBlockTime: item.createdBlockTime,
          name: item.name.trim(),
        }));
        console.table(debugTable);
        // End of debugging block
        setStreamList(sortedStreams);
        console.log('Streams:', sortedStreams);
        
        if (sortedStreams.length === 0) {
          setStreamActivity([]);
          setHasMoreStreamActivity(false);
          updateStreamDetail(undefined);
          updateSelectedStream(undefined);
        }
        
      })
      .catch(err => console.error(err))
      .finally(() => updateLoadingStreams(false));

  }, [
    msp,
    publicKey,
    loadingStreams,
  ]);

  // Streams refresh timeout
  useEffect(() => {
    let timer: any;

    if (publicKey) {
      timer = setInterval(() => {
        console.log(`Refreshing streams past ${STREAMS_REFRESH_TIMEOUT / 60 / 1000}min...`);
        refreshStreamList();
      }, STREAMS_REFRESH_TIMEOUT);
    }

    return () => clearInterval(timer);
  }, [
    publicKey,
    streamList,
    refreshStreamList
  ]);

  return (
    <AppStateContext.Provider
      value={{
        network,
        endpoint,
        connection,
        detailsPanelOpen,
        tokenList,
        selectedToken,
        tokenBalance,
        effectiveRate,
        coinPrices,
        loadingPrices,
        transactionStatus,
        loadingStreams,
        streamList,
        selectedStream,
        streamDetail,
        highLightableStreamId,
        streamProgramAddress,
        loadingStreamActivity,
        streamActivity,
        hasMoreStreamActivity,
        streamsSummary,
        lastStreamsSummary,
        loadingStreamsSummary,
        getTokenByMintAddress,
        setDtailsPanelOpen,
        setSelectedToken,
        setSelectedTokenBalance,
        refreshPrices,
        setEffectiveRate,
        setCoinPrices,
        refreshTokenBalance,
        resetStreamsState,
        refreshStreamList,
        setTransactionStatus,
        setStreamList,
        setSelectedStream,
        setStreamDetail,
        setHighLightableStreamId,
        getStreamActivity,
        setStreamsSummary,
        setLastStreamsSummary,
        setLoadingStreamsSummary,
      }}>
      {props.children}
    </AppStateContext.Provider>
  );
};

export function useMeanFiConnection() {
  const context = useContext(AppStateContext);
  return {
    connection: context.connection,
    endpoint: context.endpoint,
    network: context.network
  };
}

export default AppStateProvider;
