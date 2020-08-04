import React from 'react';
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom';
import styled from 'styled-components';
import './App.css';
import Web3Manager from 'components/Web3Manager';
import Home from 'views/Home';
import Private from 'views/Private';
import Pool from 'views/Pool';
import New from 'views/New';
import LeftNav from 'components/Common/LeftNav';

const Container = styled.div`
    display: flex;
    flex-direction: row;
`;

const LeftContainer = styled.div`
    @media screen and (max-width: 1024px) {
        display: none;
    }
    flex-direction: column;
    width: 300px;
    border-right: 1px solid var(--panel-border);
    background-color: var(--panel-background);
`;

const App = () => {
    const renderViews = () => {
        return (
            <div className="app-shell">
                <Switch>
                    <Route path="/pool/new" component={New} />
                    <Route path="/pool/:poolAddress" component={Pool} />
                    <Route path="/private" component={Private} />
                    <Redirect from="/list" to="/" />
                    <Route path="/" component={Home} />
                </Switch>
            </div>
        );
    };

    return (
        <Web3Manager>
            <HashRouter>
                {/* <Header /> */}
                <Container>
                    <LeftContainer>
                        <LeftNav />
                    </LeftContainer>
                    {renderViews()}
                </Container>
            </HashRouter>
        </Web3Manager>
    );
};

export default App;
