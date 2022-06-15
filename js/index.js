var loggedIn = false;

const contract = "anmworldgame";
const dapp = "AnimalWorld";
var endpoint = "http://wax-api.gnocity.io:7878/";

const wax = new waxjs.WaxJS({
	rpcEndpoint: 'https://wax.greymass.com',
	//rpcEndpoint: endpoint,
	tryAutoLogin: false
});

const autoLogin = async () => {
	var isAutoLoginAvailable = await wallet_isAutoLoginAvailable();
	if (isAutoLoginAvailable) {
		login();
	}
}

const wallet_isAutoLoginAvailable = async () => {
    const transport = new AnchorLinkBrowserTransport();
    const anchorLink = new AnchorLink({
      transport,
      chains: [{
        chainId: '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4',
        nodeUrl: endpoint,
      }],
    });
    var sessionList = await anchorLink.listSessions(dapp);
    if (sessionList && sessionList.length > 0) {
      useAnchor = true;
      return true;
    } else {
      useAnchor = false;
      return await wax.isAutoLoginAvailable();
    }
}

// LOGIN SYSTEM

useAnchor = false;
const selectWallet = async (walletType) => {
	console.log("Wallet Type: " + walletType);
	useAnchor = walletType == "Anchor";
	document.getElementById("AccountType").textContent = `Login Type: ${walletType}`;
}

const login = async () => {
	try{
		userAccount = await walletLogin();
		document.getElementById("AccountName").textContent = `Account: ${walletUserAccount}`;
	}
	catch (e) {
		console.log("Error: " + e.message);
	}
}

const walletLogin = async () => {
	const transport = new AnchorLinkBrowserTransport();
	const anchorLink = new AnchorLink({
		transport,
		chains: [{
			chainId: '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4',
        	nodeUrl: endpoint,
		}],
	});
	if(useAnchor) {
		var sessionList = await anchorLink.listSessions(dapp);
      	if (sessionList && sessionList.length > 0) {
        	wallet_session = await anchorLink.restoreSession(dapp);
      	} else {
        	wallet_session = (await anchorLink.login(dapp)).session;
      	}
      	walletUserAccount = String(wallet_session.auth).split("@")[0];
      	auth = String(wallet_session.auth).split("@")[1];
      	anchorAuth = auth;
	}
	else {
		walletUserAccount = await wax.login();
      	wallet_session = wax.api;
      	anchorAuth = "active";
	}
	return walletUserAccount;
}

const logout = async () => {
	const transport = new AnchorLinkBrowserTransport();
	const anchorLink = new AnchorLink({
		transport,
		chains: [{
			chainId: '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4',
        	nodeUrl: endpoint,
		}],
	});
	if(useAnchor) {
		await anchorLink.clearSessions(dapp);
	}
	loggedIn = false;
	let obj = [];
	obj.push ({
		type: "logout"
	});
	document.location.reload(true);
	//unityLogout
}

//CONTRACT

async function ConfirmContract(id1, id2, id3) {
	let randomNumber = parseInt(Math.random() * 1000000000000);
	const monsterAssetID = [
    parseInt(id1),
    parseInt(id2),
		parseInt(id3),
  ];

  let transactionData = [];
  transactionData.push(
  	{
  		contractAccount: "atomicassets",
			actionName: "transfer",
			authorization: [{
				actor: walletUserAccount,
				permission: "active",
			}],
			data: {
				from: walletUserAccount,
				to: 'mfiadventure',
				asset_ids: monsterAssetID, //assetId in integer
				memo: "Transfer Monsters to MFIAdventure.",
			},
  	},
  	{
  		contractAccount: "mfiadventure",
			actionName: "registergame",
			authorization: [{
				actor: walletUserAccount,
				permission: "active",
			}],
			data: {
				account: walletUserAccount,
				asset_ids: monsterAssetID, //assetId in integer
				gameid: randomNumber,
			},
  	}
  );
  const result = await SignTransaction(transactionData);
  if(result.status === 200) {
  	console.log("Team Created");
  }
  else {
		console.log("Team Rejected + ${result?.message}");
  }
}

async function WithdrawContract() {
	let transactionData = [];
	transactionData.push ({
		contractAccount: "mfiadventure",
		actionName: "withdrawgame",
		authorization: [{
			actor: walletUserAccount,
			permission: "active",
		}],
		data: {
			account:walletUserAccount,
			gameid: "643508575937",
		}
	});
	const result = await SignTransaction(transactionData);
	if(result.status === 200) {
  	console.log("Team Removed");
  }
  else {
		console.log("Team Rejected + ${result?.message}");
  }
}

//-------

async function SignTransaction(transactionData) {
	var actions = [];
	for (let i = 0; i < transactionData.length; i++) {
		const action = {
			account: Array.isArray(transactionData[i])
        ? transactionData[i][0].contractAccount
        : transactionData[i].contractAccount,
      name: Array.isArray(transactionData[i])
        ? transactionData[i][0].actionName
        : transactionData[i].actionName,
       authorization: [{
          actor: walletUserAccount,
          permission: "active",
        },
      ],
      data: Array.isArray(transactionData[i])
        ? transactionData[i][0].data
        : transactionData[i].data,
		};
		actions.push(action);
	}
	console.log(actions);
	const result = await wallet_session.transact({
			actions: actions,
		},
		{
			blocksBehind: 3,
      expireSeconds: 80,
		}
	);
	console.log(result);
	document.getElementById("ContractId").textContent = result;
}