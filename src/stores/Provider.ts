import { action, observable, ObservableMap } from 'mobx';
import RootStore from 'stores/Root';
import { Contract } from '@ethersproject/contracts'
import { JsonRpcProvider, Web3Provider } from '@ethersproject/providers'
import { backupUrls, supportedChainId } from 'provider/connectors';
import { Interface } from '@ethersproject/abi';

export enum ContractTypes {
    BPool = 'BPool',
    BActions = 'BActions',
    BFactory = 'BFactory',
    DSProxy = 'DSProxy',
    DSProxyRegistry = 'DSProxyRegistry',
    TestToken = 'TestToken',
    ExchangeProxy = 'ExchangeProxy',
    ExchangeProxyCallable = 'ExchangeProxyCallable',
    Weth = 'Weth',
    Multicall = 'Multicall',
}

export const schema = {
    BPool: require('../abi/BPool').abi,
    BActions: require('../abi/BActions').abi,
    BFactory: require('../abi/BFactory').abi,
    DSProxy: require('../abi/DSProxy').abi,
    DSProxyRegistry: require('../abi/DSProxyRegistry').abi,
    TestToken: require('../abi/TestToken').abi,
    ExchangeProxy: require('../abi/ExchangeProxy').abi,
    ExchangeProxyCallable: require('../abi/ExchangeProxyCallable').abi,
    Weth: require('../abi/Weth').abi,
    Multicall: require('../abi/Multicall').abi,
};

export interface ChainData {
    currentBlockNumber: number;
}

enum ERRORS {
    UntrackedChainId = 'Attempting to access data for untracked chainId',
    ContextNotFound = 'Specified context name note stored',
    BlockchainActionNoAccount = 'Attempting to do blockchain transaction with no account',
    BlockchainActionNoChainId = 'Attempting to do blockchain transaction with no chainId',
    BlockchainActionNoResponse = 'No error or response received from blockchain action',
    NoWeb3 = 'Error Loading Web3',
}

type ChainDataMap = ObservableMap<number, ChainData>;

export interface ProviderStatus {
    activeChainId: number;
    account: string;
    library: any;
    active: boolean;
    injectedLoaded: boolean;
    injectedActive: boolean;
    injectedChainId: number;
    injectedWeb3: any;
    backUpLoaded: boolean;
    backUpWeb3: any;
    error: Error;
    activeProvider: any;
}

export default class ProviderStore {
    @observable chainData: ChainData;
    @observable providerStatus: ProviderStatus;
    rootStore: RootStore;

    constructor(rootStore) {
        this.rootStore = rootStore;
        this.chainData = { currentBlockNumber: -1 } as ChainData;
        this.providerStatus = {} as ProviderStatus;
        this.providerStatus.active = false;
        this.providerStatus.injectedLoaded = false;
        this.providerStatus.injectedActive = false;
        this.providerStatus.backUpLoaded = false;
        this.providerStatus.activeProvider = null;

        this.handleNetworkChanged = this.handleNetworkChanged.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleAccountsChanged = this.handleAccountsChanged.bind(this);
    }

    getCurrentBlockNumber(): number {
        return this.chainData.currentBlockNumber;
    }

    @action setCurrentBlockNumber(blockNumber): void {
        this.chainData.currentBlockNumber = blockNumber;
    }

    @action fetchUserBlockchainData = async (account: string) => {
        const {
            transactionStore,
            tokenStore,
            contractMetadataStore,
        } = this.rootStore;

        console.debug('[Provider] fetchUserBlockchainData', {
            account,
        });

        transactionStore.checkPendingTransactions(account);
        tokenStore
            .fetchTokenBalances(
                account,
                contractMetadataStore.getTrackedTokenAddresses()
            )
            .then(result => {
                console.debug('[Fetch End - User Blockchain Data]', {
                    account,
                });
            });
    };

    getContract(
        type: ContractTypes,
        address: string,
    ): Contract {
        const library = this.providerStatus.library;
        return new Contract(address, schema[type], library);
    }

    @action async handleNetworkChanged(
        networkId: string | number
    ): Promise<void> {
        console.log(
            `[Provider] Network change: ${networkId} ${this.providerStatus.active}`
        );
        // network change could mean switching from injected to backup or vice-versa
        if (this.providerStatus.active) {
            await this.loadWeb3();
            const { blockchainFetchStore } = this.rootStore;
            blockchainFetchStore.setFetchLoop(true);
        }
    }

