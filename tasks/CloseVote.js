const hre = require("hardhat");
const ethers = hre.ethers;
const TransfersArtifact = require('../artifacts/contracts/Voting.sol/Voting.json')

async function showWinner(contract, votingNumber) {
    const winners = await contract.getInformationAboutWinners(votingNumber);
    for (let i = 0; i < winners.length; i++) {
        const winner = winners[i];
        console.log('   Winner: name - %s, total votes - %s', winner.name, winner.totalVotes);
        await currentBalance(winner.addr, '     Winner balance: ');
    }
}

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

    const votingNumber1 = 1;
    const votingNumber2 = 2;

    //1
    const closVote1 = await Contract.closeVote(votingNumber1);
    await closVote1.wait();

    console.log('Voting number %s closed', votingNumber1);

    await showWinner(Contract, votingNumber1);

    await currentBalance(contractAddress, '   Contract balance: ');

    //2
    const closVote2 = await Contract.closeVote(votingNumber2);
    await closVote2.wait();

    console.log('Voting number %s closed', votingNumber2);
    await showWinner(Contract, votingNumber2);
    await currentBalance(contractAddress, '   Contract balance: ');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });