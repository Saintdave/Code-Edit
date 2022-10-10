function init() {
    // initialise constants and variables
    const TRON_SUN = 1000000;
    const contract_address = "TV5s6FcjNfwmCP1tKdmui23GQXXqAGVt5M";
    let tronweb =  null;
    let user_wallet_address = "";
    let contract;
    let referred_user_address = null;
    let user_account_balance = 0;
    let user_wallet_balance = 0;
    let user_total_stake_amount = 0;
    let user_total_stake_profit = 0;
    let trx_usd_convertion_rate = 0;
    let invalid_inputs = {
        "withdraw-deposit-amount": false,
        "stake-amount": false,
        "referred-address": false
    };
    let stake_list_map = new Map();
    let processing_stake_claim = new Map();
    let periodic_stake_data_update = new Map();
    let prev_amount_input_offset = 0;
    let prev_amount_input_value = "";
    let user_stake_data = { active: false};

    let active_view = null;
    let mob_active_link = null;
    let desk_active_link = null;
    let deposit_withdraw_tab_toggle = true;
    let no_stake_toggle = true;
    let notify_message_active = false;
    let main_header_menu_cont = document.querySelector('.main-header-menu-cont');
    let notify_message = document.getElementById("notify-msg");
    let dialog_backdrop = document.getElementById("dialog-backdrop");
    let stake_confirm_dialog = document.getElementById("stake-confirm-dialog");
    let set_referral_dialog = document.getElementById("set-referral-dialog");
    let mobile_side_menu_btn = main_header_menu_cont.querySelector('.mobile-side-menu-btn');
    let mobile_main_nav_menu_backdrop = document.getElementById("mobile-main-navigation-menu-backdrop");
    let desktop_nav_main_menu = document.getElementById("side-nav-main-menu");
    let mobile_main_nav_menu = document.getElementById("mobile-main-navigation-menu");
    let home_nav_menu = document.getElementById("home-nav-menu");
    let deposit_withdraw_panel = document.querySelector('.deposit-withdraw-cont');
    let stake_input_panel = document.querySelector('.staking-cont');
    let account_select_percent_cont = document.querySelector('.deposit-withdraw-cont .amount-select-percent-cont');
    let stake_select_percent_cont = document.querySelector('.staking-cont .amount-select-percent-cont');
    let no_active_stake_notice = document.getElementById("no-active-stake-notice");
    let stake_list_cont = document.getElementById("active-stakes-cont");

    // app view section
    let dashboard_section_cont = document.getElementById("dashboard-section-cont");
    let home_view = document.getElementById("home-view");
    let account_view = document.getElementById("account-view");
    let stake_view = document.getElementById("stake-view");

    // initialise custom select input
    let udara_select = window.udaraSelect();

    // open mobile side main menu
    mobile_side_menu_btn.onclick = (e) => {
        mobile_main_nav_menu.setAttribute("class", "show");
        mobile_main_nav_menu_backdrop.setAttribute("class", "active");
        document.body.setAttribute("style", "overflow: hidden;");
    };

    // listen to click event on mobile main navigation backdrop
    mobile_main_nav_menu_backdrop.onclick = (e) => {
        mobile_main_nav_menu.setAttribute("class", "hide");
        mobile_main_nav_menu_backdrop.removeAttribute("class");
        document.body.removeAttribute("style");
    };

    // mobile main navigation menu
    mobile_main_nav_menu.querySelector('.close-btn').onclick = (e) => {
        mobile_main_nav_menu.setAttribute("class", "hide");
        mobile_main_nav_menu_backdrop.removeAttribute("class");
        document.body.removeAttribute("style");
    };

    // get mobile main navigation links
    let mobile_nav_links = document.querySelectorAll('#mobile-main-navigation-menu .link');
    mobile_nav_links.forEach((elem) => {
        elem.onmousedown = (e) => {
            mobile_main_nav_menu.setAttribute("class", "hide");
            mobile_main_nav_menu_backdrop.removeAttribute("class");
            document.body.removeAttribute("style");
        };
    });

    // convert array data to decimal and scale some number back 
    // to normal using this convertion, 1e18 => 1
    function formatStakeList(stake_list) {
        let formated_stake_list = [];

        // iterate through the stake list
        for (let i = 0; i < stake_list.length; i++) {
            let formated_stake = [];

            // convert hex data to decimal
            for (let j = 0; j < 4; j++) {
                formated_stake.push(Number(stake_list[i][j]._hex));
            }

            // convert hex data to decimal and divide the data by 1e18 to scale it down to normal
            for (let k = 4; k < stake_list[i].length; k++) {
                formated_stake.push(Number(BigInt(stake_list[i][k]._hex) / BigInt("1000000000000000000")));
            }

            formated_stake_list.push(formated_stake);
        }

        return formated_stake_list;
    }

    // utility function that switch page view
    function switchPageView(view) {
        // hide previous page
        if (active_view != null) {
            active_view.setAttribute("class", "remove-elem");
        }

        // show the active page
        view.removeAttribute("class");

        // set as active view
        active_view = view;
    }

    // utility function to highlight active or visited link on desktop view
    function desktopHighlightPageLink(link) {
        // remove previous active link
        if (desk_active_link != null) {
            desk_active_link.setAttribute("class", "link");
        }

        // highlight the active link
        link.setAttribute("class", "link active");

        // set as active view
        desk_active_link = link;
    }

    // utility function to highlight active or visited link on mobile view
    function mobileHighlightPageLink(link) {
        // remove previous active link
        if (mob_active_link != null) {
            mob_active_link.setAttribute("class", "link");
        }

        // highlight the active link
        link.setAttribute("class", "link active");

        // set as active view
        mob_active_link = link;
    }

    // validate user entered number
    function validateNumberInput(input) {
        // validate user input
        if (input.value != 0 && /^([1-9][0-9]*|(0|[1-9][0-9]*)\.[0-9]+)$/.test(input.value)) {
            return true;

        } else {
            input.setAttribute("style", "border: 1px solid #f1947b;");
            invalid_inputs[input.getAttribute("name")] = true;
        }
    }

    // check if transaction was successfull
    function confirmTransaction(transaction_id, callback, max_wait = Date.now()) {
        let current_time = Date.now();

        // check if maximum wait time has reach 60 seconds
        if ((current_time - max_wait) > 60000) {
            callback("TIMEOUT");
            return;
        }

        // get transaction information from the blockchain
        tronweb.trx.getTransactionInfo(transaction_id).then(data => {
            // check if object exist
            if (typeof data.receipt == "undefined") {
                confirmTransaction(transaction_id, callback, max_wait);
            } else {
                callback(data.receipt.result);
            }

        }).catch(err => {
            // check if is a network error
            if (/Network Error/i.test(err)) {
                confirmTransaction(transaction_id, callback, max_wait);
            } else {
                callback("FAILED");
            }
        });
    }

    // calculate user's total earn profit from staking
    function calculateTotalEarn(amount, percent, days, cap) {
        let map_amount = amount / 10000;
        let rd_amount =  amount * 0.005 * map_amount * map_amount;
        let profit = (amount * percent / 100) * days * cap;
        return profit - rd_amount;
    }

    // fit homepage upper section to screen
    function fitHomepageUpperSection() {
        let upper_section = document.querySelector('.page-upper-section'); // get homepage upper section
        let win_height = window.innerHeight;

        // check if screen height is less than minimum height
        if (win_height < 800) {
            upper_section.setAttribute("style", "height: 800px;");
        } else if (win_height > 1000) {
            upper_section.setAttribute("style", "height: 1000px;");
        } else {
            upper_section.setAttribute("style", "height: " + win_height + "px;");
        }
    }

    // select account or wallet balance by percent
    function accountSelectPercent(percent_index) {
        let amount_input = document.getElementById("wd-amount-input");
        account_select_percent_cont.setAttribute("class", "amount-select-percent-cont select-" + percent_index);
        let balance = deposit_withdraw_tab_toggle ? user_wallet_balance : user_account_balance; // replace that with real thing
        
        // set the input by selected percentage
        if (balance > 0) {
            amount_input.value = ((balance * percent_index * 25) / 100).toFixed(2);
        }
    }

    // select account balance by percent
    function stakeSelectPercent(percent_index) {
        let amount_input = document.getElementById("stake-amount-input");
        stake_select_percent_cont.setAttribute("class", "amount-select-percent-cont select-" + percent_index);
        
        // set the input by selected percentage
        if (user_account_balance > 0) {
            amount_input.value = ((user_account_balance * percent_index * 25) / 100).toFixed(2);
        }
    }

    // prevent invalid value for input element
    function preventInvalidAmountInput(e) {
        let input_elem = e.target;

        // allow only valid pressed key
        if (!(e.key.length > 1 || /[0-9.]/.test(e.key))) {
            e.preventDefault();
        }

        if (/[0-9.]/.test(e.key)) {
            let caret_offset = getCaretPosition(input_elem);
            let input_value = input_elem.value;
            let new_input_value = input_value.substring(0, caret_offset) + e.key + input_value.substring(caret_offset, input_value.length);

            // validate input format
            if (!/^(0|[1-9][0-9]*|(0|[1-9][0-9]*)\.[0-9]*)$/.test(new_input_value)) {
                e.preventDefault();
            }
        }
    }

    // prevent invalid value for input element for mobile browser
    function preventInvalidAmountInputMobile(e) {
        let input_elem = e.target;

        if (input_elem.value.length == 0) {
            return;
        }

        if (!/^(0|[1-9][0-9]*|(0|[1-9][0-9]*)\.[0-9]*)$/.test(input_elem.value)) {
            input_elem.value = prev_amount_input_value;
            setCaretPosition(input_elem, prev_amount_input_offset)
        }
    }

    // process user's input
    function processUserInput(e) {
        let input_elem = e.target; // get element that fire the event
        let input_name = input_elem.getAttribute("name");
        
        // process event type
        switch(e.type) {
            case "keydown":
                if (input_name == "withdraw-deposit-amount" || input_name == "stake-amount") {
                    // reset input error
                    if (invalid_inputs[input_name]) {
                        invalid_inputs[input_name] = false;
                        input_elem.removeAttribute("style");
                    }

                    // track and prevent invalid input
                    prev_amount_input_offset = getCaretPosition(input_elem);
                    prev_amount_input_value = input_elem.value;
                    preventInvalidAmountInput(e);
                }

                if (input_name == "referred-address") {
                    // reset input error
                    if (invalid_inputs[input_name]) {
                        invalid_inputs[input_name] = false;
                        input_elem.removeAttribute("style");
                    }
                }

                break;

            case "keyup":
                if (input_name == "withdraw-deposit-amount" || input_name == "stake-amount") {
                    let elem = document.querySelector('.deposit-withdraw-cont .amount-select-percent-cont');
                    elem.setAttribute("class", "amount-select-percent-cont");
                    preventInvalidAmountInputMobile(e);
                }

                if (input_name == "stake-amount") {
                    let elem = document.querySelector('.staking-cont .amount-select-percent-cont');
                    elem.setAttribute("class", "amount-select-percent-cont");
                    preventInvalidAmountInputMobile(e);
                }

                break;

            default:
                // shouldn't be here
        }
    }

    // add form's input to process that handle user's input
    function addInputToProcess(input_elements) {
        for (let i = 0; i < input_elements.length; i++) {
            input_elements[i].addEventListener("keydown", processUserInput, false);
            input_elements[i].addEventListener("keyup", processUserInput, false);
        }
    }

    // navigate back to previous page
    window.navigateBack = function () {
        window.history.back();
    };

    // switch to deposit into account
    window.accountDepositTab = function (btn) {
        deposit_withdraw_tab_toggle = true;
        let checkbox_toggle = document.getElementById("deposit-withdraw-checkbox-toggle");
        let withdraw_tab = document.querySelector('.deposit-withdraw-cont .tab-2');
        let amount_input = document.getElementById("wd-amount-input");
        let select_percent = document.querySelector('.deposit-withdraw-cont .amount-select-percent-cont');

        btn.setAttribute("class", "tab-1 active");
        checkbox_toggle.checked = false;
        withdraw_tab.setAttribute("class", "tab-2");
        amount_input.value = ""; // reset input value

        // reset input error
        if (invalid_inputs["withdraw-deposit-amount"]) {
            invalid_inputs["withdraw-deposit-amount"] = false;
            amount_input.removeAttribute("style");
        }

        select_percent.setAttribute("class", "amount-select-percent-cont");
    };

    // switch to withdraw into my wallet
    window.accountWithdrawTab = function (btn) {
        deposit_withdraw_tab_toggle = false;
        let checkbox_toggle = document.getElementById("deposit-withdraw-checkbox-toggle");
        let deposit_tab = document.querySelector('.deposit-withdraw-cont .tab-1');
        let amount_input = document.getElementById("wd-amount-input");
        let select_percent = document.querySelector('.deposit-withdraw-cont .amount-select-percent-cont');

        btn.setAttribute("class", "tab-2 active");
        checkbox_toggle.checked = true;
        deposit_tab.setAttribute("class", "tab-1");
        amount_input.value = ""; // reset input value

        // reset input error
        if (invalid_inputs["withdraw-deposit-amount"]) {
            invalid_inputs["withdraw-deposit-amount"] = false;
            amount_input.removeAttribute("style");
        }

        select_percent.setAttribute("class", "amount-select-percent-cont");
    };

    // copy user's referral link to clipboard
    window.copyReferralLink = function () {
        if (user_wallet_address == "") {
            return;
        }

        if (notify_message_active) {
            return;
        }

        notify_message_active = true;

        copyTextToClipboard(
            window.location.protocol + "//" + window.location.host + "/?ref=" + user_wallet_address
        );

        // show success message
        notify_message.querySelector('.message').innerHTML = "Copied to clipboard.";
        notify_message.setAttribute("class", "show");

        setTimeout(() => {
            notify_message.setAttribute("class", "hide");
            notify_message_active = false;
        }, 2000);
    };

    // copy user's referral link to clipboard
    window.copyReferralID = function () {
        if (user_wallet_address == "") {
            return;
        }

        if (notify_message_active) {
            return;
        }

        notify_message_active = true;
        
        copyTextToClipboard(user_wallet_address);

        // show success message
        notify_message.querySelector('.message').innerHTML = "Copied to clipboard.";
        notify_message.setAttribute("class", "show");

        setTimeout(() => {
            notify_message.setAttribute("class", "hide");
            notify_message_active = false;
        }, 2000);
    };

    // tronwage homepage
    page('/', (ctx) => {
        // show page
        switchPageView(home_view);

        // remove dashboard fill window height
        dashboard_section_cont.setAttribute("class", "cont-max-width");

        // set referred user address (user's address that invited into the platform)
        referred_user_address = (new URLSearchParams(window.location.search)).get("ref");

        main_header_menu_cont.setAttribute("class", "main-header-menu-cont");

        // show homepage navigation header menu
        home_nav_menu.setAttribute("class", "menu-link-cont");

        // hide desktop side navigation menu
        desktop_nav_main_menu.setAttribute("class", "remove-elem");

        // highlight the link
        mobileHighlightPageLink(document.getElementById("home-mob-link"));
    });

    // tronwage dashboard
    page('/account', (ctx) => {
        // show page
        switchPageView(account_view);

        // set dashboard fill window height
        dashboard_section_cont.setAttribute("class", "cont-max-width fill-win-height");

        main_header_menu_cont.setAttribute("class", "main-header-menu-cont dashboard");

        // hide homepage navigation header menu
        home_nav_menu.setAttribute("class", "menu-link-cont remove-elem");

        // show desktop side navigation menu
        desktop_nav_main_menu.removeAttribute("class");

        // navigate to deposit and withdraw panel
        deposit_withdraw_panel.setAttribute("class", "deposit-withdraw-cont");

        // highlight the link
        mobileHighlightPageLink(document.getElementById("account-mob-link"));
        desktopHighlightPageLink(document.getElementById("account-desk-link"));
    });

    // tronwage dashboard
    page('/stake', (ctx) => {
        // show page
        switchPageView(stake_view);

        // set dashboard fill window height
        dashboard_section_cont.setAttribute("class", "cont-max-width fill-win-height");

        main_header_menu_cont.setAttribute("class", "main-header-menu-cont dashboard");

        // hide homepage navigation header menu
        home_nav_menu.setAttribute("class", "menu-link-cont remove-elem");

        // show desktop side navigation menu
        desktop_nav_main_menu.removeAttribute("class");

        // navigate to staking panel
        stake_input_panel.setAttribute("class", "staking-cont");

        // highlight the link
        mobileHighlightPageLink(document.getElementById("stake-mob-link"));
        desktopHighlightPageLink(document.getElementById("stake-desk-link"));
    });

    // navigate to deposit and withdraw panel
    page('/account/:transaction', (ctx) => {
        let transaction = ctx.params.transaction;

        // show the deposit and withdraw panel
        deposit_withdraw_panel.setAttribute("class", "deposit-withdraw-cont show");

        // select the deposit tab
        if (transaction == "deposit") { // deposit
            window.accountDepositTab(document.querySelector('.deposit-withdraw-cont .tab-1'));

        } else { // withdraw
            window.accountWithdrawTab(document.querySelector('.deposit-withdraw-cont .tab-2'));
        }
    });

    // navigate to staking input panel
    page('/stake/stake_input', (ctx) => {
        // show the stake input
        stake_input_panel.setAttribute("class", "staking-cont show");
    });

    // catch endpoint that doesn't exist or defined
    page('*', () => {
        console.log("Link deos not exist or broken.");
    })

    // start the routing
    page();

    // get stake duration input 
    let stake_duration_input = udara_select.input(udara_select.ID, "select-stake-duration");

    // process selected data
    stake_duration_input.processSelectedValue((value) => {
        // remove the unwanted text
        return value.replace(/(\d+(.\d+)?% daily for | days)/g, "");
    });

    // get stake capitalisation input 
    let stake_cap_input = udara_select.input(udara_select.ID, "select-stake-cap");

    // process selected data
    stake_cap_input.processSelectedValue((value) => {
        // remove the "x" in the selected value
        /*return value.replace("x", "");*/
        return 1.5;
    });

    // get select percent for account
    let account_select_percent = document.querySelectorAll('.deposit-withdraw-cont .select-percent');
    account_select_percent.forEach((elem, number) => {
        elem.onclick = (e) => {
            accountSelectPercent(number + 1);
        };
    });

    // get select percent for stake
    let stake_select_percent = document.querySelectorAll('.staking-cont .select-percent');
    stake_select_percent.forEach((elem, number) => {
        elem.onclick = (e) => {
            stakeSelectPercent(number + 1);
        };
    });

    // deposit or withdraw click event
    let dw_button = document.querySelector('.deposit-withdraw-cont .execute-btn');
    dw_button.onclick = async (e) => {
        let input_elem = e.currentTarget;
        input_elem.disabled = true;
        let wd_amount_input = document.getElementById("wd-amount-input");
        let balance = deposit_withdraw_tab_toggle ? user_wallet_balance : user_account_balance;

        // check if contract is initialised
        if (typeof contract == "undefined" || contract == null) {
            input_elem.disabled = false;
            return;
        }

        // validate user input
        if (!validateNumberInput(wd_amount_input)) {
            input_elem.disabled = false;
            return;
        }

        // check if account or wallet balance is sufficient
        if (wd_amount_input.value > balance) {
            // show failed message
            notify_message.querySelector('.message').innerHTML = "Balance is insufficient.";
            notify_message.setAttribute("class", "failed show");

            setTimeout(() => {
                notify_message.setAttribute("class", "failed hide");
            }, 2000);

            input_elem.disabled = false;
            return;
        }

        let select_percent = document.querySelector('.deposit-withdraw-cont .amount-select-percent-cont');
        let amount = wd_amount_input.value.trim();

        if (deposit_withdraw_tab_toggle) { // deposit
            try {
                let result = await contract.deposit().send({
                    feeLimit: 100000000,
                    callValue: amount * TRON_SUN,
                    shouldPollResponse: false
                });

                // confirm transaction
                confirmTransaction(result, (response) => {
                    // check if transaction is successfull
                    if (response == "SUCCESS") {
                        // show success message
                        notify_message.querySelector('.message').innerHTML = "Deposit was successfull.";
                        notify_message.setAttribute("class", "show");

                        setTimeout(() => {
                            notify_message.setAttribute("class", "hide");
                        }, 2000);

                    } else { // REVERT | FAILED | OUT_OF_ENERGY | TIMEOUT
                        // show failed message
                        notify_message.querySelector('.message').innerHTML = "Deposit was unsuccessfull.";
                        notify_message.setAttribute("class", "failed show");

                        setTimeout(() => {
                            notify_message.setAttribute("class", "failed hide");
                        }, 2000);
                    }

                    // reset input value
                    wd_amount_input.value = "";
                    select_percent.setAttribute("class", "amount-select-percent-cont");

                    input_elem.disabled = false;
                    console.log(result);
                });

            } catch (err) {
                // show unsuccessfull message
                notify_message.querySelector('.message').innerHTML = "Deposit was unsuccessfull.";
                notify_message.setAttribute("class", "failed show");

                setTimeout(() => {
                    notify_message.setAttribute("class", "failed hide");
                }, 2000);

                // reset input value
                wd_amount_input.value = "";
                select_percent.setAttribute("class", "amount-select-percent-cont");

                input_elem.disabled = false;
                console.error(err);
            }

        } else { // withdraw
            try {
                let result = await contract.withdraw(amount * TRON_SUN).send({
                    feeLimit: 100000000,
                    callValue: 0,
                    shouldPollResponse: false
                });

                // confirm transaction
                confirmTransaction(result, (response) => {
                    // check if transaction is successfull
                    if (response == "SUCCESS") {
                        // show success message
                        notify_message.querySelector('.message').innerHTML = "Withdraw was successfull.";
                        notify_message.setAttribute("class", "show");

                        setTimeout(() => {
                            notify_message.setAttribute("class", "hide");
                        }, 2000);

                    } else { // REVERT | FAILED | OUT_OF_ENERGY | TIMEOUT
                        // show unsuccessfull message
                        notify_message.querySelector('.message').innerHTML = "Withdraw was unsuccessfull.";
                        notify_message.setAttribute("class", "failed show");

                        setTimeout(() => {
                            notify_message.setAttribute("class", "failed hide");
                        }, 2000);
                    }

                    // reset input value
                    wd_amount_input.value = "";
                    select_percent.setAttribute("class", "amount-select-percent-cont");

                    input_elem.disabled = false;
                    console.log(result);
                });

            } catch (err) {
                // show unsuccessfull message
                notify_message.querySelector('.message').innerHTML = "Withdraw was unsuccessfull.";
                notify_message.setAttribute("class", "failed show");

                setTimeout(() => {
                    notify_message.setAttribute("class", "failed hide");
                }, 2000);

                // reset input value
                wd_amount_input.value = "";
                select_percent.setAttribute("class", "amount-select-percent-cont");

                input_elem.disabled = false;
                console.error(err);
            }
        }
    };

    // stake user's entered TRX
    window.placeStakeForm = function (e) {
        e.preventDefault();
        let stake_form = document.forms["place-stake-form"];
        let input_amount = stake_form.elements["stake-amount"].value;

        // check if contract is initialised
        if (typeof contract == "undefined" || contract == null) {
            return;
        }

        // check if stake is still active
        if (user_stake_data.active) {
            return;
        }

        // validate user input
        if (!validateNumberInput(stake_form.elements["stake-amount"])) {
            return;
        }

        // check if stake amount is not within range
        if (input_amount < 100 || input_amount > 100000) {
            // show failed message
            let message = `${input_amount < 100 ? 'Minimum stake is 100 TRX' : 'Maximum stake is 100,000 TRX'}.`;;
            notify_message.querySelector('.message').innerHTML = message;
            notify_message.setAttribute("class", "failed show");

            setTimeout(() => {
                notify_message.setAttribute("class", "failed hide");
            }, 2000);

            return;
        }

        // check if account balance is sufficient
        if (input_amount > user_account_balance) {
            // show failed message
            notify_message.querySelector('.message').innerHTML = "Balance is insufficient.";
            notify_message.setAttribute("class", "failed show");

            setTimeout(() => {
                notify_message.setAttribute("class", "failed hide");
            }, 2000);

            return;
        }

        let invest_duration = {
            "14": 1,
            "21": 2,
            "28": 3,
            "35": 4
        };

        let invest_percent = {
            "14": 5,
            "21": 7.5,
            "28": 10,
            "35": 12.5
        };

        let stake_amount = input_amount * 0.95; // stake fee is 5%
        let stake_duration = stake_form.elements["stake-duration"].value;
        let stake_cap = stake_form.elements["stake-cap"].value;

        // set the stake variables
        user_stake_data = {
            active: true,
            amount: input_amount * TRON_SUN,
            package: invest_duration[stake_duration],
            cap: stake_cap == "1.5" ? true : false
        };

        // show stake confirm dialog
        dialog_backdrop.setAttribute("class", "active");
        stake_confirm_dialog.querySelector('.message-cont').innerHTML = 
            `You are staking <span class="em">${formatNumber(stake_amount, ',')} TRX</span> with <span class="em">${stake_cap}x</span> cap rate. 
            Total stake to be earn is <span class="em">${formatNumber((stake_amount + calculateTotalEarn(stake_amount, invest_percent[stake_duration], stake_duration, stake_cap)).toFixed(), ',')} TRX</span> 
            after <span class="em">${stake_duration} days</span>. With cap rate of <span class="em">${stake_cap}x</span>, 
            you can ${stake_cap == '1.5' ? 'only claim your profits at the end of your stake duration' : 'claim your profits every 24 hours till end of stake duration'}.`;
        stake_confirm_dialog.removeAttribute("class");
    };

    // confirm user place stake
    window.confirmStake = async function (btn) {
        if (!user_stake_data.active) {
            return;
        }

        // hide stake confirm dialog
        dialog_backdrop.removeAttribute("class");
        stake_confirm_dialog.setAttribute("class", "remove-elem");

        let amount_input = document.getElementById("stake-amount-input");
        let select_percent = document.querySelector('.staking-cont .amount-select-percent-cont');

        try {
            let result = await contract.stake(
                user_stake_data.package, 
                true, /*before: user_stake_data.cap*/
                user_stake_data.amount
            ).send({
                feeLimit: 100000000,
                callValue: 0,
                shouldPollResponse: false
            });

            // confirm transaction
            confirmTransaction(result, (response) => {
                // check if transaction is successfull
                if (response == "SUCCESS") {
                    // show success message
                    notify_message.querySelector('.message').innerHTML = "Staked successfull.";
                    notify_message.setAttribute("class", "show");

                    setTimeout(() => {
                        notify_message.setAttribute("class", "hide");
                    }, 2000);

                } else { // REVERT | FAILED | OUT_OF_ENERGY | TIMEOUT
                    // show unsuccessfull message
                    notify_message.querySelector('.message').innerHTML = "Stake was unsuccessfull.";
                    notify_message.setAttribute("class", "failed show");

                    setTimeout(() => {
                        notify_message.setAttribute("class", "failed hide");
                    }, 2000);
                }

                // reset input value
                stake_duration_input.selectOptionByIndex(0);
                stake_cap_input.selectOptionByIndex(0);
                amount_input.value = "";
                select_percent.setAttribute("class", "amount-select-percent-cont");

                user_stake_data.active = false;
                console.log(result);
            });

        } catch (err) {
            // show unsuccessfull message
            notify_message.querySelector('.message').innerHTML = "Stake was unsuccessfull.";
            notify_message.setAttribute("class", "failed show");

            setTimeout(() => {
                notify_message.setAttribute("class", "failed hide");
            }, 2000);

            // reset input value
            stake_duration_input.selectOptionByIndex(0);
            stake_cap_input.selectOptionByIndex(0);
            amount_input.value = "";
            select_percent.setAttribute("class", "amount-select-percent-cont");

            user_stake_data.active = false;
            console.error(err);
        }
    };

    // cancel user place stake
    window.cancelStake = function (btn) {
        if (!user_stake_data.active) {
            return;
        }

        // hide stake confirm dialog
        dialog_backdrop.removeAttribute("class");
        stake_confirm_dialog.setAttribute("class", "remove-elem");
        user_stake_data.active = false;
    };

    // process claim stake earn
    function processClaimStakeProfit(stake_id) {
        // check if stake exist
        if (!stake_list_map.has(stake_id)) {
            return;
        }

        // check if claim is still processing
        if (processing_stake_claim.get(stake_id)) {
            return;
        }

        let stake = stake_list_map.get(stake_id); // get user active stake
        let current_time = Date.now() / 1000;

        // check if is the time to claim stake earn
        if (current_time < stake[7]) {
            return false;
        }

        // set to "true" when processing claim
        processing_stake_claim.set(stake_id, true);

        // claim user's placed stake
        contract.claimStakeProfit(stake_id).send(
            {
                feeLimit: 100000000,
                callValue: 0,
                shouldPollResponse: false
            }
        ).then(result => {
            // confirm transaction
            confirmTransaction(result, (response) => {
                // check if stake still exist
                if (processing_stake_claim.has(stake_id)) {
                    processing_stake_claim.set(stake_id, false);
                }

                // check if transaction is unsuccessfull
                if (response != "SUCCESS") { // REVERT | FAILED | OUT_OF_ENERGY | TIMEOUT
                    // show failed message
                    notify_message.querySelector('.message').innerHTML = "Claim was unsuccessfull.";
                    notify_message.setAttribute("class", "failed show");

                    setTimeout(() => {
                        notify_message.setAttribute("class", "failed hide");
                    }, 2000);
                }

                console.log(result);
            });

        }).catch(err => {
            // check if stake still exist
            if (processing_stake_claim.has(stake_id)) {
                processing_stake_claim.set(stake_id, false);
            }

            // show unsuccessfull message
            notify_message.querySelector('.message').innerHTML = "Claim was unsuccessfull.";
            notify_message.setAttribute("class", "failed show");

            setTimeout(() => {
                notify_message.setAttribute("class", "failed hide");
            }, 2000);

            console.error(err);
        });
    }

    // claim user stake profit
    window.claimStakeProfit = function (stake_id) {
        processClaimStakeProfit(stake_id);
    };

    // get all the form's input to be processed
    addInputToProcess([
        document.getElementById("wd-amount-input"),
        document.getElementById("stake-amount-input"),
        document.getElementById("referred-address-input")
    ]);

    // update displayed total deposit and withdraw on homepage
    function updateDisplayedTotalDepositAndWithdraw(total_deposit, total_withdraw) {
        let elem = document.querySelector('.headline-stat-cont .total-stake-label .label-cont .content');
        elem.innerHTML = trimNumber(total_deposit);
        elem = document.querySelector('.headline-stat-cont .total-withdrawn-label .label-cont .content');
        elem.innerHTML = trimNumber(total_withdraw);
    }

    // update user's displayed account information
    function updateDisplayedUserAccountInfo(referred_user, remaining_stake_profit) {
        let elem = document.querySelector('.referred-user-cont .data');
        elem.innerHTML = referred_user;
        elem = document.querySelector('.account-info-cont .account-balance .crypto-amount');
        elem.innerHTML = formatNumber(user_account_balance.toFixed(2), ",") + " TRX";
        elem = document.querySelector('.account-info-cont .account-balance .fiat-amount');
        elem.innerHTML = "≈ $" + formatNumber((user_account_balance * trx_usd_convertion_rate).toFixed(2), ",");
        elem = document.querySelector('.account-info-cont .remaining-balance .crypto-amount');
        elem.innerHTML = formatNumber(remaining_stake_profit.toFixed(2), ",") + " TRX";
        elem = document.querySelector('.account-info-cont .remaining-balance .fiat-amount');
        elem.innerHTML = "≈ $" + formatNumber((remaining_stake_profit * trx_usd_convertion_rate).toFixed(2), ",");
        elem = document.querySelector('.deposit-withdraw-cont .wallet-balance-info-cont .amount');
        elem.innerHTML = formatNumber(user_wallet_balance.toFixed(2), ",") + " TRX";
        elem = document.querySelector('.deposit-withdraw-cont .account-balance-info-cont .amount');
        elem.innerHTML = formatNumber(user_account_balance.toFixed(2), ",") + " TRX";
    }

    // create new stake element and add to the list
    function createStakeElement(
        stake_id, 
        cap, 
        amount_staked, 
        total_stake_profit, 
        stake_start_time,
        stake_due_time,
        prev_claim_time,
        next_claim_time
    ) {
        let claim_profit_fill_percent;
        let show_time = false;
        let current_time = Date.now() / 1000;
        current_time = current_time > stake_due_time ? stake_due_time : current_time;
        let stake_duration = ((stake_due_time - stake_start_time) / 86400).toFixed(); // duration in day(s)
        let stake_remaining_time = stake_due_time > current_time ? ((stake_due_time - current_time) / 86400).toFixed() : 0;
        let stake_current_profit = (((current_time - prev_claim_time) * total_stake_profit) / (stake_due_time - stake_start_time)).toFixed(2);
        let remaining_claim_hour = Math.floor((next_claim_time - current_time) / 3600);
        let remaining_claim_min = Math.floor(((next_claim_time - current_time) % 3600) / 60);
        remaining_claim_hour = remaining_claim_hour < 10 ? '0' + remaining_claim_hour : remaining_claim_hour;
        remaining_claim_min = remaining_claim_min < 10 ? '0' + remaining_claim_min : remaining_claim_min;

        if (cap) {
            claim_profit_fill_percent = current_time >= stake_due_time ? 100 : 0;
        } else {
            claim_profit_fill_percent = ((current_time - prev_claim_time) * 100) / (next_claim_time - prev_claim_time);
            show_time = current_time >= next_claim_time ? false : true;
        }

        // create the element
        let elem = document.createElement("div");
        elem.setAttribute("id", "stake-" + stake_id);
        elem.setAttribute("class", "active-stake");
        elem.innerHTML = `
            <input id="expand-stake-info-${stake_id}" class="expand-stake-info" type="checkbox">
            <div class="stake-header-cont">
                <div class="expand-btn-cont">
                    <label class="expand-btn" for="expand-stake-info-${stake_id}">
                        <svg class="down-arrow-icon">
                            <use xlink:href="#down-arrow-icon"></use>
                        </svg>
                        <svg class="up-arrow-icon">
                            <use xlink:href="#up-arrow-icon"></use>
                        </svg>
                    </label>
                </div>
                <div class="amount-cont">
                    <div class="data">${formatNumber(amount_staked.toFixed(2), ",")} TRX</div>
                    <div class="title">Amount</div>
                </div>
                <div class="duration-cont">
                    <div class="data">${stake_duration} day${stake_duration > 1 ? 's' : ''}</div>
                    <div class="title">Duration</div>
                </div>
                <div class="remaining-time-cont">
                    <div class="data">${stake_remaining_time} day${stake_remaining_time > 1 ? 's' : ''}</div>
                    <div class="title">Remaining</div>
                </div>
                <div class="profit-cont">
                    <div class="data">${formatNumber(stake_current_profit, ",")} TRX</div>
                    <div class="title">Profit</div>
                </div>
                <div class="stake-claim-btn-cont">
                    <div class="stake-claim-btn" onclick="claimStakeProfit(${stake_id})">
                        <div class="claim-stake-profit-progress-fill" style="width: ${claim_profit_fill_percent}%;"></div>
                        <div class="claim-stake-profit-count-down">${show_time ? remaining_claim_hour + ':' + remaining_claim_min : 'Claim'}</div>
                    </div>
                </div>
            </div>
            <div class="stake-body-cont">
                <div class="stake-body-wrapper">
                    <div class="stake-date-cont">
                        <div class="data">${getFormatedDate(new Date(stake_start_time * 1000), 'YYYY-MM-DD')}</div>
                        <div class="title">Stake Date</div>
                    </div>
                    <div class="due-date-cont">
                        <div class="data">${getFormatedDate(new Date(stake_due_time * 1000), 'YYYY-MM-DD')}</div>
                        <div class="title">Due Date</div>
                    </div>
                    <div class="stake-profit-cont">
                        <div class="data">${formatNumber(total_stake_profit.toFixed(2), ",")} TRX</div>
                        <div class="title">Stake Profit</div>
                    </div>
                    <div class="duration-cont">
                        <div class="data">${stake_duration} day${stake_duration > 1 ? 's' : ''}</div>
                        <div class="title">Duration</div>
                    </div>
                    <div class="remaining-time-cont">
                        <div class="data">${stake_remaining_time} day${stake_remaining_time > 1 ? 's' : ''}</div>
                        <div class="title">Remaining</div>
                    </div>
                </div>
            </div>
        `;

        return elem;
    }

    // update user's stake information and list of user active stake(s)
    function updateDiplayedUserStakeInfo(stake_list) {
        // remove stake that has been claimed
        for (let [key, value] of stake_list_map) {
            if (typeof stake_list.find(stake => stake[0] == key) == "undefined") {
                // re-calculate total stake amount and profit
                user_total_stake_amount -= value[2] / TRON_SUN;
                user_total_stake_profit -= value[3] / TRON_SUN;

                stake_list_map.delete(key); // remove stake from the map
                processing_stake_claim.delete(key);
                periodic_stake_data_update.delete(key);
                stake_list_cont.removeChild(document.getElementById("stake-" + key)); // remove stake from the list
            }
        }
        
        // prepend new stake(s) to the list and check to start claim countdown
        for (let i = 0; i < stake_list.length; i++) {
            // check if stake is already in the list
            if (stake_list_map.has(stake_list[i][0])) {
                // update stake properties
                if (!stake_list[i][1]) { // check if cap rate is 1x
                    let update_stake = periodic_stake_data_update.get(stake_list[i][0]);
                    update_stake.prev_claim_time = stake_list[i][6];
                    update_stake.next_claim_time = stake_list[i][7];
                }

                continue; // skip
            }

            // prepend new stake
            stake_list_cont.insertBefore(
                createStakeElement(
                    stake_list[i][0], // id
                    stake_list[i][1], // capitalisation
                    stake_list[i][2] / TRON_SUN, // amount staked
                    stake_list[i][3] / TRON_SUN, // total stake profit
                    stake_list[i][4], // stake time
                    stake_list[i][5], // due time
                    stake_list[i][6], // previous claim time
                    stake_list[i][7] // next claim time
                ), 
                stake_list_cont.firstChild
            );

            stake_list_map.set(stake_list[i][0], stake_list[i]); // add the new stake to map
            processing_stake_claim.set(stake_list[i][0], false);

            // re-calculate total stake amount and profit
            user_total_stake_amount += stake_list[i][2] / TRON_SUN;
            user_total_stake_profit += stake_list[i][3] / TRON_SUN;

            // start claim countdown
            periodic_stake_data_update.set(
                stake_list[i][0], 
                {
                    update: true, 
                    cap: stake_list[i][1], 
                    stake_profit: stake_list[i][3] / TRON_SUN, 
                    stake_time: stake_list[i][4],
                    stake_due_time: stake_list[i][5], 
                    prev_claim_time: stake_list[i][6], 
                    next_claim_time: stake_list[i][7]
                }
            );
        }

        let elem = document.querySelector('.stake-info-cont .amount-staked-cont .crypto-amount');
        elem.innerHTML = formatNumber(user_total_stake_amount.toFixed(2), ",") + " TRX";
        elem = document.querySelector('.stake-info-cont .amount-staked-cont .fiat-amount');
        elem.innerHTML = "≈ $" + formatNumber((user_total_stake_amount * trx_usd_convertion_rate).toFixed(2), ",");
        elem = document.querySelector('.stake-info-cont .staked-profit-cont .crypto-amount');
        elem.innerHTML = formatNumber(user_total_stake_profit.toFixed(2), ",") + " TRX";
        elem = document.querySelector('.stake-info-cont .staked-profit-cont .fiat-amount');
        elem.innerHTML = "≈ $" + formatNumber((user_total_stake_profit * trx_usd_convertion_rate).toFixed(2), ",");
        elem = document.querySelector('.stake-info-cont .stake-count-cont .stake-count');
        elem.innerHTML = stake_list_map.size;
        elem = document.querySelector('.staking-cont .balance-info-cont .amount');
        elem.innerHTML = formatNumber(user_account_balance.toFixed(2), ",") + " TRX";

        // check if stake list is empty or not
        if (stake_list_map.size > 0 && no_stake_toggle) {
            no_stake_toggle = false;
            no_active_stake_notice.setAttribute("class", "remove-elem");
            stake_list_cont.setAttribute("class", "stake-list-cont");

        } else if (stake_list_map.size == 0 && !no_stake_toggle) {
            no_stake_toggle = true;
            no_active_stake_notice.removeAttribute("class");
            stake_list_cont.setAttribute("class", "stake-list-cont remove-elem");
        }
    }

    // fetch data and users' data from deployed smartcontract
    function fetchDataFromSmartContract() {
        let wait = false; // wait for all the promise to resolve
        setInterval(async () => {
            // check if all promise has not yet resolved
            if (wait) {
                return;
            }

            wait = true;

            try {
                let [
                    total_deposit, 
                    total_withdraw, 
                    user_account_info, 
                    user_stake_list, 
                    wallet_balance
                ] = await Promise.all([
                    contract.getTotalDeposit().call(),
                    contract.getTotalWithdraw().call(),
                    contract.getUserAccountInfo().call(),
                    contract.getUserStakeList().call(), 
                    tronweb.trx.getBalance(user_wallet_address)
                ]);
    
                wait = false; // all the promise resolved

                // update variables
                user_account_balance = user_account_info[0] / TRON_SUN;
                user_wallet_balance = wallet_balance / TRON_SUN;

                // update displayed total TRX deposited and total TRX withdrawn
                updateDisplayedTotalDepositAndWithdraw(total_deposit / TRON_SUN, total_withdraw / TRON_SUN);

                // update user's account panel
                updateDisplayedUserAccountInfo(
                    user_account_info[4], 
                    user_account_info[1] / TRON_SUN
                );

                // update user's stake information
                updateDiplayedUserStakeInfo(
                    formatStakeList(user_stake_list).sort((a, b) => a[0] - b[0]) // sort in ascending order by ID
                );
    
            } catch (err) {
                wait = false;
                console.error(err);
            }

        }, 5000);
    }

    // fetch trx current price in the marget
    function fetchTRXCurrentPrice() {
        // get new crypto currency stat
        let worker = new Worker("./js/fetch_trx_current_price_worker.min.js");

        // listen for received message(s)
        worker.addEventListener("message", (e) =>  {
            trx_usd_convertion_rate = e.data;
        }, false);
    }

    // update user's active stake data like duration, current earn profit, and next claim count down
    function updateUserActiveStakeData() {
        let current_time;
        let stake_remaining_time;
        let stake_current_profit;
        let remaining_claim_hour;
        let remaining_claim_min;
        let claim_profit_fill_percent;
        let show_time;
        let elem;

        setInterval(() => {
            // iterate through the list
            for (let [key, value] of periodic_stake_data_update) {
                if (!value.update) {
                    continue;
                }

                current_time = Date.now() / 1000;
                show_time = false;

                // mark the stake to stop updating it data
                if (current_time > value.stake_due_time) {
                    value.update = false;
                    current_time = value.stake_due_time;
                }

                stake_remaining_time = value.stake_due_time > current_time ? ((value.stake_due_time - current_time) / 86400).toFixed() : 0;
                stake_current_profit = (((current_time - value.prev_claim_time) * value.stake_profit) / (value.stake_due_time - value.stake_time)).toFixed(2);

                if (value.cap) {
                    claim_profit_fill_percent = current_time >= value.stake_due_time ? 100 : 0;
                } else {
                    remaining_claim_hour = Math.floor((value.next_claim_time - current_time) / 3600);
                    remaining_claim_min = Math.floor(((value.next_claim_time - current_time) % 3600) / 60);
                    remaining_claim_hour = remaining_claim_hour < 10 ? '0' + remaining_claim_hour : remaining_claim_hour;
                    remaining_claim_min = remaining_claim_min < 10 ? '0' + remaining_claim_min : remaining_claim_min;

                    claim_profit_fill_percent = ((current_time - value.prev_claim_time) * 100) / (value.next_claim_time - value.prev_claim_time);
                    show_time = current_time >= value.next_claim_time ? false : true;
                }

                // update the stake data
                elem = document.querySelector(`#stake-${key} .stake-header-cont .remaining-time-cont .data`);
                elem.innerHTML = `${stake_remaining_time} day${stake_remaining_time > 1 ? 's' : ''}`;
                elem = document.querySelector(`#stake-${key} .stake-body-cont .remaining-time-cont .data`);
                elem.innerHTML = `${stake_remaining_time} day${stake_remaining_time > 1 ? 's' : ''}`;
                elem = document.querySelector(`#stake-${key} .profit-cont .data`);
                elem.innerHTML = stake_current_profit + " TRX";

                // update claim button
                elem = document.querySelector(`#stake-${key} .claim-stake-profit-progress-fill`);
                elem.setAttribute("style",`width: ${claim_profit_fill_percent}%;`);
                elem = document.querySelector(`#stake-${key} .claim-stake-profit-count-down`);
                elem.innerHTML = show_time ? remaining_claim_hour + ":" + remaining_claim_min : "Claim";
            }

        }, 1000);
    }

    // set user referral
    async function setUserReferral(referral_address) {
        let result;

        try {
            if (referral_address == null) {
                result = await contract.setUserNoReferral().send({
                    feeLimit: 100000000,
                    callValue: 0,
                    shouldPollResponse: false
                });

            } else {
                result = await contract.setUserReferral(referral_address).send({
                    feeLimit: 100000000,
                    callValue: 0,
                    shouldPollResponse: false
                });
            }

            console.log(result);

        } catch (err) {
            console.log(err);
        }
    }

    // start set user referral
    window.startSetUserReferral = function (is_invited) {
        let address_input = document.getElementById("referred-address-input");

        // check if user is invited
        if (is_invited) {
            // validate user's entered
            if (!tronweb.isAddress(address_input.value.trim())) {
                invalid_inputs["referred-address"] = true;
                address_input.setAttribute("style", "border: 1px solid #f1947b;");
                return;
            }
        }

        // hide set referral dialog
        dialog_backdrop.removeAttribute("class");
        set_referral_dialog.setAttribute("class", "remove-elem");

        setUserReferral(is_invited ? address_input.value.trim() : null);
    };

    // check if user can be referred and not yet referred by anyone
    function initiateSetUserReferral() {
        let wait = false; // wait for the promise to resolve
        let handler = setInterval(async () => {
            // check if promise has not yet resolved
            if (wait) {
                return;
            }

            wait = true;

            try {
                let referral_state = await contract.getUserReferralState().call();

                // check if user haven't be referred
                if (!referral_state) {
                    // check if user followed a referral link
                    if (referred_user_address != null && tronweb.isAddress(referred_user_address)) {
                        setUserReferral(referred_user_address);

                    } else { // address can't be found or invalid address
                        // show set referral dialog
                        dialog_backdrop.setAttribute("class", "active");
                        set_referral_dialog.removeAttribute("class");
                    }
                }
    
                // stop the interval
                clearInterval(handler);
    
            } catch (err) {
                // check if is a network error
                if (/Network Error/i.test(err)) {
                    wait = false;

                } else { // fetal error
                    clearInterval(handler);
                }
                
                console.error(err);
            }

        }, 5000);
    }

    // get injected TronWeb object by TronLink
    let interval_handler = setInterval(async () => {
        if (window.tronWeb && window.tronWeb.defaultAddress.base58) {
            // stop the interval
            clearInterval(interval_handler);

            tronweb = window.tronWeb;
            user_wallet_address = tronweb.defaultAddress.base58;
    
            // show user linked wallet address
            let elem = document.querySelector('.main-header-menu .linked-wallet-cont .wallet-address');
            elem.innerHTML = trimWalletAddr(user_wallet_address, 4);
            elem = document.querySelector('#mobile-main-navigation-menu .linked-wallet-cont .wallet-address');
            elem.innerHTML = trimWalletAddr(user_wallet_address, 6);

            // set user's referral ID and link
            elem = document.querySelector('.referral-link-cont .link');
            elem.innerHTML = window.location.protocol + "//..." + user_wallet_address.substring(0, 4);
            elem = document.querySelector('.referral-id-cont .id');
            elem.innerHTML = trimWalletAddr(user_wallet_address, 4);

            // get smartcontract instance
            try {
                contract = await tronweb.contract().at(contract_address);
                fetchDataFromSmartContract();
                fetchTRXCurrentPrice();
                updateUserActiveStakeData();
                initiateSetUserReferral();

            } catch (err) {
                console.error(err);
            }
        }

    }, 100);

    // listen for page resize
    window.addEventListener("resize", (e) => {
        // code here
    }, false);

    // listen to orientation change
    window.addEventListener("orientationchange", (e) => {
        fitHomepageUpperSection();
    }, false);

    // call all these function after initialisation
    fitHomepageUpperSection();
}

// initialise the script
if (window.attachEvent) {
    window.attachEvent("onload", init);

} else {
    window.addEventListener("load", init, false);
}