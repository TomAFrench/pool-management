import React from 'react';
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom';
import styled from 'styled-components';
import './App.css';
import Web3Manager from 'components/Web3Manager';
import Home from 'views/Home';
import Private from 'views/Private';
import Pool from 'views/Pool';
import New from 'views/New';
import NavToggle from 'components/Common/NavToggle';
import Shared from 'views/Shared';

const Container = styled.div`
    display: flex;
    flex-direction: row;
`;

const App = () => {
    const renderViews = () => {
        return (
            <div className="app-shell">
                <NavToggle/>
                <Switch>
                    <Route path="/pool/new" component={New} />
                    <Route path="/pool/:poolAddress" component={Pool} />
                    <Route path="/public" component={Shared} />
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
                <Container>
                    {renderViews()}
                </Container>
            </HashRouter>
        </Web3Manager>
    );
};

export default App;
