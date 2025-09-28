// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleMinesweeperNFT {
    // Token name and symbol
    string public name = "Minesweeper NFT";
    string public symbol = "MN";

    // Owner
    address public owner;

    // Supply
    uint256 public constant MAX_SUPPLY = 2500;
    uint256 private _tokenIdCounter;

    // Mappings
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) public playerTokenId;

    // Events
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event NFTMinted(uint256 indexed tokenId, address indexed player);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // Mint function
    function mintNFT() external {
        require(_tokenIdCounter < MAX_SUPPLY, "All 2500 NFTs minted");
        require(playerTokenId[msg.sender] == 0, "Already owns NFT");

        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        // Track ownership
        _owners[tokenId] = msg.sender;
        playerTokenId[msg.sender] = tokenId;

        emit Transfer(address(0), msg.sender, tokenId);
        emit NFTMinted(tokenId, msg.sender);
    }

    // Total supply
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }

    function remainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - _tokenIdCounter;
    }

    // Owner of token
    function ownerOf(uint256 tokenId) public view returns (address) {
        address tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0), "Token does not exist");
        return tokenOwner;
    }

    // tokenURI
    function tokenURI(uint256 tokenId) external view returns (string memory) {
        require(tokenId > 0 && tokenId <= _tokenIdCounter, "Token does not exist");

        bytes memory metadata = abi.encodePacked(
            '{"name":"Simple Minesweeper NFT #', _toString(tokenId), '",',
            '"description":"Simple Minesweeper NFT - Limited to 2500 total supply",',
            '"image":"https://github.com/Vidyadar/NFTTest/blob/main/minesweeper-nft-image.png",',
            '"attributes":[{"trait_type":"Type","value":"Simple NFT"},',
            '{"trait_type":"Mint Position","value":', _toString(tokenId), '},',
            '{"trait_type":"Total Supply","value":"2500"},',
            '{"trait_type":"Platform","value":"Minesweeper"}]}'
        );

        return string(abi.encodePacked("data:application/json;base64,", _base64Encode(metadata)));
    }

    // Helper: uint to string
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    // Helper: Base64 encode
    function _base64Encode(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return "";
        string memory table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        uint256 encodedLen = 4 * ((data.length + 2) / 3);
        string memory result = new string(encodedLen + 32);

        assembly {
            let tablePtr := add(table, 1)
            let resultPtr := add(result, 32)

            for { let i := 0 } lt(i, mload(data)) { i := add(i, 3) } {
                let input := and(mload(add(data, add(32, i))), 0xffffff)
                let out := mload(add(tablePtr, and(shr(18, input), 0x3F)))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(shr(12, input), 0x3F))), 0xFF))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(shr(6, input), 0x3F))), 0xFF))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(input, 0x3F))), 0xFF))
                mstore(resultPtr, out)
                resultPtr := add(resultPtr, 4)
            }

            mstore(result, encodedLen)
        }

        return result;
    }
}

