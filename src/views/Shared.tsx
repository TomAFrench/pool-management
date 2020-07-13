import React from 'react';
import styled from 'styled-components';
import SharedPools from '../components/Home/SharedPools';

const SharedWrapper = styled.div`
    position: relative;
    padding: 32px 30px 0px 30px;

    @media screen and (max-width: 1024px) {
        padding: 32px 10px 0px 10px;
    }
`;

const Shared = () => {
    return (
        <SharedWrapper>
            <SharedPools />
        </SharedWrapper>
    );
};

export default Shared;
