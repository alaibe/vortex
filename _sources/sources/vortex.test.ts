import {FeedNewTransactionState} from "./stateInterface";

declare var describe: any;
declare var test: any;
declare var expect: any;

import {Vortex} from "./vortex";
import * as Migrations from '../../setup/truffle/build/contracts/Migrations.json';
import {FeedNewTransaction} from "./feed/feed.actions";
import * as Web3 from "web3";

let _web3;

const getWeb3: Promise<any> = new Promise<any>((ok: (arg?: any) => void, ko: (arg?: any) => void): void => {
    try {
        _web3 = new (<any>Web3)(new (<any>Web3).providers.HttpProvider("http://localhost:8545"));
        ok(_web3);
    } catch (e) {
        ko(e);
    }
});

describe("Vortex", () => {
    test('Instantiate', () => {
        const vtx = Vortex.factory([Migrations], getWeb3);
        expect(vtx.Contracts[0].contractName).toBe("Migrations");
    });

    test('Recover Instance', () => {
        expect(Vortex.get().Contracts[0].contractName).toBe("Migrations");
    });

    test('Run Instance', () => {
        Vortex.get().run();
    });

    test('Load Web3', () => {
        Vortex.get().loadWeb3();
    });

    test('Send New Transaction from dispatch', (done: (arg?: any) => void) => {
        _web3.eth.getAccounts().then((acc: string[]) => {
            Vortex.get().Store.dispatch({
                type: 'TX_SEND',
                txArgs: {
                    from: acc[0],
                    to: acc[1],
                    value: 1234
                },
                web3: _web3
            })
        });
        let intervalId = setInterval(() => {
            const state = Vortex.get().Store.getState();
            switch (state.feed.length) {
                case 1:
                    const txHash = (<FeedNewTransactionState>state.feed[0]).transaction_hash;
                    if (state.tx[txHash].type === 'CONFIRMED') {
                        clearInterval(intervalId);
                        done();
                    }
                    if (state.tx[txHash].type === 'ERROR') {
                        clearInterval(intervalId);
                        done(new Error(JSON.stringify(state.tx[txHash])));
                    }
                    break ;
                default:
                    break ;
            }
        }, 1000);
    }, 10000);

    test('Send New Transaction from web3', (done: (arg?: any) => void) => {
        _web3.eth.getAccounts().then((acc: string[]) => {
            _web3.eth.vortexSendTransaction({
                from: acc[0],
                to: acc[1],
                value: 1234
            })
        });
        let intervalId = setInterval(() => {
            const state = Vortex.get().Store.getState();
            switch (state.feed.length) {
                case 2:
                    const txHash = (<FeedNewTransactionState>state.feed[1]).transaction_hash;
                    if (state.tx[txHash].type === 'CONFIRMED') {
                        clearInterval(intervalId);
                        done();
                    }
                    if (state.tx[txHash].type === 'ERROR') {
                        clearInterval(intervalId);
                        done(new Error(JSON.stringify(state.tx[txHash])));
                    }
                    break ;
                default:
                    break ;
            }
        }, 1000);
    }, 10000);

    test('Adding New Feed Element', () => {
        Vortex.get().Store.dispatch(FeedNewTransaction("Dummy Tx"));
        expect(Vortex.get().Store.getState().feed[0].action).toBe('NEW_TRANSACTION');
    });
});