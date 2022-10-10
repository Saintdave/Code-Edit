/**
 * About app here
 */

const express = require('express');
const router = express.Router();
const https = require('https');

// hold update state of current TRX price
global.gUpdating_trx_price = false;

// get Tron TRX current price in the market
router.get('/getTRXCurrentPrice', (req, res) => {
    // get TRX current price
    gMySQL_DB.query(
        'SELECT nextUpdatedTime, price FROM trx_current_price WHERE id = 1 LIMIT 1',
    ).then(result => {
        const current_time = Date.now() / 1000; // get current seconds

        // check to fetch current price
        if (current_time > result[0].nextUpdatedTime && !gUpdating_trx_price) {
            // change the state to updating
            gUpdating_trx_price = true;

            // fetch current price from Coinmarketcap
            const options = {
                hostname: 'pro-api.coinmarketcap.com',
                port: 443,
                path: '/v1/cryptocurrency/quotes/latest?symbol=TRX',
                method: 'GET',
                headers: {
                    'Accepts': 'application/json',
                    'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY
                }
            };

            // request for current price
            const request = https.request(options, response => {
                // received string
                received_data = '';

                // receive data in chunck
                response.on('data', d => {
                    received_data += d; 
                });

                // the whole response has been received
                response.on('end', () => {
                    // change the state to not updating
                    gUpdating_trx_price = false;

                    // check if request was successfull
                    if (response.statusCode != 200) {
                        // return result to the client
                        res.status(200);
                        res.json({
                            success: true,
                            price: 0
                        });

                        return;
                    }

                    const parse_response = JSON.parse(received_data); // convert to JSON object
                    const price = parse_response['data']['TRX']['quote']['USD']['price'];
                    const next_updated_time = current_time + (60 * 5); // update after 5 minutes

                    // update the current price on database
                    gMySQL_DB.query(
                        'UPDATE trx_current_price SET nextUpdatedTime = ?, price = ? ' +  
                        'WHERE id = 1 LIMIT 1',
                        [next_updated_time, price]
                    ).then(result => {
                        // return result to the client
                        res.status(200);
                        res.json({
                            success: true,
                            price: price
                        });

                    }).catch(err => {
                        // return result to the client
                        res.status(200);
                        res.json({
                            success: true,
                            price: 0
                        });
                    });
                });
            });

            // handle request error
            request.on('error', error => {
                // change the state to not updating
                gUpdating_trx_price = false;
            });

            // end request
            request.end();

        } else { // use currrent price on database
            // return result to the client
            res.status(200);
            res.json({
                success: true,
                price: result[0].price
            });

        }

    }).catch(err => {
        // request was unsuccessfull
        res.status(200);
        res.json({
            success: false
        });
    });
});

module.exports = router;