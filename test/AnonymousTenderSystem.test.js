const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AnonymousTenderSystem", function () {
    let contract;
    let owner, oracle, contractor1, contractor2;
    let contractAddress;
    
    beforeEach(async function () {
        [owner, oracle, contractor1, contractor2] = await ethers.getSigners();
        
        const AnonymousTenderSystem = await ethers.getContractFactory("AnonymousTenderSystem");
        contract = await AnonymousTenderSystem.deploy(oracle.address);
        await contract.waitForDeployment();
        contractAddress = await contract.getAddress();
        
        console.log("Contract deployed at:", contractAddress);
    });
    
    describe("Deployment", function () {
        it("Should set the correct admin", async function () {
            expect(await contract.admin()).to.equal(owner.address);
        });
        
        it("Should set the correct oracle", async function () {
            expect(await contract.oracle()).to.equal(oracle.address);
        });
        
        it("Should initialize counters to zero", async function () {
            expect(await contract.tenderCount()).to.equal(0);
            expect(await contract.milestoneCount()).to.equal(0);
        });
    });
    
    describe("Anonymous Tender Submission", function () {
        it("Should submit anonymous tender with commitment hash", async function () {
            const projectName = "Highway Bridge Construction";
            const nonce = "secret123";
            const commitmentHash = ethers.keccak256(
                ethers.solidityPacked(["address", "string"], [contractor1.address, nonce])
            );
            const budgetAmount = ethers.parseEther("100");
            const ipfsHash = "QmTest123456789";
            
            await expect(
                contract.connect(contractor1).submitAnonymousTender(
                    projectName,
                    commitmentHash,
                    budgetAmount,
                    ipfsHash
                )
            ).to.emit(contract, "TenderSubmitted");
            
            expect(await contract.tenderCount()).to.equal(1);
            
            const tender = await contract.getTender(1);
            expect(tender.projectName).to.equal(projectName);
            expect(tender.commitmentHash).to.equal(commitmentHash);
            expect(tender.isAnonymous).to.equal(true);
            expect(tender.contractorAddress).to.equal(ethers.ZeroAddress);
        });
        
        it("Should reject duplicate commitment hash", async function () {
            const projectName = "Test Project";
            const commitmentHash = ethers.keccak256(ethers.toUtf8Bytes("test"));
            const budgetAmount = ethers.parseEther("50");
            const ipfsHash = "QmTest";
            
            await contract.connect(contractor1).submitAnonymousTender(
                projectName,
                commitmentHash,
                budgetAmount,
                ipfsHash
            );
            
            await expect(
                contract.connect(contractor2).submitAnonymousTender(
                    "Another Project",
                    commitmentHash,
                    ethers.parseEther("60"),
                    "QmTest2"
                )
            ).to.be.revertedWith("Commitment hash already used");
        });
        
        it("Should reject empty project name", async function () {
            const commitmentHash = ethers.keccak256(ethers.toUtf8Bytes("test"));
            const budgetAmount = ethers.parseEther("50");
            
            await expect(
                contract.connect(contractor1).submitAnonymousTender(
                    "",
                    commitmentHash,
                    budgetAmount,
                    "QmTest"
                )
            ).to.be.revertedWith("Project name cannot be empty");
        });
    });
    
    describe("Tender Approval", function () {
        let tenderId, commitmentHash, nonce;
        
        beforeEach(async function () {
            nonce = "secret456";
            commitmentHash = ethers.keccak256(
                ethers.solidityPacked(["address", "string"], [contractor1.address, nonce])
            );
            
            await contract.connect(contractor1).submitAnonymousTender(
                "Water Pipeline",
                commitmentHash,
                ethers.parseEther("80"),
                "QmPipeline"
            );
            tenderId = 1;
        });
        
        it("Should approve tender and reveal contractor", async function () {
            await expect(
                contract.connect(owner).approveTender(
                    tenderId,
                    contractor1.address,
                    nonce
                )
            ).to.emit(contract, "TenderApproved");
            
            const tender = await contract.getTender(tenderId);
            expect(tender.contractorAddress).to.equal(contractor1.address);
            expect(tender.isAnonymous).to.equal(false);
            expect(tender.status).to.equal(1); // Approved
        });
        
        it("Should reject with wrong commitment proof", async function () {
            await expect(
                contract.connect(owner).approveTender(
                    tenderId,
                    contractor2.address,
                    nonce
                )
            ).to.be.revertedWith("Invalid commitment proof");
        });
        
        it("Should only allow admin to approve", async function () {
            await expect(
                contract.connect(contractor1).approveTender(
                    tenderId,
                    contractor1.address,
                    nonce
                )
            ).to.be.revertedWith("Only admin can perform this action");
        });
    });
    
    describe("Milestone Submission", function () {
        let tenderId;
        
        beforeEach(async function () {
            const nonce = "secret789";
            const commitmentHash = ethers.keccak256(
                ethers.solidityPacked(["address", "string"], [contractor1.address, nonce])
            );
            
            await contract.connect(contractor1).submitAnonymousTender(
                "School Building",
                commitmentHash,
                ethers.parseEther("120"),
                "QmSchool"
            );
            tenderId = 1;
            
            await contract.connect(owner).approveTender(
                tenderId,
                contractor1.address,
                nonce
            );
            
            await contract.connect(contractor1).startTenderWork(tenderId);
        });
        
        it("Should submit milestone", async function () {
            await expect(
                contract.connect(contractor1).submitMilestone(
                    tenderId,
                    "Foundation Complete - 20%",
                    ethers.parseEther("24"),
                    "QmFoundation",
                    "19.0760,72.8777"
                )
            ).to.emit(contract, "MilestoneSubmitted");
            
            expect(await contract.milestoneCount()).to.equal(1);
            
            const milestone = await contract.getMilestone(1);
            expect(milestone.tenderId).to.equal(tenderId);
            expect(milestone.fundAmount).to.equal(ethers.parseEther("24"));
            expect(milestone.status).to.equal(1); // Submitted
        });
        
        it("Should reject milestone exceeding budget", async function () {
            await expect(
                contract.connect(contractor1).submitMilestone(
                    tenderId,
                    "Excessive Work",
                    ethers.parseEther("150"),
                    "QmExcessive",
                    "19.0760,72.8777"
                )
            ).to.be.revertedWith("Milestone amount exceeds remaining budget");
        });
        
        it("Should only allow contractor to submit milestone", async function () {
            await expect(
                contract.connect(contractor2).submitMilestone(
                    tenderId,
                    "Unauthorized",
                    ethers.parseEther("20"),
                    "QmUnauth",
                    "19.0760,72.8777"
                )
            ).to.be.revertedWith("Only tender contractor can perform this action");
        });
    });
    
    describe("Milestone Verification", function () {
        let tenderId, milestoneId;
        
        beforeEach(async function () {
            const nonce = "secret999";
            const commitmentHash = ethers.keccak256(
                ethers.solidityPacked(["address", "string"], [contractor1.address, nonce])
            );
            
            await contract.connect(contractor1).submitAnonymousTender(
                "Park Renovation",
                commitmentHash,
                ethers.parseEther("60"),
                "QmPark"
            );
            tenderId = 1;
            
            await contract.connect(owner).approveTender(
                tenderId,
                contractor1.address,
                nonce
            );
            
            await contract.connect(contractor1).startTenderWork(tenderId);
            
            await contract.connect(contractor1).submitMilestone(
                tenderId,
                "Landscaping - 50%",
                ethers.parseEther("30"),
                "QmLandscape",
                "18.5204,73.8567"
            );
            milestoneId = 1;
        });
        
        it("Should verify milestone with quality score", async function () {
            const qualityScore = 85;
            
            await expect(
                contract.connect(oracle).verifyMilestone(milestoneId, qualityScore)
            ).to.emit(contract, "MilestoneVerified");
            
            const milestone = await contract.getMilestone(milestoneId);
            expect(milestone.status).to.equal(3); // Verified
            expect(milestone.qualityScore).to.equal(qualityScore);
            expect(milestone.verifiedBy).to.equal(oracle.address);
        });
        
        it("Should reject milestone with low quality score", async function () {
            const qualityScore = 50;
            
            await expect(
                contract.connect(oracle).verifyMilestone(milestoneId, qualityScore)
            ).to.be.revertedWith("Quality score too low for approval");
        });
        
        it("Should only allow oracle to verify", async function () {
            await expect(
                contract.connect(contractor1).verifyMilestone(milestoneId, 85)
            ).to.be.revertedWith("Only oracle can perform this action");
        });
        
        it("Should reject milestone", async function () {
            await expect(
                contract.connect(oracle).rejectMilestone(milestoneId, "Poor quality images")
            ).to.emit(contract, "MilestoneRejected");
            
            const milestone = await contract.getMilestone(milestoneId);
            expect(milestone.status).to.equal(4); // Rejected
        });
    });
    
    describe("Fund Release", function () {
        let tenderId, milestoneId;
        
        beforeEach(async function () {
            const nonce = "secret111";
            const commitmentHash = ethers.keccak256(
                ethers.solidityPacked(["address", "string"], [contractor1.address, nonce])
            );
            
            await contract.connect(contractor1).submitAnonymousTender(
                "Community Center",
                commitmentHash,
                ethers.parseEther("40"),
                "QmCenter"
            );
            tenderId = 1;
            
            await contract.connect(owner).approveTender(
                tenderId,
                contractor1.address,
                nonce
            );
            
            await contract.connect(contractor1).startTenderWork(tenderId);
            
            await contract.connect(contractor1).submitMilestone(
                tenderId,
                "Phase 1 - 25%",
                ethers.parseEther("10"),
                "QmPhase1",
                "18.5204,73.8567"
            );
            milestoneId = 1;
            
            await contract.connect(oracle).verifyMilestone(milestoneId, 90);
        });
        
        it("Should release funds after verification", async function () {
            const fundAmount = ethers.parseEther("10");
            const initialBalance = await ethers.provider.getBalance(contractor1.address);
            
            await expect(
                contract.connect(owner).releaseMilestoneFunds(milestoneId, {
                    value: fundAmount
                })
            ).to.emit(contract, "FundsReleased");
            
            const finalBalance = await ethers.provider.getBalance(contractor1.address);
            expect(finalBalance).to.be.gt(initialBalance);
            
            const milestone = await contract.getMilestone(milestoneId);
            expect(milestone.status).to.equal(5); // FundsReleased
            
            const tender = await contract.getTender(tenderId);
            expect(tender.releasedAmount).to.equal(fundAmount);
        });
        
        it("Should reject if milestone not verified", async function () {
            await contract.connect(contractor1).submitMilestone(
                tenderId,
                "Phase 2 - 50%",
                ethers.parseEther("10"),
                "QmPhase2",
                "18.5204,73.8567"
            );
            const unverifiedMilestoneId = 2;
            
            await expect(
                contract.connect(owner).releaseMilestoneFunds(unverifiedMilestoneId, {
                    value: ethers.parseEther("10")
                })
            ).to.be.revertedWith("Milestone must be verified first");
        });
    });
    
    describe("Progress Tracking", function () {
        it("Should calculate tender progress correctly", async function () {
            const nonce = "secret222";
            const commitmentHash = ethers.keccak256(
                ethers.solidityPacked(["address", "string"], [contractor1.address, nonce])
            );
            
            await contract.connect(contractor1).submitAnonymousTender(
                "Road Construction",
                commitmentHash,
                ethers.parseEther("100"),
                "QmRoad"
            );
            const tenderId = 1;
            
            await contract.connect(owner).approveTender(
                tenderId,
                contractor1.address,
                nonce
            );
            
            await contract.connect(contractor1).startTenderWork(tenderId);
            
            // Submit and verify first milestone (20%)
            await contract.connect(contractor1).submitMilestone(
                tenderId,
                "Milestone 1 - 20%",
                ethers.parseEther("20"),
                "QmM1",
                "18.5204,73.8567"
            );
            await contract.connect(oracle).verifyMilestone(1, 85);
            await contract.connect(owner).releaseMilestoneFunds(1, {
                value: ethers.parseEther("20")
            });
            
            // Check progress
            const progress = await contract.getTenderProgress(tenderId);
            expect(progress.released).to.equal(ethers.parseEther("20"));
            expect(progress.total).to.equal(ethers.parseEther("100"));
            expect(progress.percentage).to.equal(20);
        });
    });
});
