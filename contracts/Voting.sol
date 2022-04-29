// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.0 <0.9.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Voting is Ownable {
    mapping(uint256 => Vote) public votes;
    uint256 private countOfVotes;
    uint256 private amountToWithdraw;
    uint256 constant DURATION = 3 days;

    struct Candidate {
        uint256 id;
        address addr;
        string name;
        uint256 totalVotes;
    }

    struct Winner {
        uint256 id;
        address addr;
        string name;
        uint256 totalVotes;
    }

    struct Vote {
        uint256 id;
        uint256 duration;
        uint256 voteOpening;
        uint256 voteClosing;
        uint256 totalVotesInVote;
        Winner[] winners;
        mapping(address => bool) voters;
        Candidate[] candidates;
    }

    event Create(
        uint256 indexed _votingNumber,
        uint256 _numberOfCandidates,
        uint256 _timestamp
    );

    event VotingForCandidate(
        uint256 indexed _votingNumber,
        uint256 indexed _candidateNumber,
        address _candidateAddress,
        address _from,
        uint256 _amount,
        uint256 _timestamp
    );

    event Close(
        uint256 indexed _votingNumber,
        uint256 indexed _winnerNumber,
        address _winnerAddress,
        uint256 _timestamp
    );

    modifier checkVotePay(uint256 votingNumber, uint256 candidateNumber) {
        uint256 minCountVotes = 1;
        uint256 minCountCandidates = 1;
        require(
            msg.value == 1e17,
            "To participate in the voting, you need to contribute 0.1 ether!!!"
        );
        require(
            !votes[votingNumber].voters[msg.sender],
            "You have already participated in this vote!"
        );
        require(
            votingNumber >= minCountVotes &&
                votes[votingNumber].id == votingNumber,
            "No vote with this id exists!"
        );
        require(
            candidateNumber >= minCountCandidates &&
                votes[votingNumber].candidates.length >= candidateNumber,
            "No candidate with this id exists!"
        );
        require(votes[votingNumber].voteClosing == 0, "Voting is closed!");
        _;
    }

    modifier checkVote(uint256 votingNumber) {
        uint256 minCountVotes = 1;
        require(
            votingNumber >= minCountVotes && votingNumber <= countOfVotes,
            "No vote with this id exists!"
        );
        _;
    }

    function createVote(
        address[] memory _addressesOfCandidates,
        string[] memory _namesOfCandidates,
        uint256 _duration
    ) external onlyOwner {
        require(
            _addressesOfCandidates.length == _namesOfCandidates.length,
            "The number of addresses and names doesn't match!"
        );

        uint256 duration = _duration == 0 ? DURATION : _duration;

        //create vote
        countOfVotes++;
        votes[countOfVotes].id = countOfVotes;
        votes[countOfVotes].voteOpening = block.timestamp;
        votes[countOfVotes].duration = duration;

        //create candidates
        for (uint256 i = 0; i < _namesOfCandidates.length; i++) {
            Candidate memory newCandidate = Candidate(
                i + 1,
                _addressesOfCandidates[i],
                _namesOfCandidates[i],
                0
            );
            votes[countOfVotes].candidates.push(newCandidate);
        }

        emit Create(countOfVotes, _namesOfCandidates.length, block.timestamp);
    }

    function vote(uint256 votingNumber, uint256 candidateNumber)
        external
        payable
        checkVotePay(votingNumber, candidateNumber)
    {
        votes[votingNumber].voters[msg.sender] = true;
        votes[votingNumber].totalVotesInVote++;
        votes[votingNumber].candidates[candidateNumber - 1].totalVotes++;

        emit VotingForCandidate(
            votingNumber,
            candidateNumber,
            votes[votingNumber].candidates[candidateNumber - 1].addr,
            msg.sender,
            msg.value,
            block.timestamp
        );
    }

    function closeVote(uint256 votingNumber) external checkVote(votingNumber) {
        require(
            block.timestamp >=
                votes[votingNumber].voteOpening + votes[votingNumber].duration,
            "Voting must last at least three days!"
        );
        require(votes[votingNumber].voteClosing == 0, "Voting is closed!");

        Winner[] memory winners = getWinners(votes[votingNumber].candidates);
        for (uint256 i = 0; i < winners.length; i++) {
            if (winners[i].addr == address(0)) {
                break;
            }
            votes[votingNumber].winners.push(winners[i]);
            emit Close(
                votingNumber,
                winners[i].id,
                winners[i].addr,
                block.timestamp
            );
        }
        payToWinner(votes[votingNumber]);
        votes[votingNumber].voteClosing = block.timestamp;
    }

    function withdrawCommission() external onlyOwner {
        address _owner = owner();
        address payable _to = payable(_owner);
        _to.transfer(amountToWithdraw);
        amountToWithdraw = 0;
    }

    function getInformationAboutVoting()
        external
        view
        returns (
            uint256[] memory,
            uint256[] memory,
            uint256[] memory,
            uint256[] memory
        )
    {
        uint256 minCountVotes = 1;
        require(countOfVotes >= minCountVotes, "No created vote!");

        uint256[] memory numbers = new uint256[](countOfVotes);
        uint256[] memory voteOpening = new uint256[](countOfVotes);
        uint256[] memory voteClosing = new uint256[](countOfVotes);
        uint256[] memory totalVotesInVote = new uint256[](countOfVotes);

        uint256 number;
        for (uint256 i = 0; i < countOfVotes; i++) {
            number = i + 1;
            numbers[i] = number;
            voteOpening[i] = votes[number].voteOpening;
            totalVotesInVote[i] = votes[number].totalVotesInVote;
            voteClosing[i] = votes[number].voteClosing;
        }
        return (numbers, voteOpening, voteClosing, totalVotesInVote);
    }

    function getInformationAboutWinners(uint256 votingNumber)
        external
        view
        checkVote(votingNumber)
        returns (Winner[] memory)
    {
        require(
            votes[votingNumber].voteClosing != 0,
            "Winner unknown, voting has not closed yet!"
        );

        return votes[votingNumber].winners;
    }

    function getInformationAboutCandidates(uint256 votingNumber)
        external
        view
        checkVote(votingNumber)
        returns (Candidate[] memory)
    {
        return votes[votingNumber].candidates;
    }

    function getContractInformation()
        external
        view
        onlyOwner
        returns (
            uint256 balance,
            uint256,
            uint256
        )
    {
        return (address(this).balance, amountToWithdraw, countOfVotes);
    }

    function checkIfUserVoted(uint256 votingNumber, address userAddress)
        external
        view
        onlyOwner
        returns (bool)
    {
        return votes[votingNumber].voters[userAddress];
    }

    function getWinners(Candidate[] memory candidates)
        private
        pure
        returns (Winner[] memory)
    {
        uint256 maxTotalVotes;
        uint256 indexWinner;
        Winner[] memory winners = new Winner[](candidates.length);

        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i].totalVotes > maxTotalVotes) {
                indexWinner = 0;
                winners = new Winner[](candidates.length);
                winners[indexWinner] = Winner(
                    candidates[i].id,
                    candidates[i].addr,
                    candidates[i].name,
                    candidates[i].totalVotes
                );
                maxTotalVotes = candidates[i].totalVotes;
                indexWinner++;
            } else if (candidates[i].totalVotes == maxTotalVotes) {
                winners[indexWinner] = Winner(
                    candidates[i].id,
                    candidates[i].addr,
                    candidates[i].name,
                    candidates[i].totalVotes
                );
                indexWinner++;
            }
        }
        return (winners);
    }

    function payToWinner(Vote storage currentVote) private {
        amountToWithdraw += currentVote.totalVotesInVote * 1e16; //10%
        uint256 totalPayout = currentVote.totalVotesInVote * 9e16; //90%
        uint256 amountPayout = totalPayout / currentVote.winners.length;
        for (uint256 i = 0; i < currentVote.winners.length; i++) {
            address payable _to = payable(currentVote.winners[i].addr);
            _to.transfer(amountPayout);
        }
    }
}
