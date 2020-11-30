import { action, observable, ObservableMap } from 'mobx';
import RootStore from 'stores/Root';
import { Contract } from '@ethersproject/contracts';
import { getDefaultProvider } from '@ethersproject/providers';
import { getSupportedChainName } from 'provider/connectors';

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
    library: any;
    active: boolean;
    error: Error;
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

        this.handleNetworkChanged = this.handleNetworkChanged.bind(this);
        this.handleClose = this.handleClose.bind(this);
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

    getContract(type: ContractTypes, address: string): Contract {
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

    @action async loadWeb3(provider = null) {
        /*
        Handles loading web3 provider.
        */

        try {
            let web3 = getDefaultProvider(getSupportedChainName(), {
                infura: process.env.REACT_APP_INFURA_KEY,
                alchemy: process.env.REACT_APP_ALCHEMY_KEY,
            });
            let network = await web3.getNetwork();
            this.providerStatus.activeChainId = network.chainId;
            this.providerStatus.library = web3;
            console.log(`[Provider] BackUp Provider Loaded & Active`);
        } catch (err) {
            console.error(`[Provider] loadWeb3 BackUp Error`, err);
            this.providerStatus.activeChainId = null;
            this.providerStatus.library = null;
            this.providerStatus.active = false;
            this.providerStatus.error = new Error(ERRORS.NoWeb3);
            return;
        }

        this.providerStatus.active = true;
        console.log(`[Provider] Provider Active.`, this.providerStatus);
    }
}
