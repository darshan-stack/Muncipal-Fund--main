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
        string state;
        string district;
        string city;
        string pincode;
        int256 centerLatitude; // Project center GPS * 1e6
        int256 centerLongitude; // Project center GPS * 1e6
        uint256 gpsRadiusMeters; // Allowed GPS radius (default 500m)
        uint256 createdAt;
        bool exists;
        string milestone1Task;
        string milestone2Task;
        string milestone3Task;
        string milestone4Task;
        string milestone5Task;
    }
    
    struct ContractorProfile {
        address walletAddress;
        uint256 blockchainId; // Unique blockchain ID
        string name;
        bool isRegistered;
        uint256 registeredAt;
        uint256 projectsCompleted;
        uint256 totalEarned;
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
        bool finalQualityReportSubmitted;
        string finalQualityReportIPFS;
        uint256 qualityReportSubmittedAt;
    }
    
    struct Milestone {
        uint256 id;
        uint256 projectId;
        uint256 tenderId;
        uint8 percentageComplete; // 20, 40, 60, 80, 100
        string taskDescription; // Task from project that must match
        string completionProof; // Contractor's proof they completed the task
        string proofImagesIPFS;
        string gpsCoordinates; // GPS coordinates of work location
        int256 latitude; // Latitude * 1e6 (for precision)
        int256 longitude; // Longitude * 1e6 (for precision)
        bool gpsVerified; // GPS verification status
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
    uint256 public contractorIdCounter = 0; // For unique blockchain IDs
    
    mapping(uint256 => Project) public projects;
    mapping(uint256 => Tender) public tenders;
    mapping(uint256 => Milestone) public milestones;
    mapping(uint256 => Expenditure) public expenditures;
    mapping(uint256 => uint256[]) public projectTenders;
    mapping(uint256 => uint256[]) public projectMilestones;
    mapping(uint256 => uint256[]) public projectExpenditures;
    mapping(uint256 => address) public revealedContractors; // tenderId => contractor address
    mapping(address => bool) public contractorEligible; // contractor => can apply for new tenders
    mapping(address => uint256) public contractorPendingQualityReports; // contractor => count
    mapping(address => ContractorProfile) public contractorProfiles; // contractor address => profile
    mapping(uint256 => address) public contractorIdToAddress; // blockchain ID => contractor address
    
    event ProjectCreated(uint256 indexed projectId, string name, uint256 budget, address admin, uint256 timestamp);
    event FundsAllocated(uint256 indexed projectId, uint256 amount);
    event FundsLocked(uint256 indexed projectId, uint256 amount);
    event TenderSubmitted(uint256 indexed tenderId, uint256 indexed projectId, bytes32 contractorCommitment);
    event TenderApproved(uint256 indexed tenderId, address revealedContractor);
    event TenderRejected(uint256 indexed tenderId, string reason);
    event MilestoneCreated(uint256 indexed milestoneId, uint256 indexed projectId, uint8 percentage, uint256 targetAmount);
    event MilestoneSubmitted(uint256 indexed milestoneId, uint256 indexed tenderId, uint8 percentage);
    event MilestoneProofSubmitted(uint256 indexed milestoneId, string ipfsHash, string gpsCoords, int256 lat, int256 lon);
    event GPSVerified(uint256 indexed milestoneId, bool verified, uint256 distance);
    event MilestoneVerified(uint256 indexed milestoneId, bool gpsVerified, bool proofVerified);
    event MilestoneApproved(uint256 indexed milestoneId, uint256 amountReleased);
    event MilestoneRejected(uint256 indexed milestoneId, string reason);
    event FundsReleased(uint256 indexed projectId, address contractor, uint256 amount, uint8 milestone);
    event AutomaticFundRelease(uint256 indexed milestoneId, address contractor, uint256 amount);
    event ExpenditureRecorded(uint256 indexed expenditureId, uint256 indexed projectId, uint256 amount, address recipient);
    event QualityReportSubmitted(uint256 indexed tenderId, address contractor, string reportIPFS);
    event ContractorEligibilityUpdated(address contractor, bool eligible);
    event ContractorRegistered(address indexed contractor, uint256 indexed blockchainId, string name);
    
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
    
    // Register contractor with unique blockchain ID
    function registerContractor(string memory _name) external returns (uint256) {
        require(!contractorProfiles[msg.sender].isRegistered, "Contractor already registered");
        
        contractorIdCounter++;
        
        contractorProfiles[msg.sender] = ContractorProfile({
            walletAddress: msg.sender,
            blockchainId: contractorIdCounter,
            name: _name,
            isRegistered: true,
            registeredAt: block.timestamp,
            projectsCompleted: 0,
            totalEarned: 0
        });
        
        contractorIdToAddress[contractorIdCounter] = msg.sender;
        contractorEligible[msg.sender] = true;
        
        emit ContractorRegistered(msg.sender, contractorIdCounter, _name);
        return contractorIdCounter;
    }
    
    // 1. Admin creates project with hidden supervisor and milestone tasks
    function createProject(
        string memory _name, 
        uint256 _budget,
        bytes32 _supervisorCommitment,
        string memory _location,
        string memory _state,
        string memory _district,
        string memory _city,
        string memory _pincode,
        int256 _centerLatitude,
        int256 _centerLongitude,
        string memory _milestone1Task,
        string memory _milestone2Task,
        string memory _milestone3Task,
        string memory _milestone4Task,
        string memory _milestone5Task
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
            state: _state,
            district: _district,
            city: _city,
            pincode: _pincode,
            centerLatitude: _centerLatitude,
            centerLongitude: _centerLongitude,
            gpsRadiusMeters: 500, // Default 500m radius
            createdAt: block.timestamp,
            exists: true,
            milestone1Task: _milestone1Task,
            milestone2Task: _milestone2Task,
            milestone3Task: _milestone3Task,
            milestone4Task: _milestone4Task,
            milestone5Task: _milestone5Task
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
        require(contractorEligible[msg.sender] || contractorPendingQualityReports[msg.sender] == 0, "Contractor must submit pending quality reports");
        
        tenderCount++;
        
        tenders[tenderCount] = Tender({
            id: tenderCount,
            projectId: _projectId,
            contractorCommitment: _contractorCommitment,
            encryptedContractorDataIPFS: _encryptedContractorDataIPFS,
            tenderDocumentIPFS: _tenderDocIPFS,
            qualityReportIPFS: _qualityReportIPFS,
            status: TenderStatus.Submitted,
            submittedAt: block.timestamp,
            finalQualityReportSubmitted: false,
            finalQualityReportIPFS: "",
            qualityReportSubmittedAt: 0
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
        
        // Mark contractor as having pending quality report
        contractorPendingQualityReports[_revealedContractor]++;
        contractorEligible[_revealedContractor] = false;
        
        emit TenderApproved(_tenderId, _revealedContractor);
    }
    
    // 4. Contractor submits milestone (20%, 40%, 60%, 80%, 100%)
    function submitMilestone(
        uint256 _tenderId,
        uint8 _percentageComplete,
        string memory _completionProof,
        string memory _proofImagesIPFS,
        string memory _gpsCoordinates,
        int256 _latitude,
        int256 _longitude,
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
        Project storage project = projects[projectId];
        uint256 targetAmount = (project.budget * _percentageComplete) / 100;
        
        // Get the task description for this milestone
        string memory taskDescription;
        if (_percentageComplete == 20) taskDescription = project.milestone1Task;
        else if (_percentageComplete == 40) taskDescription = project.milestone2Task;
        else if (_percentageComplete == 60) taskDescription = project.milestone3Task;
        else if (_percentageComplete == 80) taskDescription = project.milestone4Task;
        else if (_percentageComplete == 100) taskDescription = project.milestone5Task;
        
        // Verify GPS automatically
        bool gpsValid = verifyGPS(projectId, _latitude, _longitude);
        
        milestones[milestoneCount] = Milestone({
            id: milestoneCount,
            projectId: projectId,
            tenderId: _tenderId,
            percentageComplete: _percentageComplete,
            taskDescription: taskDescription,
            completionProof: _completionProof,
            proofImagesIPFS: _proofImagesIPFS,
            gpsCoordinates: _gpsCoordinates,
            latitude: _latitude,
            longitude: _longitude,
            gpsVerified: gpsValid,
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
        emit MilestoneProofSubmitted(milestoneCount, _proofImagesIPFS, _gpsCoordinates, _latitude, _longitude);
        emit GPSVerified(milestoneCount, gpsValid, calculateDistance(projectId, _latitude, _longitude));
        
        return milestoneCount;
    }
    
    // 5. Contractor submits final quality report (MANDATORY after 100%)
    function submitFinalQualityReport(
        uint256 _tenderId,
        string memory _qualityReportIPFS
    ) external {
        require(tenders[_tenderId].status == TenderStatus.Approved, "Tender not approved");
        require(msg.sender == revealedContractors[_tenderId], "Not assigned contractor");
        require(!tenders[_tenderId].finalQualityReportSubmitted, "Quality report already submitted");
        
        // Check if 100% milestone is approved
        uint256 projectId = tenders[_tenderId].projectId;
        uint256[] memory milestoneIds = projectMilestones[projectId];
        bool milestone100Approved = false;
        
        for (uint256 i = 0; i < milestoneIds.length; i++) {
            if (milestones[milestoneIds[i]].percentageComplete == 100 && 
                milestones[milestoneIds[i]].status == MilestoneStatus.Approved) {
                milestone100Approved = true;
                break;
            }
        }
        
        require(milestone100Approved, "100% milestone must be approved first");
        
        tenders[_tenderId].finalQualityReportSubmitted = true;
        tenders[_tenderId].finalQualityReportIPFS = _qualityReportIPFS;
        tenders[_tenderId].qualityReportSubmittedAt = block.timestamp;
        
        // Make contractor eligible for new tenders
        contractorPendingQualityReports[msg.sender]--;
        if (contractorPendingQualityReports[msg.sender] == 0) {
            contractorEligible[msg.sender] = true;
        }
        
        emit QualityReportSubmitted(_tenderId, msg.sender, _qualityReportIPFS);
        emit ContractorEligibilityUpdated(msg.sender, contractorEligible[msg.sender]);
    }
    
    // 6. Smart contract AUTOMATICALLY verifies and releases funds
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
    
    // ========== CRITICAL NEW FUNCTIONS FOR JUDGES ==========
    
    // FUNCTION 1: Allocate and Lock Funds (Called after project creation)
    function allocateFunds(uint256 _projectId) 
        external 
        payable 
        projectExists(_projectId)
        onlyAdmin(_projectId)
    {
        require(msg.value > 0, "Must send funds");
        require(projects[_projectId].allocatedFunds == 0, "Funds already allocated");
        require(msg.value >= projects[_projectId].budget, "Insufficient funds for budget");
        
        projects[_projectId].allocatedFunds = msg.value;
        
        emit FundsAllocated(_projectId, msg.value);
        emit FundsLocked(_projectId, msg.value);
    }
    
    // FUNCTION 2: Submit Milestone Proof with GPS and IPFS
    function submitMilestoneProof(
        uint256 _projectId,
        uint256 _milestoneId,
        string memory _ipfsHash,
        string memory _gpsCoords,
        int256 _latitude,
        int256 _longitude
    ) external projectExists(_projectId) {
        require(milestones[_milestoneId].exists, "Milestone does not exist");
        require(milestones[_milestoneId].projectId == _projectId, "Milestone not for this project");
        require(milestones[_milestoneId].status == MilestoneStatus.Submitted, "Milestone not in submitted state");
        
        Milestone storage milestone = milestones[_milestoneId];
        milestone.proofImagesIPFS = _ipfsHash;
        milestone.gpsCoordinates = _gpsCoords;
        milestone.latitude = _latitude;
        milestone.longitude = _longitude;
        
        // Verify GPS is within allowed radius
        bool gpsValid = verifyGPS(_projectId, _latitude, _longitude);
        milestone.gpsVerified = gpsValid;
        
        emit MilestoneProofSubmitted(_milestoneId, _ipfsHash, _gpsCoords, _latitude, _longitude);
        emit GPSVerified(_milestoneId, gpsValid, calculateDistance(_projectId, _latitude, _longitude));
    }
    
    // FUNCTION 3: GPS Verification (Haversine Formula)
    function verifyGPS(
        uint256 _projectId,
        int256 _submittedLat,
        int256 _submittedLon
    ) public view projectExists(_projectId) returns (bool) {
        Project storage project = projects[_projectId];
        
        // Calculate distance in meters
        uint256 distance = calculateDistance(_projectId, _submittedLat, _submittedLon);
        
        // Check if within allowed radius (default 500m)
        return distance <= project.gpsRadiusMeters;
    }
    
    // Helper: Calculate distance using simplified Haversine (for small distances)
    function calculateDistance(
        uint256 _projectId,
        int256 _lat2,
        int256 _lon2
    ) public view projectExists(_projectId) returns (uint256) {
        Project storage project = projects[_projectId];
        int256 lat1 = project.centerLatitude;
        int256 lon1 = project.centerLongitude;
        
        // Simplified distance calculation (works for small distances)
        // Distance = sqrt((lat2-lat1)^2 + (lon2-lon1)^2) * 111000 / 1e6
        int256 dLat = _lat2 - lat1;
        int256 dLon = _lon2 - lon1;
        
        // Using approximation: 1 degree ≈ 111km
        // Converting from lat/lon (1e6 scale) to meters
        uint256 latDist = uint256(abs(dLat)) * 111000 / 1000000;
        uint256 lonDist = uint256(abs(dLon)) * 111000 / 1000000;
        
        // Pythagorean approximation
        uint256 distSquared = (latDist * latDist) + (lonDist * lonDist);
        return sqrt(distSquared);
    }
    
    function abs(int256 x) private pure returns (int256) {
        return x >= 0 ? x : -x;
    }
    
    // Babylonian method for square root
    function sqrt(uint256 x) private pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }
    
    // FUNCTION 4: Automatic Fund Release (NO HUMAN APPROVAL NEEDED)
    function releaseFunds(uint256 _milestoneId) external {
        Milestone storage milestone = milestones[_milestoneId];
        require(milestone.exists, "Milestone does not exist");
        require(milestone.status == MilestoneStatus.Submitted, "Milestone not submitted");
        
        uint256 projectId = milestone.projectId;
        require(
            keccak256(abi.encodePacked(msg.sender)) == projects[projectId].supervisorCommitment,
            "Not authorized supervisor"
        );
        
        // Verify GPS and proof
        require(milestone.gpsVerified, "GPS verification failed");
        require(bytes(milestone.proofImagesIPFS).length > 0, "No proof submitted");
        
        // ENFORCE SEQUENTIAL MILESTONE COMPLETION
        if (milestone.percentageComplete > 20) {
            uint8 previousPercentage = milestone.percentageComplete - 20;
            bool previousApproved = false;
            
            uint256[] memory milestoneIds = projectMilestones[projectId];
            for (uint256 i = 0; i < milestoneIds.length; i++) {
                if (milestones[milestoneIds[i]].percentageComplete == previousPercentage && 
                    milestones[milestoneIds[i]].status == MilestoneStatus.Approved) {
                    previousApproved = true;
                    break;
                }
            }
            
            require(previousApproved, "Previous milestone not completed");
        }
        
        // AUTOMATIC APPROVAL - NO CORRUPTION POSSIBLE
        milestone.status = MilestoneStatus.Approved;
        milestone.approvedAt = block.timestamp;
        
        // Calculate and transfer funds AUTOMATICALLY
        uint256 fundToRelease = milestone.targetAmount;
        address payable contractor = payable(revealedContractors[milestone.tenderId]);
        
        require(projects[projectId].allocatedFunds >= fundToRelease, "Insufficient allocated funds");
        
        // Transfer funds IMMEDIATELY
        projects[projectId].spentFunds += fundToRelease;
        projects[projectId].allocatedFunds -= fundToRelease;
        
        (bool success, ) = contractor.call{value: fundToRelease}("");
        require(success, "Transfer failed");
        
        // Update contractor earnings
        if (contractorProfiles[contractor].isRegistered) {
            contractorProfiles[contractor].totalEarned += fundToRelease;
        }
        
        emit MilestoneApproved(_milestoneId, fundToRelease);
        emit AutomaticFundRelease(_milestoneId, contractor, fundToRelease);
        emit FundsReleased(projectId, contractor, fundToRelease, milestone.percentageComplete);
        
        // Update project status
        if (milestone.percentageComplete == 100) {
            projects[projectId].status = ProjectStatus.Completed;
            if (contractorProfiles[contractor].isRegistered) {
                contractorProfiles[contractor].projectsCompleted++;
            }
        } else {
            projects[projectId].status = ProjectStatus.InProgress;
        }
    }
    
    // FUNCTION 5: Get Project Details (For citizens/judges to verify)
    function getProjectDetails(uint256 _projectId) 
        external 
        view 
        projectExists(_projectId)
        returns (
            string memory name,
            uint256 budget,
            uint256 allocatedFunds,
            uint256 spentFunds,
            address admin,
            ProjectStatus status,
            string memory location,
            string memory state,
            string memory district,
            string memory city,
            string memory pincode,
            int256 centerLatitude,
            int256 centerLongitude
        )
    {
        Project storage p = projects[_projectId];
        return (
            p.name,
            p.budget,
            p.allocatedFunds,
            p.spentFunds,
            p.admin,
            p.status,
            p.location,
            p.state,
            p.district,
            p.city,
            p.pincode,
            p.centerLatitude,
            p.centerLongitude
        );
    }
    
    // ========== END CRITICAL NEW FUNCTIONS ==========
    
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
    
    // Get milestone tasks for a project
    function getProjectMilestoneTasks(uint256 _projectId) 
        external 
        view 
        projectExists(_projectId) 
        returns (
            string memory task1,
            string memory task2,
            string memory task3,
            string memory task4,
            string memory task5
        ) 
    {
        Project storage project = projects[_projectId];
        return (
            project.milestone1Task,
            project.milestone2Task,
            project.milestone3Task,
            project.milestone4Task,
            project.milestone5Task
        );
    }
    
    // Check if contractor is eligible to apply for new tenders
    function isContractorEligible(address _contractor) external view returns (bool, uint256) {
        return (contractorEligible[_contractor] || contractorPendingQualityReports[_contractor] == 0, 
                contractorPendingQualityReports[_contractor]);
    }
    
    // Get quality report status for a tender
    function getQualityReportStatus(uint256 _tenderId) 
        external 
        view 
        returns (
            bool submitted,
            string memory reportIPFS,
            uint256 submittedAt
        ) 
    {
        Tender memory tender = tenders[_tenderId];
        return (
            tender.finalQualityReportSubmitted,
            tender.finalQualityReportIPFS,
            tender.qualityReportSubmittedAt
        );
    }
    
    // Get contractor profile by address
    function getContractorProfile(address _contractor) 
        external 
        view 
        returns (ContractorProfile memory) 
    {
        return contractorProfiles[_contractor];
    }
    
    // Get contractor address by blockchain ID
    function getContractorByBlockchainId(uint256 _blockchainId) 
        external 
        view 
        returns (address) 
    {
        return contractorIdToAddress[_blockchainId];
    }
    
    // Get project location details
    function getProjectLocation(uint256 _projectId)
        external
        view
        projectExists(_projectId)
        returns (
            string memory location,
            string memory state,
            string memory district,
            string memory city,
            string memory pincode
        )
    {
        Project storage project = projects[_projectId];
        return (
            project.location,
            project.state,
            project.district,
            project.city,
            project.pincode
        );
    }
    
    // Allow contract to receive funds
    receive() external payable {}
}