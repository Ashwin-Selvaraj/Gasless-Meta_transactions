const { ethers } = require("hardhat");
const hre = require("hardhat");
require("dotenv").config();
const { writeFileSync } = require("fs");

async function deploy() {
  const privateKey = process.env.PRIVATE_KEY;
  // Provider for Sepolia Testnet
  const provider = new ethers.JsonRpcProvider(
    "https://sepolia.infura.io/v3/0fba3fdf4179467ba9832ac74d77445c"
  );
  console.log(provider);
  const deployer = new ethers.Wallet(privateKey, provider);
  console.log(`Deploying contracts with the account: ${deployer.address}`);
  const balance = await provider.getBalance(deployer);
  // const balanceInEther = ethers.utils.formatEther(balance);
  console.log(balance);

  // deploying forwarder contract
  const forwarderFactory = await ethers.getContractFactory("ERC2771Forwarder");
  const forwarder = await forwarderFactory
    .connect(deployer)
    .deploy("ERC2771Forwarder");
  await forwarder.waitForDeployment();
  console.log(`Forwarder contract address: ${forwarder.target}`);

  // deploying sum contract
  const SUMFactory = await ethers.getContractFactory("MetaSum");
  const sum = await SUMFactory.connect(deployer).deploy(forwarder.target);
  await sum.waitForDeployment();
  console.log(`Sum contract address: ${sum.target}`);

  writeFileSync(
    "deploy.json",
    JSON.stringify(
      {
        ERC2771Forwarder: forwarder.target,
        Sum: sum.target,
      },
      null,
      2
    )
  );

  async function verify(contractAddress, args) {
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArgument: args,
      });
      console.log("MetaSum Contract verified on Etherscan");
    } catch (e) {
      console.log(e);
    }
  }

  // Call verify function after an interval of 30 seconds
  setTimeout(async () => {
    await verify(sum.target, [forwarder.target]);
  }, 30000);
}

deploy()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });

/* To verify contract in ether scan use this command

npx hardhat verify --network sepolia 0x9E338A98058e24b51d6A7ba2eB524c3B90BA9c60 "0x86630EB39AbE653a2D575a1909225494D9D4a04B"

0x9E338A98058e24b51d6A7ba2eB524c3B90BA9c60 - contract address(Since there are 2 contracts to verify we need to specify the contract address)
"0x86630EB39AbE653a2D575a1909225494D9D4a04B" - This is the constructor arguments for the above contract

*/
