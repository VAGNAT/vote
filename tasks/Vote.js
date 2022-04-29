const hre = require("hardhat");
const ethers = hre.ethers;
const TransfersArtifact = require('../artifacts/contracts/Voting.sol/Voting.json')

async function currentBalance(address, msg = '') {
    const rawBalance = await ethers.provider.getBalance(address);
    console.log(msg, ethers.utils.formatEther(rawBalance));
}

async function voteInform(contract, votingNumber, voterNumber, candidateNumber) {
    const candidateInform = await contract.getInformationAboutCandidates(votingNumber);
    console.log('   Voter %s in voting number %s voted for %s', voterNumber, votingNumber, candidateInform[candidateNumber - 1].name);
}

async function main() {
    const [owner, voter1, voter2, voter3] = await hre.ethers.getSigners();
    const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'

    const _vote1 = new ethers.Contract(
        contractAddress,
        TransfersArtifact.abi,
        voter1
    )

    const _vote2 = new ethers.Contract(
        contractAddress,
        TransfersArtifact.abi,
        voter2
    )

    const _vote3 = new ethers.Contract(
        contractAddress,
        TransfersArtifact.abi,
        voter3
    )

    const votingNumber1 = 1;
    const votingNumber2 = 2;
    const candidateNumber2 = 2;
    const candidateNumber3 = 3;
    const sum = ethers.utils.parseEther('0.1');

    //1    
    const vote1 = await _vote1.vote(votingNumber1, candidateNumber2, { value: sum });
    await vote1.wait();

    await voteInform(_vote1, votingNumber1, 1, candidateNumber2);
    await currentBalance(voter1.address, '   Voter 1 balance: ');
    await currentBalance(contractAddress, '   Contract balance: ');

    //2    
    const vote2 = await _vote2.vote(votingNumber1, candidateNumber3, { value: sum });
    await vote2.wait();

    await voteInform(_vote2, votingNumber1, 2, candidateNumber3);
    await currentBalance(voter2.address, '   Voter 2 balance: ');
    await currentBalance(contractAddress, '   Contract balance: ');

    //3    
    const vote3 = await _vote3.vote(votingNumber1, candidateNumber3, { value: sum });
    await vote3.wait();

    await voteInform(_vote3, votingNumber1, 3, candidateNumber3);
    await currentBalance(voter3.address, '   Voter 3 balance: ');
    await currentBalance(contractAddress, '   Contract balance: ');

    //4    
    const vote4 = await _vote1.vote(votingNumber2, candidateNumber2, { value: sum });
    await vote4.wait();

    await voteInform(_vote1, votingNumber2, 1, candidateNumber2);
    await currentBalance(voter1.address, '   Voter 1 balance: ');
    await currentBalance(contractAddress, '   Contract balance: ');

    //5    
    const vote5 = await _vote2.vote(votingNumber2, candidateNumber3, { value: sum });
    await vote5.wait();

    await voteInform(_vote2, votingNumber2, 2, candidateNumber3);
    await currentBalance(voter2.address, '   Voter 2 balance: ');
    await currentBalance(contractAddress, '   Contract balance: ');

}


main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });