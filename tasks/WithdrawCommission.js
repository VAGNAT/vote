const hre = require("hardhat");
const ethers = hre.ethers;
const TransfersArtifact = require('../artifacts/contracts/Voting.sol/Voting.json')

async function currentBalance(address, msg = '') {
    const rawBalance = await ethers.provider.getBalance(address);
    console.log(msg, ethers.utils.formatEther(rawBalance));
}

async function main() {
    const [owner] = await hre.ethers.getSigners();
    const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'

    const Contract = new ethers.Contract(
        contractAddress,
        TransfersArtifact.abi,
        owner
    )

    const withdraw = await Contract.withdrawCommission();
    await withdraw.wait();

    await currentBalance(contractAddress, '  Contract balance: ');
    await currentBalance(owner.address, '  Owner balance: ');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });