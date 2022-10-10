/**
 * Math liberary for decimal operation
 *
 * Created Date: 5/22/2021
 * Author: Tronmine
 */

pragma solidity 0.5.10;

contract Utils {
    uint256 internal unique_id_counter = 0;

    function getUniqueID() internal returns (uint256) {
        return unique_id_counter += 1;
    }
}
