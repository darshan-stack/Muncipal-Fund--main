// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AnonymousTenderSystem {
    
    struct Project {
        uint256 projectId;
        string projectName;
        uint256 budget;
        address admin;
        bytes32 supervisorCommitment; // Hash of supervisor address
        ProjectStatus status;
        uint256 createdAt;
    }
    
    struct Tender {
        uint256 tenderId;
        uint256 projectId;
        bytes32 contractorCommitment; // Hash(contractor_address + nonce)
        string encryptedContractorDataIPFS; // IPFS hash of encrypted contractor details
        string tenderDocumentIPFS; // Public tender documents
        string invoiceIPFS;
        string qualityReportIPFS;
        TenderStatus status;
        uint256 submittedAt;
    }
    
    struct Milestone {
        uint256 milestoneId;
        uint256 projectId;
        uint256 tenderId;
        uint8 percentageComplete; // 20, 40, 60, 80, 100
        string proofImagesIPFS; // Multiple images
        string gpsCoordinates;
        string architectureDocsIPFS;
        bytes32 qualityHash; // Hash of quality metrics
        MilestoneStatus status;
        uint256 submittedAt;
        uint256 approvedAt;
        string rejectionReason;
    }
    
    enum ProjectStatus { Created, TenderAssigned, InProgress, Completed }
    enum TenderStatus { Submitted, UnderReview, Approved, Rejected }
    enum MilestoneStatus { Pending, Submitted, Approved, Rejected }
    
    mapping(uint256 => Project) public projects;
    mapping(uint256 => Tender) public tenders;
    mapping(uint256 => Milestone) public milestones;
    mapping(uint256 => uint256[]) public projectTenders; // projectId => tenderIds[]
    mapping(uint256 => address) public revealedContractors; // tenderId => contractor address
    
    uint256 public projectCounter;
    uint256 public tenderCounter;
    uint256 public milestoneCounter;
    
    // Events
    event ProjectCreated(uint256 indexed projectId, string projectName, uint256 budget, address admin);
    event TenderSubmitted(uint256 indexed tenderId, uint256 indexed projectId, bytes32 contractorCommitment);
    event TenderApproved(uint256 indexed tenderId, address revealedContractor);
    event TenderRejected(uint256 indexed tenderId, string reason);
    event MilestoneSubmitted(uint256 indexed milestoneId, uint256 indexed tenderId, uint8 percentage);
    event MilestoneApproved(uint256 indexed milestoneId, uint256 amountReleased);
    event MilestoneRejected(uint256 indexed milestoneId, string reason);
    event FundsReleased(uint256 indexed projectId, address contractor, uint256 amount, uint8 milestone);
    
    // Modifiers
    modifier onlyAdmin(uint256 projectId) {
        require(msg.sender == projects[projectId].admin, "Not project admin");
        _;
    }
    
    modifier onlySupervisor(uint256 projectId) {
        bytes32 supervisorHash = keccak256(abi.encodePacked(msg.sender));
        require(supervisorHash == projects[projectId].supervisorCommitment, "Not authorized supervisor");
        _;
    }
    
    // 1. Admin creates project with hidden supervisor
    function createProject(
        string memory _projectName,
        uint256 _budget,
        bytes32 _supervisorCommitment
    ) public returns (uint256) {
        projectCounter++;
        
        projects[projectCounter] = Project({
            projectId: projectCounter,
            projectName: _projectName,
            budget: _budget,
            admin: msg.sender,
            supervisorCommitment: _supervisorCommitment,
            status: ProjectStatus.Created,
            createdAt: block.timestamp
        });
        
        emit ProjectCreated(projectCounter, _projectName, _budget, msg.sender);
        return projectCounter;
    }
    
    // 2. Contractor submits anonymous tender
    function submitAnonymousTender(
        uint256 _projectId,
        bytes32 _contractorCommitment,
        string memory _encryptedContractorDataIPFS,
        string memory _tenderDocIPFS,
        string memory _qualityReportIPFS
    ) public returns (uint256) {
        require(projects[_projectId].status == ProjectStatus.Created, "Project not accepting tenders");
        
        tenderCounter++;
        
        tenders[tenderCounter] = Tender({
            tenderId: tenderCounter,
            projectId: _projectId,
            contractorCommitment: _contractorCommitment,
            encryptedContractorDataIPFS: _encryptedContractorDataIPFS,
            tenderDocumentIPFS: _tenderDocIPFS,
            invoiceIPFS: "",
            qualityReportIPFS: _qualityReportIPFS,
            status: TenderStatus.Submitted,
            submittedAt: block.timestamp
        });
        
        projectTenders[_projectId].push(tenderCounter);
        
        emit TenderSubmitted(tenderCounter, _projectId, _contractorCommitment);
        return tenderCounter;
    }
    
    // 3. Supervisor approves tender (BLIND - doesn't know contractor)
    function approveTender(
        uint256 _tenderId,
        address _revealedContractor,
        bytes32 _nonce
    ) public {
        Tender storage tender = tenders[_tenderId];
        uint256 projectId = tender.projectId;
        
        // Verify caller is the committed supervisor
        require(
            keccak256(abi.encodePacked(msg.sender)) == projects[projectId].supervisorCommitment,
            "Not authorized supervisor"
        );
        
        // Verify contractor identity matches commitment
        bytes32 calculatedCommitment = keccak256(abi.encodePacked(_revealedContractor, _nonce));
        require(calculatedCommitment == tender.contractorCommitment, "Invalid contractor reveal");
        
        tender.status = TenderStatus.Approved;
        revealedContractors[_tenderId] = _revealedContractor;
        projects[projectId].status = ProjectStatus.TenderAssigned;
        
        emit TenderApproved(_tenderId, _revealedContractor);
    }
    
    // 4. Contractor submits milestone (20%, 40%, 60%, 80%, 100%)
    function submitMilestone(
        uint256 _tenderId,
        uint8 _percentageComplete,
        string memory _proofImagesIPFS,
        string memory _gpsCoordinates,
        string memory _architectureDocsIPFS,
        bytes32 _qualityHash
    ) public returns (uint256) {
        require(tenders[_tenderId].status == TenderStatus.Approved, "Tender not approved");
        require(msg.sender == revealedContractors[_tenderId], "Not assigned contractor");
        require(
            _percentageComplete == 20 || _percentageComplete == 40 || 
            _percentageComplete == 60 || _percentageComplete == 80 || 
            _percentageComplete == 100,
            "Invalid milestone percentage"
        );
        
        milestoneCounter++;
        
        milestones[milestoneCounter] = Milestone({
            milestoneId: milestoneCounter,
            projectId: tenders[_tenderId].projectId,
            tenderId: _tenderId,
            percentageComplete: _percentageComplete,
            proofImagesIPFS: _proofImagesIPFS,
            gpsCoordinates: _gpsCoordinates,
            architectureDocsIPFS: _architectureDocsIPFS,
            qualityHash: _qualityHash,
            status: MilestoneStatus.Submitted,
            submittedAt: block.timestamp,
            approvedAt: 0,
            rejectionReason: ""
        });
        
        emit MilestoneSubmitted(milestoneCounter, _tenderId, _percentageComplete);
        return milestoneCounter;
    }
    
    // 5. Smart contract AUTOMATICALLY verifies and releases funds
    function verifyAndReleaseFunds(
        uint256 _milestoneId,
        bool _qualityVerified,
        bool _gpsVerified,
        bool _progressVerified
    ) public onlySupervisor(milestones[_milestoneId].projectId) {
        Milestone storage milestone = milestones[_milestoneId];
        
        if (_qualityVerified && _gpsVerified && _progressVerified) {
            milestone.status = MilestoneStatus.Approved;
            milestone.approvedAt = block.timestamp;
            
            // Calculate payment
            uint256 projectId = milestone.projectId;
            uint256 payment = (projects[projectId].budget * milestone.percentageComplete) / 100;
            
            // Transfer funds to contractor
            address contractor = revealedContractors[milestone.tenderId];
            payable(contractor).transfer(payment);
            
            emit MilestoneApproved(_milestoneId, payment);
            emit FundsReleased(projectId, contractor, payment, milestone.percentageComplete);
            
            // Mark project as complete if 100%
            if (milestone.percentageComplete == 100) {
                projects[projectId].status = ProjectStatus.Completed;
            }
        } else {
            milestone.status = MilestoneStatus.Rejected;
            milestone.rejectionReason = "Verification failed";
            emit MilestoneRejected(_milestoneId, "Quality/GPS/Progress verification failed");
        }
    }
    
    // View functions for transparency
    function getProjectTenders(uint256 _projectId) public view returns (uint256[] memory) {
        return projectTenders[_projectId];
    }
    
    function getTenderDetails(uint256 _tenderId) public view returns (
        string memory tenderDoc,
        string memory qualityReport,
        TenderStatus status,
        address contractor
    ) {
        Tender memory tender = tenders[_tenderId];
        return (
            tender.tenderDocumentIPFS,
            tender.qualityReportIPFS,
            tender.status,
            tender.status == TenderStatus.Approved ? revealedContractors[_tenderId] : address(0)
        );
    }
    
    // Allow contract to receive funds
    receive() external payable {}
}
