const hre = require("hardhat");
const ethers = hre.ethers;
const TransfersArtifact = require('../artifacts/contracts/Voting.sol/Voting.json')

async function main() {
    const candidateAddress = ["0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199", "0xdd2fd4581271e230360230f9337d5c0430bf44c0",
        "0xbda5747bfd65f08deb54cb465eb87d40e51b197e"]
    const candidateName = ["David", "Alice", "Max"]
    const candidateAddress1 = ["0x2546bcd3c84621e976d8185a91a922ae77ecec30", "0xcd3b766ccdd6ae721141f452c550ca635964ce71",
        "0xdf3e18d64bc6a983f673ab319ccae4f1a57c7097", "0x1cbd3b2770909d4e10f157cabc84c7264073c9ec"]
    const candidateName1 = ["Mike", "Rose", "John", "Natali"]

    const [owner] = await hre.ethers.getSigners();
    const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
    const transfersContract = new ethers.Contract(
        contractAddress,
        TransfersArtifact.abi,
        owner
    )

    //1
    const createVote = await transfersContract.createVote(candidateAddress, candidateName, 1);
    await createVote.wait();

    const contractInform = await transfersContract.getContractInformation();
    console.log('added vote number %s with %s candidates', contractInform[2], candidateAddress.length);

    const candidateInform = await transfersContract.getInformationAboutCandidates(contractInform[2]);
    console.log('Candidates: ');
    for (let i = 0; i < candidateInform.length; i++) {
        const candidate = candidateInform[i];
        console.log('   %s', candidate.name)
    }

    //2
    const createVote1 = await transfersContract.createVote(candidateAddress1, candidateName1, 1);
    await createVote1.wait();

    const contractInform1 = await transfersContract.getContractInformation();
    console.log('added vote number %s with %s candidates', contractInform1[2], candidateAddress1.length);

    const candidateInform1 = await transfersContract.getInformationAboutCandidates(contractInform1[2]);
    console.log('Candidates: ');
    for (let i = 0; i < candidateInform1.length; i++) {
        const candidate = candidateInform1[i];
        console.log('   %s', candidate.name)
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });