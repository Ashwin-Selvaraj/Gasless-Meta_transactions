import React, { useState, useEffect } from "react";
import Web3Modal from "web3modal";
import { ethers } from "ethers";
import config from "./config/config";
import axios from "axios";
import { signMetaTxRequest } from "./eth/signer";
import { createInstance } from "./eth/forwarder";
require("dotenv").config();

const Main = () => {
  const { contract_Address, contract_ABI } = config;
  const [sumContract, setSumContract] = useState();
  const [signer, setSigner] = useState();
  const [address, setAddress] = useState();
  const [provider, setProvider] = useState();

  const [number1, setNumber1] = useState("");
  const [number2, setNumber2] = useState("");
  const [sum, setSum] = useState("");

  // Handler for connecting wallet
  const connectWalletHandler = async () => {
    const web3Modal = new Web3Modal();
    // Web3Modal is a library that simplifies the process of connecting to a user's Ethereum wallet, like MetaMask.
    const connection = await web3Modal.connect();
    const provider = new ethers.BrowserProvider(connection);
    if (provider) {
      const getnetwork = await provider.getNetwork();
      const sepoliaChainId = 11155111;

      if (getnetwork.chainId != sepoliaChainId) {
        alert("please switch to Ethereum's Sepolia network");
        return;
      }

      //sign the transaction
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const sumContract = new ethers.Contract(
        contract_Address,
        contract_ABI,
        signer
      );
      // Setting the global constants
      setSigner(signer);
      setAddress(address);
      setSumContract(sumContract);
      setProvider(provider);
    } else {
      // MetaMask is not installed
      alert("Please install MetaMask extension first!");
    }
  };

  // Handler for calculating sum
  const calculateSum = async () => {
    const num1 = parseInt(number1);
    const num2 = parseInt(number2);
    if (!isNaN(num1) && !isNaN(num2)) {
      setSum(num1 + num2);
    } else {
      setSum("Invalid input");
    }
    console.log(address);
    const balance = await provider.getBalance(address);
    console.log(balance);
    console.log(sumContract);
    // const canSendTx = balance.gt(1e14);
    if (balance > 1e14)
      return sendTx(sumContract.connect(signer), number1, number2);
    else return sendMetaTx(sumContract, provider, signer, number1, number2);
  };

  async function sendTx(contract, num1, num2) {
    console.log(`Sending num1 to add function, ${num1}`);
    contract.add(num1);
    setNumber1("");
  }

  async function sendMetaTx(contract, provider, signer, num1) {
    console.log(`Sending num1 meta-tx to add function, ${num1}`);
    const url = process.env.REACT_APP_WEBHOOK_URL;
    if (!url) throw new Error(`Missing relayer url`);
    const forwarder = createInstance(provider);
    const from = await signer.getAddress();
    const data = contract.interface.encodeFunctionData("add", [num1]);
    console.log(data);
    const to = contract_Address;
    const request = await signMetaTxRequest(
      signer.provider,
      provider,
      forwarder,
      {
        to,
        from,
        data,
      }
    );

    // axios
    //   .post("${url}", JSON.stringify(request))
    //   .then((response) => {
    //     console.log("Data sent to Relayer:", response.data);
    //     // Reset the form fields
    //     setNumber1("");
    //     setNumber2("");
    //   })
    //   .catch((error) => {
    //     console.error("Error sending data to Relayer:", error);
    //   });

    console.log(JSON.stringify(request));
    const url1 =
      "https://api.defender.openzeppelin.com/actions/fb59a8c1-6e2c-44dc-98a3-555d8889e870/runs/webhook/2a3f8785-400b-49fb-93ae-912b4ae4aa9a/HFp1ZAVAgd6CV9YFRpacnf";
    return fetch(url1, {
      method: "POST",
      body: JSON.stringify(request),
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Data sent to Relayer:", data);
        // Reset the form fields or do other actions
      })
      .catch((error) => {
        console.error("Error sending data to Relayer:", error);
      });
  }

  return (
    <React.Fragment>
      <div className="title-block" style={{ marginTop: "1em" }}>
        <h1 className="name">Meta Transactions</h1>
      </div>
      <div className="main-menu" style={{ marginTop: "3em" }}>
        <div className="container middle-container">
          <div>
            <label htmlFor="number1">Number 1:</label>
            <input
              id="number1"
              type="number"
              value={number1}
              onChange={(e) => setNumber1(e.target.value)}
              placeholder="Enter number 1"
            />
          </div>
          <div>
            <label htmlFor="number2">Number 2:</label>
            <input
              id="number2"
              type="number"
              value={number2}
              onChange={(e) => setNumber2(e.target.value)}
              placeholder="Enter number 2"
            />
          </div>
          <button onClick={calculateSum}>Sum</button>
          <button onClick={connectWalletHandler}>Connect Wallet</button>
          <div>Result: {sum}</div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default Main;