    @action async handleClose(): Promise<void> {
        console.log(`[Provider] HandleClose() ${this.providerStatus.active}`);

        if (this.providerStatus.active) await this.loadWeb3();
    }

    @action handleAccountsChanged(accounts: string[]): void {
        console.log(`[Provider] Accounts changed`);
        const {
            blockchainFetchStore,
            addLiquidityFormStore,
            removeLiquidityFormStore,
        } = this.rootStore;
        addLiquidityFormStore.closeModal();
        removeLiquidityFormStore.closeModal();

        if (accounts.length === 0) {
            this.handleClose();
        } else {
            this.providerStatus.account = accounts[0];
            // Loads pool & balance data for account
            blockchainFetchStore.setFetchLoop(true);
        }
    }

    @action async loadProvider(provider) {
        try {
            // remove any old listeners
            if (
                this.providerStatus.activeProvider &&
                this.providerStatus.activeProvider.on
            ) {
                console.log(`[Provider] Removing Old Listeners`);
                this.providerStatus.activeProvider.removeListener(
                    'chainChanged',
                    this.handleNetworkChanged
                );
                this.providerStatus.activeProvider.removeListener(
                    'accountsChanged',
                    this.handleAccountsChanged
                );
                this.providerStatus.activeProvider.removeListener(
                    'close',
                    this.handleClose
                );
                this.providerStatus.activeProvider.removeListener(
                    'networkChanged',
                    this.handleNetworkChanged
                );
            }

            if (
                this.providerStatus.library &&
                this.providerStatus.library.close
            ) {
                console.log(`[Provider] Closing Old Library.`);
                await this.providerStatus.library.close();
            }

            let web3 = new Web3Provider(provider);

            if ((provider as any).isMetaMask) {
                console.log(`[Provider] MetaMask Auto Refresh Off`);
                (provider as any).autoRefreshOnNetworkChange = false;
            }

            if (provider.on) {
                console.log(`[Provider] Subscribing Listeners`);
                provider.on('chainChanged', this.handleNetworkChanged); // For now assume network/chain ids are same thing as only rare case when they don't match
                provider.on('accountsChanged', this.handleAccountsChanged);
                provider.on('close', this.handleClose);
                provider.on('networkChanged', this.handleNetworkChanged);
            }

            let network = await web3.getNetwork();

            const accounts = await web3.listAccounts();
            let account = null;
            if (accounts.length > 0) account = accounts[0];

            this.providerStatus.injectedLoaded = true;
            this.providerStatus.injectedChainId = network.chainId;
            this.providerStatus.account = account;
            this.providerStatus.injectedWeb3 = web3;
            this.providerStatus.activeProvider = provider;
            console.log(`[Provider] Provider loaded.`);
        } catch (err) {
            console.error(`[Provider] Loading Error`, err);
            this.providerStatus.injectedLoaded = false;
            this.providerStatus.injectedChainId = null;
            this.providerStatus.account = null;
            this.providerStatus.library = null;
            this.providerStatus.active = false;
            this.providerStatus.activeProvider = null;
        }
    }

    @action async loadWeb3(provider = null) {
        /*
        Handles loading web3 provider.
        */

        try {
            let web3 = new JsonRpcProvider(backupUrls[supportedChainId]);
            let network = await web3.getNetwork();
            this.providerStatus.injectedActive = false;
            this.providerStatus.backUpLoaded = true;
            this.providerStatus.account = this.rootStore.gnosisStore.safeAddress;
            this.providerStatus.activeChainId = network.chainId;
            this.providerStatus.backUpWeb3 = web3;
            this.providerStatus.library = web3;
            this.providerStatus.activeProvider =
                backupUrls[supportedChainId];
            console.log(`[Provider] BackUp Provider Loaded & Active`);
        } catch (err) {
            console.error(`[Provider] loadWeb3 BackUp Error`, err);
            this.providerStatus.injectedActive = false;
            this.providerStatus.backUpLoaded = false;
            this.providerStatus.account = null;
            this.providerStatus.activeChainId = null;
            this.providerStatus.backUpWeb3 = null;
            this.providerStatus.library = null;
            this.providerStatus.active = false;
            this.providerStatus.activeProvider = null;
            this.providerStatus.error = new Error(ERRORS.NoWeb3);
            return;
        }

        this.providerStatus.active = true;
        console.log(`[Provider] Provider Active.`, this.providerStatus);
    }
}
