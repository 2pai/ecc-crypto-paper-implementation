"use strict";


/**
 * Example JavaScript code that interacts with the page and Web3 wallets
 */

 // Unpkg imports
let axiosApi = axios.create({
  baseURL: 'https://final-kappa.vercel.app/'
})

const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
const evmChains = window.evmChains;
const contractAddress = "0x5fBb410188de589Bd64E21afb136354B7A17b6Dc";
// Web3modal instance
let web3

let web3Modal

// Chosen wallet provider given by the dialog window
let provider;

let smartContract;

// Address of the selected account
let selectedAccount;


/**
 * Setup the orchestra
 */
function init() {

  // Check that the web page is run in a secure context,
  // as otherwise MetaMask won't be available


  // Tell Web3modal what providers we have available.
  // Built-in web browser provider (only one can exist as a time)
  // like MetaMask, Brave or Opera is added automatically by Web3modal
  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        // Mikko's test key - don't copy as your mileage may vary
        infuraId: "8043bb2cf99347b1bfadfb233c5325c0",
      }
    }
  };

  web3Modal = new Web3Modal({
    cacheProvider: false, // optional
    providerOptions, // required
    disableInjectedProvider: false, // optional. For MetaMask / Brave / Opera.
  });

  console.log("Web3Modal instance is", web3Modal);
}
async function setStage() {
  const stageValue = document.getElementById("stageInput").value

    smartContract.methods.setStage(stageValue).send({from: selectedAccount}, function(err, transactionHash) {
      if (!err){
        document.querySelector("#tx").innerHTML = `Transaction Success <a href='https://etherscan.io/tx/${transactionHash}'>${transactionHash}</a>`;
      }else{
        alert(JSON.stringify(err)); 
      }
    })
}

async function settleCollateral(_id) {

    smartContract.methods.settleCollateral(_id).send({from: selectedAccount, value: web3.utils.toWei('2', 'ether')}, function(err, transactionHash) {
      if (!err){
        document.querySelector("#tx").textContent = `Transaction Success ${transactionHash}`;
      }else{
        alert(JSON.stringify(err)); 
      }
    })
}

async function getActiveOrder() {
  try {
    const {data} = await axiosApi.get('/getOrderActive')

    data.map(async (body) => {
      const element = `
          <div class="col-md-4">
          <div class="panel panel-primary">
            <div class="panel-heading">
              <h3 class="panel-title">Sales ${body.id}</h3>
            </div>
            <div class="panel-body">
              <p><strong>Buyer Address :</strong> ${body.buyer}</p>
              <p><strong>Buy Time :</strong> ${body.buySalesEpoch}</p>
              <p><strong>Status :</strong> in progress</p>
              <p><strong>Collateral Status :</strong> ${body.isFullfilledCollateral ? "<b style='color:green'>PAID</b>": "<b style='color:red'>UNPAID</b>"}</p>
              <hr>
              ${!body.isFullfilledCollateral ? `<div class="btn btn-primary" onClick=settleCollateral(${body.id})>Settle Collateral</div>`:``} 
              ${body.isDispute ? `<div class="btn btn-warning">Confirm Dispute</div>`:``} 
              ${body.isDispute ? `<div class="btn btn-danger">Reject Dispute</div>`:``} 
            </div>
          </div>
        </div>                
      `
      document.getElementById("activeSales").innerHTML += element
    })

  } catch (error) {
    alert(error)
  }
}

async function fetchBuyer(_owner) {
  try {
    const result = await smartContract.methods.tokensOfOwner(_owner).call()


    result.map(async (body) => {
      const element = `
          <div class="col-md-4">
          <div class="panel panel-primary">
            <div class="panel-heading">
              <h3 class="panel-title">Sales ${body.id}</h3>
            </div>
            <div class="panel-body">
              <p><strong>Buyer Address :</strong> ${body.buyer}</p>
              <p><strong>Buy Time :</strong> ${body.buySalesEpoch}</p>
              <p><strong>Status :</strong> in progress</p>
              <p><strong>Collateral Status :</strong> ${body.isFullfilledCollateral ? "<b style='color:green'>PAID</b>": "<b style='color:red'>UNPAID</b>"}</p>
              <hr>
              ${!body.isFullfilledCollateral ? `<div class="btn btn-primary" onClick=settleCollateral(${body.id})>Settle Collateral</div>`:``} 
              ${body.isDispute ? `<div class="btn btn-warning">Confirm Dispute</div>`:``} 
              ${body.isDispute ? `<div class="btn btn-danger">Reject Dispute</div>`:``} 
            </div>
          </div>
        </div>                
      `
      document.getElementById("activeSales").innerHTML += element
    })

  } catch (error) {
    alert(error)
  }
}
async function setBaseURI() {
  const baseURIValue = document.getElementById("baseURIInput").value

    smartContract.methods.setBaseURI(baseURIValue).send({from: selectedAccount}, function(err, transactionHash) {
      if (!err){
        document.querySelector("#tx").textContent = `Transaction Success ${transactionHash}`;
      }else{
        alert(JSON.stringify(err)); 
      }
    })
}

