import React from 'react';
import styled from 'styled-components';
import { useHistory, useLocation } from 'react-router-dom';

const Wrapper = styled.div`
    margin-top: 20px;
    display: flex;
    justify-content: center;
    font-size: 14px;
`;

const OptionBase = styled.div`
    width: 140px;
    height: 36px;
    display: flex;
    justify-content: center;
    border: 1px solid var(--highlighted-selector-border);
    align-items: center;
    cursor: pointer;

    :first-child {
        border-bottom-left-radius: 6px;
        border-top-left-radius: 6px;
    }

    :last-child {
        border-bottom-right-radius: 6px;
        border-top-right-radius: 6px;
    }
`;

const OptionInactive = styled(OptionBase)`
    background: rgba(255, 255, 255, 0.06);
    color: #000000;
`;

const OptionActive = styled(OptionBase)`
    background: var(--highlighted-selector-background);
    color: #ffffff;
`;

const Option = ({ active, children, onClick }) => {
    if (active) {
        return <OptionActive onClick={onClick}>{children}</OptionActive>;
    } else {
        return <OptionInactive onClick={onClick}>{children}</OptionInactive>;
    }
};

const NavToggle = () => {
    const history = useHistory();
    const location = useLocation();
    return (
        <Wrapper>
            <Option
                active={location.pathname === "/"}
                onClick={() => history.push("/")}
            >
                Home
            </Option>
            <Option
                active={location.pathname === "/public"}
                onClick={() => history.push("/public")}
            >
                Shared Pools
            </Option>
            <Option
                active={location.pathname === "/private"}
                onClick={() => history.push("/private")}
            >
                Private Pools
            </Option>
        </Wrapper>
    );
};

export default NavToggle;
