import { action, observable } from 'mobx';
import RootStore from 'stores/Root';
import { supportedChainId } from '../provider/connectors';

export default class BlockchainFetchStore {
    @observable activeFetchLoop: any;
    rootStore: RootStore;

    constructor(rootStore) {
        this.rootStore = rootStore;
    }

    @action onActivePoolChanged() {
        const { gnosisStore, providerStore } = this.rootStore;

        if (
            providerStore.providerStatus.active &&
            gnosisStore.safeAddress &&
            providerStore.providerStatus.activeChainId === supportedChainId
        ) {
            this.fetchActivePoolAllowances();
        }
    }

    @action fetchPoolTotalSupplies() {
        const { tokenStore, poolStore } = this.rootStore;
        const poolAddresses = poolStore
            .getContributedPools()
            .map(pool => pool.address);
        tokenStore.fetchTotalSupplies(poolAddresses);
    }

    @action fetchPoolUserBalances() {
        const { gnosisStore, tokenStore, poolStore } = this.rootStore;
        const account = gnosisStore.safeAddress;
        const poolAddresses = poolStore
            .getContributedPools()
            .map(pool => pool.address);
        tokenStore.fetchTokenBalances(account, poolAddresses);
    }

    @action async fetchActivePoolAllowances() {
        const { gnosisStore } = this.rootStore;

        const account = gnosisStore.safeAddress;
        const { appSettingsStore, poolStore, tokenStore } = this.rootStore;
        const poolAddress = appSettingsStore.getActivePoolAddress();
        const tokenAddresses = poolStore.getPoolTokens(poolAddress);
        await tokenStore.fetchAccountApprovals(
            tokenAddresses,
            account,
            poolAddress
        );
    }

    @action setFetchLoop(forceFetch?: boolean) {
        const { gnosisStore, providerStore } = this.rootStore;

        const active = providerStore.providerStatus.active;
        const chainId = providerStore.providerStatus.activeChainId;
        const library = providerStore.providerStatus.library;
        const account = gnosisStore.safeAddress;

        if (active && chainId === supportedChainId) {
            const { poolStore, appSettingsStore } = this.rootStore;

            library
                .getBlockNumber()
                .then(blockNumber => {
                    const lastCheckedBlock = providerStore.getCurrentBlockNumber();

                    const doFetch =
                        blockNumber >= lastCheckedBlock + 10 || forceFetch;

                    if (doFetch) {
                        console.debug('[Fetch Loop] Fetch Blockchain Data', {
                            blockNumber,
                            account,
                        });

                        // Set block number
                        providerStore.setCurrentBlockNumber(blockNumber);

                        // Fetch pools
                        poolStore.fetchPools().then(() => {
                            // Fetch user pool shares after pools loaded
                            // this.fetchPoolTotalSupplies();

                            if (account && appSettingsStore.hasActivePool()) {
                                this.fetchActivePoolAllowances();
                            }
                        });

                        poolStore.fetchPrivatePools();

                        poolStore.fetchContributedPools().then(() => {
                            if (account) {
                                this.fetchPoolTotalSupplies();
                                this.fetchPoolUserBalances();
                            }
                        });

                        // Get user-specific blockchain data
                        if (account) {
                            providerStore.fetchUserBlockchainData(account);
                        }
                    }
                })
                .catch(error => {
                    console.error('[Fetch Loop Failure]', {
                        providerStore,
                        forceFetch,
                        chainId,
                        account,
                        library,
                        error,
                    });
                    providerStore.setCurrentBlockNumber(undefined);
                });
        }
    }
}
