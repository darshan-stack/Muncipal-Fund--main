// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FundTracker {
    struct Project {
        uint256 id;
        string name;
        uint256 budget;
        uint256 allocatedFunds;
        uint256 spentFunds;
        address admin;
        bytes32 supervisorCommitment; // Hash of supervisor address for anonymity
        ProjectStatus status;
        string location;
        uint256 createdAt;
        bool exists;
    }
    
    struct Tender {
        uint256 id;
        uint256 projectId;
        bytes32 contractorCommitment; // Hash(contractor_address + nonce)
        string encryptedContractorDataIPFS;
        string tenderDocumentIPFS;
        string qualityReportIPFS;
        TenderStatus status;
        uint256 submittedAt;
    }
    
    struct Milestone {
        uint256 id;
        uint256 projectId;
        uint256 tenderId;
        uint8 percentageComplete; // 20, 40, 60, 80, 100
        string proofImagesIPFS;
        string gpsCoordinates;
        string architectureDocsIPFS;
        bytes32 qualityHash;
        uint256 targetAmount;
        uint256 spentAmount;
        MilestoneStatus status;
        uint256 submittedAt;
        uint256 approvedAt;
        string rejectionReason;
        bool exists;
    }
    
    struct Expenditure {
        uint256 id;
        uint256 projectId;
        uint256 milestoneId;
        uint256 amount;
        string description;
        address recipient;
        uint256 timestamp;
    }
    
    enum ProjectStatus { Created, TenderAssigned, InProgress, Completed }
    enum TenderStatus { Submitted, UnderReview, Approved, Rejected }
    enum MilestoneStatus { Pending, Submitted, Approved, Rejected }
    
    uint256 public projectCount = 0;
    uint256 public tenderCount = 0;
    uint256 public milestoneCount = 0;
    uint256 public expenditureCount = 0;
    
    mapping(uint256 => Project) public projects;
    mapping(uint256 => Tender) public tenders;
    mapping(uint256 => Milestone) public milestones;
    mapping(uint256 => Expenditure) public expenditures;
    mapping(uint256 => uint256[]) public projectTenders;
    mapping(uint256 => uint256[]) public projectMilestones;
    mapping(uint256 => uint256[]) public projectExpenditures;
    mapping(uint256 => address) public revealedContractors; // tenderId => contractor address
    
    event ProjectCreated(uint256 indexed projectId, string name, uint256 budget, address admin, uint256 timestamp);
    event FundsAllocated(uint256 indexed projectId, uint256 amount);
    event TenderSubmitted(uint256 indexed tenderId, uint256 indexed projectId, bytes32 contractorCommitment);
    event TenderApproved(uint256 indexed tenderId, address revealedContractor);
    event TenderRejected(uint256 indexed tenderId, string reason);
    event MilestoneCreated(uint256 indexed milestoneId, uint256 indexed projectId, uint8 percentage, uint256 targetAmount);
    event MilestoneSubmitted(uint256 indexed milestoneId, uint256 indexed tenderId, uint8 percentage);
    event MilestoneApproved(uint256 indexed milestoneId, uint256 amountReleased);
    event MilestoneRejected(uint256 indexed milestoneId, string reason);
    event FundsReleased(uint256 indexed projectId, address contractor, uint256 amount, uint8 milestone);
    event ExpenditureRecorded(uint256 indexed expenditureId, uint256 indexed projectId, uint256 amount, address recipient);
    
    modifier projectExists(uint256 projectId) {
        require(projects[projectId].exists, "Project does not exist");
        _;
    }
    
    modifier onlyAdmin(uint256 projectId) {
        require(projects[projectId].admin == msg.sender, "Only admin can perform this action");
        _;
    }
    
    modifier onlySupervisor(uint256 projectId) {
        bytes32 supervisorHash = keccak256(abi.encodePacked(msg.sender));
        require(supervisorHash == projects[projectId].supervisorCommitment, "Not authorized supervisor");
        _;
    }
    
    // 1. Admin creates project with hidden supervisor
    function createProject(
        string memory _name, 
        uint256 _budget,
        bytes32 _supervisorCommitment,
        string memory _location
    ) external returns (uint256) {
        projectCount++;
        
        projects[projectCount] = Project({
            id: projectCount,
            name: _name,
            budget: _budget,
            allocatedFunds: 0,
            spentFunds: 0,
            admin: msg.sender,
            supervisorCommitment: _supervisorCommitment,
            status: ProjectStatus.Created,
            location: _location,
            createdAt: block.timestamp,
            exists: true
        });
        
        emit ProjectCreated(projectCount, _name, _budget, msg.sender, block.timestamp);
        return projectCount;
    }
    
    // 2. Contractor submits anonymous tender
    function submitAnonymousTender(
        uint256 _projectId,
        bytes32 _contractorCommitment,
        string memory _encryptedContractorDataIPFS,
        string memory _tenderDocIPFS,
        string memory _qualityReportIPFS
    ) external projectExists(_projectId) returns (uint256) {
        require(projects[_projectId].status == ProjectStatus.Created, "Project not accepting tenders");
        
        tenderCount++;
        
        tenders[tenderCount] = Tender({
            id: tenderCount,
            projectId: _projectId,
            contractorCommitment: _contractorCommitment,
            encryptedContractorDataIPFS: _encryptedContractorDataIPFS,
            tenderDocumentIPFS: _tenderDocIPFS,
            qualityReportIPFS: _qualityReportIPFS,
            status: TenderStatus.Submitted,
            submittedAt: block.timestamp
        });
        
        projectTenders[_projectId].push(tenderCount);
        
        emit TenderSubmitted(tenderCount, _projectId, _contractorCommitment);
        return tenderCount;
    }
    
    // 3. Supervisor approves tender (BLIND - doesn't know contractor)
    function approveTender(
        uint256 _tenderId,
        address _revealedContractor,
        bytes32 _nonce
    ) external {
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
    ) external returns (uint256) {
        require(tenders[_tenderId].status == TenderStatus.Approved, "Tender not approved");
        require(msg.sender == revealedContractors[_tenderId], "Not assigned contractor");
        require(
            _percentageComplete == 20 || _percentageComplete == 40 || 
            _percentageComplete == 60 || _percentageComplete == 80 || _percentageComplete == 100,
            "Invalid milestone percentage"
        );
        
        milestoneCount++;
        uint256 projectId = tenders[_tenderId].projectId;
        uint256 targetAmount = (projects[projectId].budget * _percentageComplete) / 100;
        
        milestones[milestoneCount] = Milestone({
            id: milestoneCount,
            projectId: projectId,
            tenderId: _tenderId,
            percentageComplete: _percentageComplete,
            proofImagesIPFS: _proofImagesIPFS,
            gpsCoordinates: _gpsCoordinates,
            architectureDocsIPFS: _architectureDocsIPFS,
            qualityHash: _qualityHash,
            targetAmount: targetAmount,
            spentAmount: 0,
            status: MilestoneStatus.Submitted,
            submittedAt: block.timestamp,
            approvedAt: 0,
            rejectionReason: "",
            exists: true
        });
        
        projectMilestones[projectId].push(milestoneCount);
        
        emit MilestoneSubmitted(milestoneCount, _tenderId, _percentageComplete);
        return milestoneCount;
    }
    
    // 5. Smart contract AUTOMATICALLY verifies and releases funds
    function verifyAndReleaseFunds(
        uint256 _milestoneId,
        bool _qualityVerified,
        bool _gpsVerified,
        bool _progressVerified
    ) external payable {
        Milestone storage milestone = milestones[_milestoneId];
        uint256 projectId = milestone.projectId;
        
        require(
            keccak256(abi.encodePacked(msg.sender)) == projects[projectId].supervisorCommitment,
            "Not authorized supervisor"
        );
        
        if (_qualityVerified && _gpsVerified && _progressVerified) {
            milestone.status = MilestoneStatus.Approved;
            milestone.approvedAt = block.timestamp;
            
            // Calculate and transfer funds AUTOMATICALLY
            uint256 fundToRelease = milestone.targetAmount;
            address contractor = revealedContractors[milestone.tenderId];
            
            projects[projectId].allocatedFunds += fundToRelease;
            projects[projectId].spentFunds += fundToRelease;
            
            if (milestone.percentageComplete == 100) {
                projects[projectId].status = ProjectStatus.Completed;
            } else {
                projects[projectId].status = ProjectStatus.InProgress;
            }
            
            // Transfer funds to contractor
            if (address(this).balance >= fundToRelease) {
                payable(contractor).transfer(fundToRelease);
            }
            
            emit MilestoneApproved(_milestoneId, fundToRelease);
            emit FundsReleased(projectId, contractor, fundToRelease, milestone.percentageComplete);
        } else {
            milestone.status = MilestoneStatus.Rejected;
            milestone.rejectionReason = "Quality/GPS/Progress verification failed";
            
            emit MilestoneRejected(_milestoneId, "Quality/GPS/Progress verification failed");
        }
    }
    
    // Record expenditure
    function recordExpenditure(
        uint256 _projectId,
        uint256 _milestoneId,
        uint256 _amount,
        string memory _description,
        address _recipient
    ) 
        external 
        projectExists(_projectId)
        returns (uint256)
    {
        require(
            projects[_projectId].admin == msg.sender || 
            keccak256(abi.encodePacked(msg.sender)) == projects[_projectId].supervisorCommitment,
            "Not authorized"
        );
        
        Project storage project = projects[_projectId];
        require(project.spentFunds + _amount <= project.allocatedFunds, "Expenditure exceeds allocated funds");
        
        expenditureCount++;
        
        expenditures[expenditureCount] = Expenditure({
            id: expenditureCount,
            projectId: _projectId,
            milestoneId: _milestoneId,
            amount: _amount,
            description: _description,
            recipient: _recipient,
            timestamp: block.timestamp
        });
        
        if (_milestoneId > 0 && milestones[_milestoneId].exists) {
            milestones[_milestoneId].spentAmount += _amount;
        }
        
        projectExpenditures[_projectId].push(expenditureCount);
        emit ExpenditureRecorded(expenditureCount, _projectId, _amount, _recipient);
        return expenditureCount;
    }
    
    // View functions
    function getProject(uint256 _projectId) 
        external 
        view 
        projectExists(_projectId) 
        returns (Project memory) 
    {
        return projects[_projectId];
    }
    
    function getMilestone(uint256 _milestoneId) 
        external 
        view 
        returns (
            uint256 id,
            uint256 projectId,
            uint256 tenderId,
            uint8 percentageComplete,
            uint256 targetAmount,
            uint256 spentAmount,
            MilestoneStatus status,
            uint256 submittedAt,
            uint256 approvedAt
        ) 
    {
        require(milestones[_milestoneId].exists, "Milestone does not exist");
        Milestone storage m = milestones[_milestoneId];
        return (
            m.id,
            m.projectId,
            m.tenderId,
            m.percentageComplete,
            m.targetAmount,
            m.spentAmount,
            m.status,
            m.submittedAt,
            m.approvedAt
        );
    }
    
    function getMilestoneDocuments(uint256 _milestoneId)
        external
        view
        returns (
            string memory proofImagesIPFS,
            string memory gpsCoordinates,
            string memory architectureDocsIPFS,
            bytes32 qualityHash,
            string memory rejectionReason
        )
    {
        require(milestones[_milestoneId].exists, "Milestone does not exist");
        Milestone storage m = milestones[_milestoneId];
        return (
            m.proofImagesIPFS,
            m.gpsCoordinates,
            m.architectureDocsIPFS,
            m.qualityHash,
            m.rejectionReason
        );
    }
    
    function getTender(uint256 _tenderId) 
        external 
        view 
        returns (Tender memory) 
    {
        return tenders[_tenderId];
    }
    
    function getProjectTenders(uint256 _projectId) 
        external 
        view 
        projectExists(_projectId) 
        returns (uint256[] memory) 
    {
        return projectTenders[_projectId];
    }
    
    function getProjectMilestones(uint256 _projectId) 
        external 
        view 
        projectExists(_projectId) 
        returns (uint256[] memory) 
    {
        return projectMilestones[_projectId];
    }
    
    function getProjectExpenditures(uint256 _projectId) 
        external 
        view 
        projectExists(_projectId) 
        returns (uint256[] memory) 
    {
        return projectExpenditures[_projectId];
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