import { isAddress } from './helpers';

const NotSupported = require('../assets/images/question.svg') as string;

export const TokenIconAddress = (address, isSupported) => {
    if (!isSupported) {
        return NotSupported;
    }
    if (address === 'ether') {
        return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png`;
    } else {
        return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${isAddress(
            address
        )}/logo.png`;
    }
};

export default TokenIconAddress;
