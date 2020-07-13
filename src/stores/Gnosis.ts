import { observable, action } from 'mobx';
import { Interface } from 'ethers/utils';
import RootStore from './Root';
import { ContractTypes, schema } from './Provider';
import initSdk, { SdkInstance, SafeInfo } from "@gnosis.pm/safe-apps-sdk";


export type Transaction = {
    data: string,
    to: string,
    value: number
}

export default class Gnosis {
    @observable safeAddress: string;
    sdkInstance: SdkInstance;
    network: string;
    rootStore: RootStore;

    constructor(rootStore) {
        this.rootStore = rootStore;
        this.network = "";
        this.safeAddress = "";
        this.sdkInstance = initSdk()

        this.setSafeInfo = this.setSafeInfo.bind(this)

        this.sdkInstance.addListeners({
            onSafeInfo: this.setSafeInfo,
        });
    }

    setSafeInfo(safeInfo: SafeInfo):void {
        console.log("Setting account to ", safeInfo.safeAddress)
        this.safeAddress = safeInfo.safeAddress;
        this.network = safeInfo.network
    }

    getInstanceAddress = (): string => {
        return this.safeAddress;
    };

    hasInstance = (): boolean => {
        return !!this.safeAddress;
    };

    wrapTransaction(
        contractAddress: string,
        contractType: ContractTypes,
        action: string,
        params: any[],
        value?: number
    ): Transaction {
        const abi = schema[contractType];
        const iface = new Interface(abi);

        const transaction = {
            to: contractAddress,
            data: iface.functions[action].encode(params),
            value: value || 0
        }
        return transaction;
    }

    @action sendTransaction = (
        transaction: Transaction
    ): void => this.sendTransactions([transaction]);

    @action sendTransactions = (
        transactions: Transaction[]
    ): void => this.sdkInstance.sendTransactions(transactions);
}
