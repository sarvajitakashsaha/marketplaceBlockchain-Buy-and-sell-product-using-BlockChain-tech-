import React, { Component } from "react";
import Web3 from "web3";
import "./App.css";
import Navbar from "./Navbar";
import Main from "./Main";
import Marketplace from "../abis/Marketplace.json";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      account: "",
      productCount: 0,
      products: [],
      loading: true,
    };
  }

  async componentWillMount() {
    await this.loadWeb3();
    await this.loadBlockchainData();
  }
  async loadBlockchainData() {
    const web3 = window.web3;
    const accounts = await web3.eth.getAccounts();
    this.setState({
      account: accounts[0],
    });
    const networkId = await web3.eth.net.getId();
    const networkdata = Marketplace.networks[networkId];
    const abi = Marketplace.abi;
    const address = Marketplace.networks[networkId].address;

    if (networkdata) {
      const marketplace = await web3.eth.Contract(abi, address);
      this.setState({ marketplace });
      const productCount = await marketplace.methods.productCount().call();
      this.setState({ productCount });
      for (var i = 0; i <= productCount; i++) {
        const product = await marketplace.methods.products(i).call();
        this.setState({ products: [...this.state.products, product] });
      }
      console.log(this.state.products);
      this.setState({ loading: false });
    } else {
      window.alert("Marketplace contract not deployed to detected network.");
    }
  }
  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert(
        "Non-Ethereum browser detected. You should consider trying MetaMask!"
      );
    }
  }

  createProduct = (name, price) => {
    this.setState({ loading: true });
    this.state.marketplace.methods
      .createProduct(name, price)
      .send({ from: this.state.account })
      .once("receipt", (receipt) => {
        this.setState({ loading: false });
      });
  };

  purchaseProduct = (id, price) => {
    this.setState({ loading: true });
    this.state.marketplace.methods
      .purchaseProduct(id)
      .send({ from: this.state.account, value: price })
      .once("receipt", (receipt) => {
        this.setState({ loading: false });
      });
  };
  render() {
    return (
      <div>
        <Navbar account={this.state.account} />
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex">
              {this.state.loading ? (
                <div id="loader" className="text-center">
                  <p className="text-center">Loading...</p>
                </div>
              ) : (
                <Main
                  products={this.state.products}
                  createProduct={this.createProduct}
                  purchaseProduct={this.purchaseProduct}
                />
              )}
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
