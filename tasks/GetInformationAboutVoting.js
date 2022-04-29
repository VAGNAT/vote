const hre = require("hardhat");
const ethers = hre.ethers;
const TransfersArtifact = require('../artifacts/contracts/Voting.sol/Voting.json')

async function main() {
    let candidates
    let winners

    const [owner] = await hre.ethers.getSigners();
    const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'

    const Contract = new ethers.Contract(
        contractAddress,
        TransfersArtifact.abi,
        owner
    )

    const votingInf = await Contract.getInformationAboutVoting();

    for (let i = 0; i < votingInf[0].length; i++) {
        console.log('Voting number - %s, voting is open - %s, total votes in vote - %s, voting is closed - %s',
            votingInf[0][i], votingInf[1][i], votingInf[3][i], votingInf[2][i])

        //candidates
        candidates = await Contract.getInformationAboutCandidates(votingInf[0][i])

        console.log('Candidates:');
        for (let j = 0; j < candidates.length; j++) {
            const candidate = candidates[j];

            console.log('   Number - %s, name - %s, total votes - %s',
                candidate.id, candidate.name, candidate.totalVotes)
        }

        //winners
        if (votingInf[2][i] != 0) {
            winners = await Contract.getInformationAboutWinners(votingInf[0][i])

            console.log('Winners:');
            for (let k = 0; k < winners.length; k++) {
                const winner = winners[k];

                console.log('   Number - %s, name - %s, total votes - %s',
                    winner.id, winner.name, winner.totalVotes)
            }
        }
    }

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });