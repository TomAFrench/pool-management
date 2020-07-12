
export const supportedChainId = Number(
    process.env.REACT_APP_SUPPORTED_NETWORK_ID
);

export const getSupportedChainId = () => {
    return supportedChainId;
};

export const getSupportedChainName = () => {
    return chainNameById[supportedChainId];
};

export const chainNameById = {
    '1': 'mainnet',
    '3': 'ropsten',
    '4': 'rinkeby',
    '42': 'kovan',
};

export const isChainIdSupported = (chainId: number): boolean => {
    return supportedChainId === chainId;
};

const RPC_URLS: { [chainId: number]: string } = {
    1: process.env.REACT_APP_RPC_URL_1 as string,
    3: process.env.REACT_APP_RPC_URL_3 as string,
    4: process.env.REACT_APP_RPC_URL_4 as string,
    42: process.env.REACT_APP_RPC_URL_42 as string,
};

export const SUBGRAPH_URLS: { [chainId: number]: string } = {
    1: process.env.REACT_APP_SUBGRAPH_URL_1 as string,
    3: process.env.REACT_APP_SUBGRAPH_URL_3 as string,
    4: process.env.REACT_APP_SUBGRAPH_URL_4 as string,
    42: process.env.REACT_APP_SUBGRAPH_URL_42 as string,
};

export const backupUrls = {};
backupUrls[supportedChainId] = RPC_URLS[supportedChainId];
