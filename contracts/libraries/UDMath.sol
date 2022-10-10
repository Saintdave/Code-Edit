/**
 * Math liberary for decimal operation
 *
 * Created Date: 5/18/2021
 * Author: Tronmine
 */

pragma solidity 0.5.10;

import "./openzeppelin/math/SafeMath.sol";

library UDMath {
    using SafeMath for uint256;

    uint256 public constant UNIT = 1e18;

    function unit() external pure returns (uint256) {
        return UNIT;
    }

    function div(uint256 x, uint256 y) internal pure returns (uint256) {
        return SafeMath.div(x.mul(UNIT), y);
    }

    function mul(uint256 x, uint256 y) internal pure returns (uint256) {
        return x.mul(y) / UNIT;
    }
}