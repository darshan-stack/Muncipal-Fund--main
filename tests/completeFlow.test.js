const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Complete Municipal Fund Blockchain System", function () {
    let contract;
    let admin, supervisor, contractor, citizen;
    let projectId, tenderId, milestoneId;
    let nonce;
    
    before(async function () {
        // Get test accounts
        [admin, supervisor, contractor, citizen] = await ethers.getSigners();
        
        console.log("\n🧪 Setting up test environment...");
        console.log(`   Admin:      ${admin.address}`);
        console.log(`   Supervisor: ${supervisor.address}`);
        console.log(`   Contractor: ${contractor.address}`);
        console.log(`   Citizen:    ${citizen.address}`);
        
        // Deploy contract
        const AnonymousTenderSystem = await ethers.getContractFactory("AnonymousTenderSystem");
        contract = await AnonymousTenderSystem.deploy();
        await contract.deployed();
        
        console.log(`\n✓ Contract deployed at ${contract.address}`);
    });
    
    describe("1. Project Creation with Anonymous Supervisor", function () {
        it("Should create project with supervisor commitment", async function () {
            // Create supervisor commitment (hash of supervisor address)
            const supervisorCommitment = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(['address'], [supervisor.address])
            );
            
            const tx = await contract.connect(admin).createProject(
                "Road Construction - Connaught Place",
                ethers.utils.parseEther("10"), // 10 ETH budget
                supervisorCommitment
            );
            
            const receipt = await tx.wait();
            projectId = receipt.events[0].args.projectId;
            
            expect(projectId).to.equal(1);
            console.log(`   ✓ Project created: ID ${projectId}`);
            
            // Verify project details
            const project = await contract.projects(projectId);
            expect(project.projectName).to.equal("Road Construction - Connaught Place");
            expect(project.budget).to.equal(ethers.utils.parseEther("10"));
            expect(project.admin).to.equal(admin.address);
            expect(project.status).to.equal(0); // Created
        });
        
        it("Should emit ProjectCreated event", async function () {
            const supervisorCommitment = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(['address'], [supervisor.address])
            );
            
            await expect(
                contract.connect(admin).createProject(
                    "Bridge Construction",
                    ethers.utils.parseEther("20"),
                    supervisorCommitment
                )
            ).to.emit(contract, "ProjectCreated");
        });
    });
    
    describe("2. Anonymous Tender Submission", function () {
        it("Should submit anonymous tender with commitment", async function () {
            // Generate random nonce for anonymity
            nonce = ethers.utils.hexlify(ethers.utils.randomBytes(32));
            
            // Create commitment: Hash(contractor_address + nonce)
            const commitment = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ['address', 'bytes32'],
                    [contractor.address, nonce]
                )
            );
            
            const tx = await contract.connect(contractor).submitAnonymousTender(
                projectId,
                commitment,
                "QmEncryptedContractorData123", // IPFS hash
                "QmTenderDocument456",
                "QmQualityReport789"
            );
            
            const receipt = await tx.wait();
            tenderId = receipt.events[0].args.tenderId;
            
            expect(tenderId).to.equal(1);
            console.log(`   ✓ Anonymous tender submitted: ID ${tenderId}`);
            
            // Verify tender details
            const tender = await contract.tenders(tenderId);
            expect(tender.projectId).to.equal(projectId);
            expect(tender.contractorCommitment).to.equal(commitment);
            expect(tender.status).to.equal(0); // Submitted
        });
        
        it("Should hide contractor identity before approval", async function () {
            const tender = await contract.getTenderDetails(tenderId);
            expect(tender.contractor).to.equal(ethers.constants.AddressZero);
            console.log(`   ✓ Contractor identity is HIDDEN`);
        });
        
        it("Should reject tender submission if project not in Created status", async function () {
            // Create a new project and approve a tender for it
            const supervisorCommitment = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(['address'], [supervisor.address])
            );
            
            const tx = await contract.connect(admin).createProject(
                "Test Project",
                ethers.utils.parseEther("5"),
                supervisorCommitment
            );
            
            const receipt = await tx.wait();
            const testProjectId = receipt.events[0].args.projectId;
            
            // Submit and approve a tender
            const testNonce = ethers.utils.hexlify(ethers.utils.randomBytes(32));
            const testCommitment = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ['address', 'bytes32'],
                    [contractor.address, testNonce]
                )
            );
            
            const tenderTx = await contract.connect(contractor).submitAnonymousTender(
                testProjectId,
                testCommitment,
                "QmTest1",
                "QmTest2",
                "QmTest3"
            );
            
            const tenderReceipt = await tenderTx.wait();
            const testTenderId = tenderReceipt.events[0].args.tenderId;
            
            // Approve it
            await contract.connect(supervisor).approveTender(
                testTenderId,
                contractor.address,
                testNonce
            );
            
            // Now try to submit another tender - should fail
            await expect(
                contract.connect(contractor).submitAnonymousTender(
                    testProjectId,
                    testCommitment,
                    "QmTest4",
                    "QmTest5",
                    "QmTest6"
                )
            ).to.be.revertedWith("Project not accepting tenders");
        });
    });
    
    describe("3. Blind Tender Approval", function () {
        it("Should allow supervisor to approve tender blindly", async function () {
            const tx = await contract.connect(supervisor).approveTender(
                tenderId,
                contractor.address,
                nonce
            );
            
            await tx.wait();
            
            // Verify tender is approved
            const tender = await contract.tenders(tenderId);
            expect(tender.status).to.equal(2); // Approved
            
            console.log(`   ✓ Tender approved by supervisor`);
        });
        
        it("Should reveal contractor identity after approval", async function () {
            const revealedContractor = await contract.revealedContractors(tenderId);
            expect(revealedContractor).to.equal(contractor.address);
            
            console.log(`   ✓ Contractor identity revealed: ${contractor.address}`);
        });
        
        it("Should update project status to TenderAssigned", async function () {
            const project = await contract.projects(projectId);
            expect(project.status).to.equal(1); // TenderAssigned
        });
        
        it("Should reject approval from non-supervisor", async function () {
            // Create another project and tender
            const supervisorCommitment = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(['address'], [supervisor.address])
            );
            
            const projectTx = await contract.connect(admin).createProject(
                "Another Project",
                ethers.utils.parseEther("5"),
                supervisorCommitment
            );
            
            const projectReceipt = await projectTx.wait();
            const newProjectId = projectReceipt.events[0].args.projectId;
            
            const newNonce = ethers.utils.hexlify(ethers.utils.randomBytes(32));
            const newCommitment = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ['address', 'bytes32'],
                    [contractor.address, newNonce]
                )
            );
            
            const tenderTx = await contract.connect(contractor).submitAnonymousTender(
                newProjectId,
                newCommitment,
                "QmNew1",
                "QmNew2",
                "QmNew3"
            );
            
            const tenderReceipt = await tenderTx.wait();
            const newTenderId = tenderReceipt.events[0].args.tenderId;
            
            // Try to approve with admin (not supervisor)
            await expect(
                contract.connect(admin).approveTender(
                    newTenderId,
                    contractor.address,
                    newNonce
                )
            ).to.be.revertedWith("Not authorized supervisor");
        });
    });
    
    describe("4. Milestone Submission", function () {
        it("Should allow contractor to submit 20% milestone", async function () {
            const tx = await contract.connect(contractor).submitMilestone(
                tenderId,
                20,
                "QmProofImages20",
                "28.6139,77.2090",
                "QmArchitecture20",
                ethers.utils.keccak256(ethers.utils.toUtf8Bytes("quality_metrics_20"))
            );
            
            const receipt = await tx.wait();
            milestoneId = receipt.events[0].args.milestoneId;
            
            expect(milestoneId).to.equal(1);
            console.log(`   ✓ 20% milestone submitted: ID ${milestoneId}`);
            
            const milestone = await contract.milestones(milestoneId);
            expect(milestone.percentageComplete).to.equal(20);
            expect(milestone.status).to.equal(1); // Submitted
        });
        
        it("Should reject milestone from non-contractor", async function () {
            await expect(
                contract.connect(citizen).submitMilestone(
                    tenderId,
                    40,
                    "QmFake",
                    "0,0",
                    "QmFake2",
                    ethers.utils.keccak256(ethers.utils.toUtf8Bytes("fake"))
                )
            ).to.be.revertedWith("Not assigned contractor");
        });
        
        it("Should reject invalid milestone percentages", async function () {
            await expect(
                contract.connect(contractor).submitMilestone(
                    tenderId,
                    30,
                    "QmTest",
                    "0,0",
                    "QmTest2",
                    ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test"))
                )
            ).to.be.revertedWith("Invalid milestone percentage");
        });
    });
    
    describe("5. Automatic Fund Release", function () {
        it("Should verify and release funds automatically", async function () {
            // Fund the contract
            await admin.sendTransaction({
                to: contract.address,
                value: ethers.utils.parseEther("10")
            });
            
            const initialBalance = await ethers.provider.getBalance(contractor.address);
            
            // Supervisor verifies milestone
            const tx = await contract.connect(supervisor).verifyAndReleaseFunds(
                milestoneId,
                true,  // qualityVerified
                true,  // gpsVerified
                true   // progressVerified
            );
            
            await tx.wait();
            
            const finalBalance = await ethers.provider.getBalance(contractor.address);
            const fundReleased = finalBalance.sub(initialBalance);
            
            // Should receive 20% of 10 ETH = 2 ETH
            expect(fundReleased).to.equal(ethers.utils.parseEther("2"));
            
            console.log(`   ✓ Funds released: ${ethers.utils.formatEther(fundReleased)} ETH`);
            
            // Verify milestone status
            const milestone = await contract.milestones(milestoneId);
            expect(milestone.status).to.equal(2); // Approved
        });
        
        it("Should reject milestone if verification fails", async function () {
            // Submit 40% milestone
            const tx = await contract.connect(contractor).submitMilestone(
                tenderId,
                40,
                "QmProofImages40",
                "28.6139,77.2090",
                "QmArchitecture40",
                ethers.utils.keccak256(ethers.utils.toUtf8Bytes("quality_metrics_40"))
            );
            
            const receipt = await tx.wait();
            const milestone40Id = receipt.events[0].args.milestoneId;
            
            // Fail verification
            await contract.connect(supervisor).verifyAndReleaseFunds(
                milestone40Id,
                false,  // qualityVerified = false
                true,
                true
            );
            
            const milestone = await contract.milestones(milestone40Id);
            expect(milestone.status).to.equal(3); // Rejected
            
            console.log(`   ✓ Invalid milestone rejected`);
        });
        
        it("Should mark project as completed at 100%", async function () {
            // Submit and approve remaining milestones
            const milestones = [60, 80, 100];
            
            for (const percentage of milestones) {
                const tx = await contract.connect(contractor).submitMilestone(
                    tenderId,
                    percentage,
                    `QmProof${percentage}`,
                    "28.6139,77.2090",
                    `QmArch${percentage}`,
                    ethers.utils.keccak256(ethers.utils.toUtf8Bytes(`quality_${percentage}`))
                );
                
                const receipt = await tx.wait();
                const mId = receipt.events[0].args.milestoneId;
                
                await contract.connect(supervisor).verifyAndReleaseFunds(
                    mId,
                    true,
                    true,
                    true
                );
            }
            
            // Check project status
            const project = await contract.projects(projectId);
            expect(project.status).to.equal(3); // Completed
            
            console.log(`   ✓ Project marked as Completed`);
        });
    });
    
    describe("6. View Functions", function () {
        it("Should return all tenders for a project", async function () {
            const tenders = await contract.getProjectTenders(projectId);
            expect(tenders.length).to.be.greaterThan(0);
            console.log(`   ✓ Found ${tenders.length} tender(s) for project ${projectId}`);
        });
        
        it("Should return tender details", async function () {
            const details = await contract.getTenderDetails(tenderId);
            expect(details.tenderDoc).to.equal("QmTenderDocument456");
            expect(details.contractor).to.equal(contractor.address);
        });
    });
    
    describe("7. Security Tests", function () {
        it("Should prevent unauthorized fund release", async function () {
            // Create new project and milestone
            const supervisorCommitment = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(['address'], [supervisor.address])
            );
            
            const projectTx = await contract.connect(admin).createProject(
                "Security Test Project",
                ethers.utils.parseEther("5"),
                supervisorCommitment
            );
            
            const projectReceipt = await projectTx.wait();
            const secProjectId = projectReceipt.events[0].args.projectId;
            
            const secNonce = ethers.utils.hexlify(ethers.utils.randomBytes(32));
            const secCommitment = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ['address', 'bytes32'],
                    [contractor.address, secNonce]
                )
            );
            
            const tenderTx = await contract.connect(contractor).submitAnonymousTender(
                secProjectId,
                secCommitment,
                "QmSec1",
                "QmSec2",
                "QmSec3"
            );
            
            const tenderReceipt = await tenderTx.wait();
            const secTenderId = tenderReceipt.events[0].args.tenderId;
            
            await contract.connect(supervisor).approveTender(
                secTenderId,
                contractor.address,
                secNonce
            );
            
            const milestoneTx = await contract.connect(contractor).submitMilestone(
                secTenderId,
                20,
                "QmSecProof",
                "28.6139,77.2090",
                "QmSecArch",
                ethers.utils.keccak256(ethers.utils.toUtf8Bytes("sec_quality"))
            );
            
            const milestoneReceipt = await milestoneTx.wait();
            const secMilestoneId = milestoneReceipt.events[0].args.milestoneId;
            
            // Try to release funds as citizen (not supervisor)
            await expect(
                contract.connect(citizen).verifyAndReleaseFunds(
                    secMilestoneId,
                    true,
                    true,
                    true
                )
            ).to.be.revertedWith("Not authorized supervisor");
            
            console.log(`   ✓ Unauthorized fund release prevented`);
        });
    });
});
