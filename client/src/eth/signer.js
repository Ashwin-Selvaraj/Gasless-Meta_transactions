const ethSigUtil = require("eth-sig-util");

const EIP712Domain = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "chainId", type: "uint256" },
  { name: "verifyingContract", type: "address" },
];

const ForwardRequest = [
  { name: "from", type: "address" },
  { name: "to", type: "address" },
  { name: "value", type: "uint256" },
  { name: "gas", type: "uint256" },
  { name: "nonce", type: "uint256" },
  { name: "data", type: "bytes" },
];

function getMetaTxTypeData(chainId, verifyingContract) {
  return {
    types: {
      EIP712Domain,
      ForwardRequest,
    },
    domain: {
      name: "ERC2771Forwarder",
      version: "0.0.1",
      chainId,
      verifyingContract,
    },
    primaryType: "ForwardRequest",
  };
}

async function signTypedData(signer, from, data) {
  // If signer is a private key, use it to sign
  if (typeof signer === "string") {
    const privateKey = Buffer.from(signer.replace(/^0x/, ""), "hex");
    return ethSigUtil.signTypedMessage(privateKey, { data });
  }

  function convertBigIntToString(obj) {
    // Recursive function to traverse the object and convert BigInt values to strings
    const convert = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === "bigint") {
          obj[key] = obj[key].toString();
        } else if (typeof obj[key] === "object") {
          convert(obj[key]);
        }
      }
    };

    const newObj = { ...obj }; // Create a copy of the original object to avoid mutation
    convert(newObj);
    console.log(newObj);
    return newObj;
  }

  // Otherwise, send the signTypedData RPC call
  // Note that hardhatvm and metamask require different EIP712 input
  const isHardhat = data.domain.chainId == 31337;
  const [method, argData] = isHardhat
    ? ["eth_signTypedData", data]
    : ["eth_signTypedData_v4", JSON.stringify(convertBigIntToString(data))];
  return await signer.send(method, [from, argData]);
}

async function buildRequest(forwarder, input) {
  const nonce = await forwarder
    .nonces(input.from)
    .then((nonce) => nonce.toString());
  return { value: 0, gas: 1e6, nonce, ...input };
}

async function buildTypedData(provider, forwarder, request) {
  const chainId = await provider.getNetwork().then((n) => n.chainId);
  const typeData = getMetaTxTypeData(chainId, forwarder.target);
  return { ...typeData, message: request };
}

async function signMetaTxRequest(signer, provider, forwarder, input) {
  console.log(input);
  const request = await buildRequest(forwarder, input);
  const toSign = await buildTypedData(provider, forwarder, request);
  const signature = await signTypedData(signer, input.from, toSign);
  return { signature, request };
}

module.exports = {
  signMetaTxRequest,
  buildRequest,
  buildTypedData,
};
