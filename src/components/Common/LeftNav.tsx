import React from 'react';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';

const Wrapper = styled.div`
    height: 150px;
    border-bottom: 1px solid var(--panel-border);
`;

const NavContainer = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: 20px;
`;

const StyledLink = styled(NavLink)`
    display: flex;
    align-items: center;
    height: 40px;
    padding-left: 30px;
    font-style: normal;
    font-weight: normal;
    font-size: 14px;
    line-height: 22px;
    text-decoration: none;
    color: var(--highlighted-nav-text);
    padding-left: 27px;

    &.selected {
        background-color: var(--highlighted-nav-background);
        border-left: 3px solid var(--highlighted-nav-border);
    }
`;

const LeftNav = () => {
    return (
        <Wrapper>
            <NavContainer>
                <StyledLink exact activeClassName="selected" to={`/`}>
                    Shared Pools
                </StyledLink>
                <StyledLink activeClassName="selected" to={`/private`}>
                    Private Pools
                </StyledLink>
            </NavContainer>
        </Wrapper>
    );
};

export default LeftNav;
