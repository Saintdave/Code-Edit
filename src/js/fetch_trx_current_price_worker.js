/* 
 * Fetch Tron TRX current market price from server
 * 
 */

importScripts('./utils.min.js');

// constants and variables here
let wait = false;
let set_interval_handler;
let run_interval = 300000; // 5 minutes
let server_url = "../api/v1/getTRXCurrentPrice";

// get update at interval
function getCurrentPrice() {
    // wait for server to response
    if (wait) {
        return;
    }

    wait = true;

    // send request
    ajaxRequest(
        server_url,
        null,
        { 
            contentType: false,
            method: "GET"
        }, 
        function (response, status) {
            if (status == 200) {
                let response_data = JSON.parse(response);

                // check if request is successfull
                if (response_data.success) {
                    // send recieved message back to client
                    self.postMessage(response_data.price);
                }
            }
                
            wait = false;
        }
    );
}

// start the request function
function startRequestAtInterval() {
    // fetch current TRX price before starting the interval
    ajaxRequest(
        server_url,
        null,
        { 
            contentType: false,
            method: "GET"
        }, 
        function (response, status) {
            if (status == 200) {
                let response_data = JSON.parse(response);

                // check if request is successfull
                if (response_data.success) {
                    // send recieved message back to client
                    self.postMessage(response_data.price);
                }
            }
                
            // run at every interval
            set_interval_handler = setInterval(() => {
                getCurrentPrice();
            }, run_interval);
        }
    );
}

// start the request
startRequestAtInterval();