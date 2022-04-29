const { inputToConfig } = require("@ethereum-waffle/compiler");
const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

describe("Voting", function () {
    let owner
    let voter1
    let voter2
    let voter3
    let voting

    const candidateAddress = ["0xdD870fA1b7C4700F2BD7f44238821C26f7392148", "0x583031D1113aD414F02576BD6afaBfb302140225",
        "0x4B0897b0513fdC7C541B6d9D7E929C4e5364D2dB"]
    const candidateName = ["David", "Alice", "Max"]

    async function getTimestamp(bn) {
        return (
            await ethers.provider.getBlock(bn).timestamp
        )
    }

    beforeEach(async function () {
        [owner, voter1, voter2, voter3] = await ethers.getSigners();
        const Voting = await ethers.getContractFactory("Voting", owner);
        voting = await Voting.deploy();
        await voting.deployed();
    })

    it("deploy", async function () {
        expect(voting.address).to.be.properAddress;
        assert.lengthOf(voting.votes, 0)
        const balanceContract = await voting.getContractInformation()
        expect(balanceContract[0]).to.eq(0)
        expect(balanceContract[1]).to.eq(0)
    })

    it("set owner", async function () {
        const currentOwner = await voting.owner()
        expect(currentOwner).to.eq(owner.address)
    })

    describe("create vote", function () {
        it("create vote correctly", async function () {

            const createVote = await voting.createVote(candidateAddress, candidateName, 0);
            await createVote.wait();

            const contractinf = await voting.getContractInformation()
            const countOfVotes = contractinf[2]
            expect(countOfVotes).to.eq(1)

            const currentVote = await voting.votes(1);
            expect(currentVote.duration).to.eq(3 * 24 * 60 * 60);

            const timeBlock = await getTimestamp(createVote.blockNumber)

            const votingInf = await voting.getInformationAboutVoting()
            const number = votingInf[0][0]
            const voteOpening = votingInf[0][1]
            expect(number).to.eq(countOfVotes)
            expect(voteOpening).to.eq(timeBlock)

            const candidates = await voting.getInformationAboutCandidates(countOfVotes)
            for (let i = 0; i < candidates.length; i++) {
                const candidate = candidates[i];
                expect(candidate.id).to.eq(i + 1)
                expect(candidate.addr).to.eq(candidateAddress[i])
                expect(candidate.name).to.eq(candidateName[i])
                expect(candidate.totalVotes).to.eq(0)
            }
        })


        it("different numbers of arguments", async function () {
            await expect(
                voting.createVote(candidateAddress, ["test"], 0))
                .to.be.revertedWith('The number of addresses and names doesn\'t match!')
        })

        it("only owner", async function () {
            await expect(
                voting.connect(voter1).createVote(candidateAddress, candidateName, 0))
                .to.be.revertedWith('Ownable: caller is not the owner')
        })
    })

    describe("vote", function () {
        it("vote correctly", async function () {
            await voting.createVote(candidateAddress, candidateName, 0);

            const sum = ethers.utils.parseEther("0.1");
            const vote = await voting.connect(voter1).vote(1, 1, { value: sum });

            await expect(() => vote).to.changeEtherBalance(voting, sum);
            await vote.wait();

            const balanceContract = await voting.getContractInformation()
            expect(balanceContract[0]).to.eq(sum)

            const currentVote = await voting.votes(1);
            expect(currentVote.totalVotesInVote).to.eq(1);

            const checkUserVoted = await voting.checkIfUserVoted(1, voter1.address);
            expect(checkUserVoted).to.eq(true);

            const candidates = await voting.getInformationAboutCandidates(1);
            expect(candidates[0].totalVotes).to.eq(1);

        })

        it("vote again", async function () {
            await voting.createVote(candidateAddress, candidateName, 0);

            const sum = ethers.utils.parseEther("0.1");
            const vote = await voting.connect(voter1).vote(1, 1, { value: sum });

            await expect(
                voting.connect(voter1).vote(1, 1, { value: sum }))
                .to.be.revertedWith('You have already participated in this vote!')
        })

        it("vote incorrect sum", async function () {
            await voting.createVote(candidateAddress, candidateName, 0);

            const sum = ethers.utils.parseEther("0.123");
            await expect(voting.connect(voter1).vote(1, 1, { value: sum }))
                .to.be.revertedWith('To participate in the voting, you need to contribute 0.1 ether!!!');
        })

        it("vote for non-existent voting", async function () {
            await voting.createVote(candidateAddress, candidateName, 0);

            const sum = ethers.utils.parseEther("0.1");
            await expect(voting.connect(voter1).vote(2, 1, { value: sum }))
                .to.be.revertedWith('No vote with this id exists!');
        })

        it("vote for non-existent candidate", async function () {
            await voting.createVote(candidateAddress, candidateName, 0);

            const sum = ethers.utils.parseEther("0.1");
            await expect(voting.connect(voter1).vote(1, 4, { value: sum }))
                .to.be.revertedWith('No candidate with this id exists!');
        })

        it("voting is closed", async function () {
            await voting.createVote(candidateAddress, candidateName, 1);

            const sum = ethers.utils.parseEther("0.1");
            const sumExpected = ethers.utils.parseEther("0.01");
            await voting.connect(voter1).vote(1, 1, { value: sum });

            await voting.connect(voter2).closeVote(1);

            await expect(voting.connect(voter3).vote(1, 1, { value: sum }))
                .to.be.revertedWith('Voting is closed!');
        })
    })

    describe("close vote", function () {
        it("correctly one winner", async function () {
            await voting.createVote(candidateAddress, candidateName, 1);

            const sum = ethers.utils.parseEther("0.1");
            const sumExpected = ethers.utils.parseEther("0.01");
            await voting.connect(voter1).vote(1, 1, { value: sum });

            await voting.connect(voter2).closeVote(1);

            const balanceContract = await voting.getContractInformation()
            expect(balanceContract[0]).to.eq(sumExpected)
            expect(balanceContract[1]).to.eq(sumExpected)

            const currentVote = await voting.votes(1);
            expect(currentVote.voteClosing).to.not.eq(0);

            const winners = await voting.getInformationAboutWinners(1);
            expect(winners[0].id).to.eq(1);
            expect(winners[0].addr).to.eq(candidateAddress[0]);
            expect(winners[0].name).to.eq(candidateName[0]);
            expect(winners[0].totalVotes).to.eq(1);
        })

        it("correctly some winner", async function () {
            await voting.createVote(candidateAddress, candidateName, 1);

            const sum = ethers.utils.parseEther("0.1");
            const sumExpected = ethers.utils.parseEther("0.02");
            await voting.connect(voter1).vote(1, 1, { value: sum });

            await voting.connect(voter2).vote(1, 2, { value: sum });

            await voting.connect(voter2).closeVote(1);

            const balanceContract = await voting.getContractInformation()
            expect(balanceContract[0]).to.eq(sumExpected)
            expect(balanceContract[1]).to.eq(sumExpected)

            const winners = await voting.getInformationAboutWinners(1);
            for (let i = 0; i < winners.length; i++) {
                const winner = winners[i];
                expect(winner.id).to.eq(i + 1);
                expect(winner.addr).to.eq(candidateAddress[i]);
                expect(winner.name).to.eq(candidateName[i]);
                expect(winner.totalVotes).to.eq(1);
            }
        })

        it("voting is already closed", async function () {
            await voting.createVote(candidateAddress, candidateName, 0);

            await expect(voting.closeVote(1))
                .to.be.revertedWith('Voting must last at least three days!');
        })

        it("voting is voting is still going on", async function () {
            await voting.createVote(candidateAddress, candidateName, 1);

            await voting.closeVote(1);

            await expect(voting.closeVote(1))
                .to.be.revertedWith('Voting is closed!');
        })
    })

    describe("withdraw commission", function () {
        it("correct transfer to the owner", async function () {
            await voting.createVote(candidateAddress, candidateName, 1);

            const sum = ethers.utils.parseEther("0.1");
            const sumExpectedContract = ethers.utils.parseEther("-0.01");
            const sumExpectedOwner = ethers.utils.parseEther("0.01");
            await voting.connect(voter1).vote(1, 1, { value: sum });

            await voting.connect(voter2).closeVote(1);

            const withdraw = await voting.withdrawCommission();

            await expect(() => withdraw).to.changeEtherBalance(voting, sumExpectedContract);
            await withdraw.wait();

            await expect(() => withdraw).to.changeEtherBalance(owner, sumExpectedOwner);
            await withdraw.wait();

            const balanceContract = await voting.getContractInformation()
            expect(balanceContract[0]).to.eq(0)
            expect(balanceContract[1]).to.eq(0)
        })

        it("only owner", async function () {
            await voting.createVote(candidateAddress, candidateName, 1);

            const sum = ethers.utils.parseEther("0.1");
            await voting.connect(voter1).vote(1, 1, { value: sum });

            await voting.connect(voter2).closeVote(1);

            await expect(voting.connect(voter3).withdrawCommission())
                .to.be.revertedWith('Ownable: caller is not the owner');
        })
    })

    describe("get information about winners", function () {
        it("No vote with this id exists", async function () {
            await expect(voting.getInformationAboutWinners(1)).to.be.revertedWith('No vote with this id exists!')
        })

        it("Winner unknown", async function () {
            await voting.createVote(candidateAddress, candidateName, 0);
            await expect(voting.getInformationAboutWinners(1)).to.be.revertedWith('Winner unknown, voting has not closed yet!')
        })
    })

    describe("get information about voting", function () {
        it("No vote with this id exists", async function () {
            await expect(voting.getInformationAboutVoting()).to.be.revertedWith('No created vote!')
        })
    })

    describe("check if user voted", function () {
        it("only owner", async function () {
            await expect(voting.connect(voter1).checkIfUserVoted(1, candidateAddress[0])).to.be.revertedWith('Ownable: caller is not the owner')
        })
    })
})