async function getBaseURI() {
  const baseURI = await smartContract.methods.baseURI().call()
  document.getElementById("baseURIValue").textContent = baseURI
}

async function getContractBalance() {
  const web3 = new Web3(provider);
  const contractBalance = await web3.eth.getBalance(contractAddress)
  const contractBalanceETH = web3.utils.fromWei(contractBalance, "ether");
  document.getElementById("contract-address").textContent = `${contractAddress} `
  document.getElementById("contract-balance").textContent = `${contractBalanceETH} ETH`
}

async function withdrawFund() {
    smartContract.methods.withdrawAll().send({from: selectedAccount}, function(err, transactionHash) {
      if (!err){
        document.querySelector("#tx").textContent = `Transaction Success ${transactionHash}`;
      }else{
        alert(JSON.stringify(err)); 
      }
    })
}
/**
 * Kick in the UI action after Web3modal dialog has chosen a provider
 */
async function fetchAccountData() {

  // Get a Web3 instance for the wallet
  web3 = new Web3(provider);

  smartContract = new web3.eth.Contract(contractABI, contractAddress)
  await getContractBalance()
  await getActiveOrder()
  // Get connected chain id from Ethereum node
  const chainId = await web3.eth.getChainId();
  // Load chain information over an HTTP API
  const chainData = evmChains.getChain(chainId);
  document.querySelector("#network-name").textContent = chainData.name;

  // Get list of accounts of the connected wallet
  const accounts = await web3.eth.getAccounts();

  // MetaMask does not give you all accounts, only the selected account
  console.log("Got accounts", accounts);
  selectedAccount = accounts[0];

  document.querySelector("#selected-account").textContent = selectedAccount;

  // Get a handl
  const template = document.querySelector("#template-balance");
  const accountContainer = document.querySelector("#accounts");

  // Purge UI elements any previously loaded accounts
  accountContainer.innerHTML = '';

  // Go through all accounts and get their ETH balance
  const rowResolvers = accounts.map(async (address) => {
    const balance = await web3.eth.getBalance(address);
    // ethBalance is a BigNumber instance
    // https://github.com/indutny/bn.js/
    const ethBalance = web3.utils.fromWei(balance, "ether");
    const humanFriendlyBalance = parseFloat(ethBalance).toFixed(4);
    // Fill in the templated row and put in the document
    const clone = template.content.cloneNode(true);
    clone.querySelector(".address").textContent = address;
    clone.querySelector(".balance").textContent = humanFriendlyBalance;
    accountContainer.appendChild(clone);
  });

  // Because rendering account does its own RPC commucation
  // with Ethereum node, we do not want to display any results
  // until data for all accounts is loaded
  await Promise.all(rowResolvers);

  // Display fully loaded UI for wallet data
  document.querySelector("#prepare").style.display = "none";
  document.querySelector("#connected").style.display = "block";
}



/**
 * Fetch account data for UI when
 * - User switches accounts in wallet
 * - User switches networks in wallet
 * - User connects wallet initially
 */
async function refreshAccountData() {

  // If any current data is displayed when
  // the user is switching acounts in the wallet
  // immediate hide this data
  document.querySelector("#connected").style.display = "none";
  document.querySelector("#prepare").style.display = "block";

  // Disable button while UI is loading.
  // fetchAccountData() will take a while as it communicates
  // with Ethereum node via JSON-RPC and loads chain data
  // over an API call.
  document.querySelector("#btn-connect").setAttribute("disabled", "disabled")
  await fetchAccountData(provider);
  document.querySelector("#btn-connect").removeAttribute("disabled")
}


/**
 * Connect wallet button pressed.
 */
async function onConnect() {

  console.log("Opening a dialog", web3Modal);
  try {
    provider = await web3Modal.connect();
  } catch(e) {
    console.log("Could not get a wallet connection", e);
    return;
  }

  // Subscribe to accounts change
  provider.on("accountsChanged", (accounts) => {
    fetchAccountData();
  });

  // Subscribe to chainId change
  provider.on("chainChanged", (chainId) => {
    fetchAccountData();
  });

  // Subscribe to networkId change
  provider.on("networkChanged", (networkId) => {
    fetchAccountData();
  });

  await refreshAccountData();
}

/**
 * Disconnect wallet button pressed.
 */
async function onDisconnect() {

  console.log("Killing the wallet connection", provider);

  // TODO: Which providers have close method?
  if(provider.close) {
    await provider.close();

    // If the cached provider is not cleared,
    // WalletConnect will default to the existing session
    // and does not allow to re-scan the QR code with a new wallet.
    // Depending on your use case you may want or want not his behavir.
    await web3Modal.clearCachedProvider();
    provider = null;
  }

  selectedAccount = null;

  // Set the UI back to the initial state
  document.querySelector("#prepare").style.display = "block";
  document.querySelector("#connected").style.display = "none";
}


/**
 * Main entry point.
 */
window.addEventListener('load', async () => {
  init();
  document.querySelector("#btn-connect").addEventListener("click", onConnect);
  document.querySelector("#btn-disconnect").addEventListener("click", onDisconnect);
});