const hre = require("hardhat");
const ethers = hre.ethers;
const TransfersArtifact = require('../artifacts/contracts/Voting.sol/Voting.json')

async function main() {
    const [owner] = await hre.ethers.getSigners();
    const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'

    const Contract = new ethers.Contract(
        contractAddress,
        TransfersArtifact.abi,
        owner
    )

    const contractInf = await Contract.getContractInformation();

    console.log('  Contract balance: ', ethers.utils.formatEther(contractInf[0]));
    console.log('  Сommission amount to be withdrawn: ', ethers.utils.formatEther(contractInf[1]));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });