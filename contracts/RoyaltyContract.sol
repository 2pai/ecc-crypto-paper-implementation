// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "erc721a/contracts/extensions/ERC721AQueryable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RoyaltyContract is ERC721AQueryable, Ownable{

    event SalesActive(bool);
    event Sales(address indexed buyer, uint256 id);
    event Collaterlized(address indexed publisher, uint256 id);

    bool public isSalesActive;
    uint256 public PRICE;
    string public encryptedURI;
    string public md5FileHash;
    uint256 public authorBPS;
    address public authorAddress;
    address public publisherAddress;


    struct ISales {
        uint256 id;
        address buyer;
        bool isFullfilledCollateral;
        bool isVerifiedByUser;
        bool isDispute;
        bool isConfirmForDispute;
        uint256 buySalesEpoch;
        uint256 collateralEpoch;
        uint256 settleSalesEpoch;
        uint256 disputeEpoch;
    }

    mapping(uint256 => ISales) public dataSales;


    modifier onlyAuthor() {
        require(msg.sender == authorAddress);
        _;
    }
    constructor(
        string memory _secretURI, 
        string memory _md5FileHash, 
        uint256 _price, 
        address _author, 
        uint256 _authorBps
    ) 
        ERC721A("IDigitalAsset", "IDSA") 
    {
        encryptedURI = _secretURI;
        md5FileHash = _md5FileHash;
        PRICE = _price;
        authorBPS =  _authorBps;
        authorAddress = _author;
        publisherAddress = msg.sender;
    }

    function _startTokenId() internal pure override returns (uint256) {
        return 1;
    }
    function activate() external onlyAuthor() {
        isSalesActive = !isSalesActive;
        emit SalesActive(isSalesActive);
    }

    function buy() external payable {
        require(isSalesActive, "NOT_ACTIVE");
        require(msg.value >= PRICE * 2, "!FUND");

        uint256 _id = _nextTokenId();
        dataSales[_id] = ISales(_id, msg.sender, false, false, false, false, block.timestamp, 0, 0, 0);

        _mint(msg.sender, 1);

        emit Sales(msg.sender, _id);
    }

    function settleCollateral(uint256 _id) external payable onlyOwner() {
        require(msg.value >= PRICE * 2, "!FUND");
        ISales storage dataSale = dataSales[_id];

        require(!dataSale.isFullfilledCollateral, "!COLLATERALIZED");
        dataSale.collateralEpoch = block.timestamp;
        dataSale.isFullfilledCollateral = true;

        dataSales[_id] = dataSale;

        emit Collaterlized(msg.sender, _id);
    }
    function confirmSalesByUser(uint256 _id, bool _state) external {
        require(ownerOf(_id) == msg.sender, "NOT_OWNER");
        ISales storage dataSale = dataSales[_id];
        require(dataSale.isFullfilledCollateral, "!COLLATERALIZED");

        if(_state == false){
            dataSale.disputeEpoch = block.timestamp;
            dataSale.isDispute = true;
            payable(dataSale.buyer).transfer(PRICE); // return half collateral
            payable(publisherAddress).transfer(PRICE); // return half collateral
        }else if (_state == true){

            uint256 amountAuthor = PRICE * authorBPS / 10000;
            uint256 amountPublisher = PRICE * (10000 - authorBPS) / 10000;
            _burn(_id);
            dataSale.settleSalesEpoch = block.timestamp;
            dataSale.isVerifiedByUser = true;
            payable(dataSale.buyer).transfer(PRICE); // return half collateral
            payable(authorAddress).transfer(amountAuthor); // return half collateral
            payable(publisherAddress).transfer((PRICE*2) + amountPublisher); // return half collateral

        }
    }
    function settleDispute(uint256 _id, bool _state) external {
        ISales storage dataSale = dataSales[_id];
        require(dataSale.isDispute, "NOT_DISPUTE");

        uint256 amountAuthor = PRICE * authorBPS / 10000;
        uint256 amountPublisher = PRICE * (10000 - authorBPS) / 10000;

        if(msg.sender == publisherAddress){
            if(_state == true){ // claim dispute is confirmed
                            
                payable(dataSale.buyer).transfer(PRICE); // return half collateral
                payable(publisherAddress).transfer(PRICE); // return author portion
                _burn(_id);
                dataSale.isVerifiedByUser = true;
            }else{ // reject claim
                dataSale.isConfirmForDispute = true;
            }
        }else if(msg.sender == dataSale.buyer){
            if(dataSale.isConfirmForDispute){ 
                if(_state == true){ // user agree to confirm their claim is false
                    payable(authorAddress).transfer(amountAuthor); // return half collateral
                    payable(publisherAddress).transfer((PRICE) + amountPublisher); // return publisher portion
                    _burn(_id);
                    dataSale.isVerifiedByUser = true;
                }
            }
        }
    }
    function totalSales() public view returns(uint256) {
        return _totalMinted();
    }
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
