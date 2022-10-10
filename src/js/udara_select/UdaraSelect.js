/**
 * About UdaraSelect.js is yet to be written.
 * UdaraSelect.js need UdaraSelect.css.
 * 
 * Author: Attamah Celestine
 * Copyright (c) 2020
 * Modified Date: Februery 9th, 2021
 * 
 * If you want this library to be open source on github, send me an email.
 * Email: attamahcelestine@gmail.com
 */

 (function () {
     // constants
    const _ID = 10;
    const _CLASS = 11;
    const _CHANGE_EVENT = 10;
    const _CLICK_EVENT = 11;
    const _SELECT_INPUT = 10;
    const _UP = 10;
    const _DOWN = 11;

    // internal global variables 
    let _handler_key = 0;
    let _select_inputs = new Map();
    let _process_value_handler = new Map();
    let _input_click_handler = new Map();
    let _input_change_handler = new Map();
    let _selected_option_index = new Map();
    let _select_menu_active = new Map();
    let _active_select_menu_handler_key;
    let _active_select_menu = null;
    let _search_select_option_enabled = new Map();
    let _select_menu_position = new Map();

    // search input in the map and return the map key
    function _getInputMapKey(comparable = null) {
        let map_key = null;

        if (comparable == null) {
            return map_key;
        }

        _select_inputs.forEach((value, key) => {
            if (comparable(value)) {
                map_key = key;
            }
        });

        return map_key;
    }

    // search input in the map and return there map keys
    function _getInputMapKeyAll(comparable = null) {
        let map_keys = [];

        if (comparable == null) {
            return map_keys;
        }

        _select_inputs.forEach((value, key) => {
            if (comparable(value)) {
                map_keys.push(key);
            }
        });

        return map_keys;
    }

    // select input select option by index
    function _selectOptionByIndex(handler_key, index) {
        // check if not already selected option
        if (!(_selected_option_index.get(handler_key) == index)) {
            let select_elem = _select_inputs.get(handler_key);
            let options = select_elem.querySelectorAll('.select-menu .option'); // get input select options

            // check if index is within range
            if (index > -1 && index < options.length) {
                _selected_option_index.set(handler_key, index);
                let option_value = options[index].querySelector('.value').innerHTML;
                let processed_option_value = option_value;
                let process_value_handler = _process_value_handler.get(handler_key);

                // check if process handler is set
                if (typeof process_value_handler != "undefined") {
                    processed_option_value = process_value_handler(option_value);
                }

                // highlight the click option
                _highlightSelectOption(select_elem, index);
                
                // set selected option
                select_elem.querySelector('.selected').innerHTML = option_value;

                // add value to targeted input
                select_elem.querySelector('.target').setAttribute("value", processed_option_value);

                // check if handler is set
                if (typeof _input_change_handler.get(handler_key) != "undefined") {
                    let handler = _input_change_handler.get(handler_key);

                    // call the handler and pass in properties
                    handler({
                        inputType: _SELECT_INPUT,
                        selectedIndex: index,
                        value: option_value,
                        element: select_elem
                    });
                }
            }
        }
    }

    // highlight the clicked option in select menu
    function _highlightSelectOption(select_elem, index) {
        // remove current highlight
        select_elem.querySelector('.select-menu .option.active').setAttribute("class", "option");
        select_elem.querySelectorAll('.select-menu .option')[index].setAttribute("class", "option active");
    }

    // position input select menu base on available space
    function _positionSelectMenu(select, select_menu, handler_key) {
        select_menu.removeAttribute("style");
        let list_wrapper = select_menu.querySelector('.option-list-wrapper');
        if (_search_select_option_enabled.get(handler_key)) list_wrapper.removeAttribute("style");
        let b_rect = select.getBoundingClientRect();
        let menu_height = select_menu.offsetHeight;
        let lower_space = window.innerHeight - (b_rect.top + select.offsetHeight);
        let menu_min_height = 100;
        let list_wrapper_height;

        // check to position menu down or up
        if (menu_height < lower_space || lower_space > b_rect.top) { // down
            // calculate menu height
            if (menu_height > lower_space) {
                if (lower_space < menu_min_height) {
                    // set to minimum
                    select_menu.setAttribute("style", "height: " + menu_min_height + "px;");
                    list_wrapper_height = menu_min_height;

                } else {
                    // set height to available space
                    select_menu.setAttribute("style", "height: " + lower_space + "px;");
                    list_wrapper_height = lower_space;
                }

            } else {
                list_wrapper_height = menu_height;
            }

            _select_menu_position.set(handler_key, _DOWN);

        } else { // up
            if (menu_height > b_rect.top) {
                if (b_rect.top < menu_min_height) {
                    // set to minimum
                    select_menu.setAttribute("style", "top: -" + (menu_min_height + 2) + "px; height: " + (menu_min_height - 2) + "px;");
                    list_wrapper_height = menu_min_height - 2;

                } else {
                    // set height to available space
                    select_menu.setAttribute("style", "top: -" + (b_rect.top + 2) + "px; height: " + (b_rect.top - 2) + "px;");
                    list_wrapper_height = b_rect.top - 2;
                }

            } else {
                // normal
                select_menu.setAttribute("style", "top: -" + (menu_height + 2) + "px;");
                list_wrapper_height = menu_height;
            }

            _select_menu_position.set(handler_key, _UP);
        }

        // set select menu list wrapper height
        if (_search_select_option_enabled.get(handler_key)) { // check if there is a search field
            let search_height = select_menu.querySelector('.search-input-wrapper').offsetHeight;

            // set the height
            list_wrapper.setAttribute("style", "height: " + (list_wrapper_height - search_height) + "px;");
        }
    }

    // check if click event happend outside select input
    function _clickedOutsideSelectInput(e, select_input, select_input_menu, handler_key) {
        let bounding_rect = select_input.getBoundingClientRect();
        let click_x = e.clientX;
        let click_y = e.clientY;
        let input_x = bounding_rect.left;
        let input_y = bounding_rect.top;
        let input_w = bounding_rect.width;
        let input_h = bounding_rect.height + select_input_menu.offsetHeight;

        // check if select menu is positioned down and up
        if (_select_menu_position.get(handler_key) == _UP) {
            input_y = input_y - select_input_menu.offsetHeight;
        }

        if (click_x > input_x && click_x < (input_x + input_w) && 
            click_y > input_y && click_y < (input_y + input_h)) {
        
            return false;
        }

        return true;
    }

    // unhide hidden select input option
    function _unhideSelectOption(option_list) {
        for (let i = 0; i < option_list.length; i++) {
            option_list[i].removeAttribute("style");
        }
    }

    // search input select option
    function _searchSelectList(select_elem, handler_key) {
        let search_input = select_elem.querySelector('.search-input');

        // listen to keyup event
        search_input.addEventListener("keyup", (e) => {
            let search = e.target.value;
            let search_list = select_elem.querySelectorAll('.option-list .option');
            let search_value = select_elem.querySelectorAll('.option-list .option .value');

            // un-hide select option
            _unhideSelectOption(search_list);

            // search the list
            for (let i = 0; i < search_list.length; i++) {
                // check to hide unmatched option
                if (!(new RegExp("" + search, "i")).test(search_value[i].innerText)) {
                    search_list[i].setAttribute("style", "display: none;");
                }
            }

            // reposition select menu
            _positionSelectMenu(
                select_elem.querySelector('.select'),
                select_elem.querySelector('.select-menu'),
                handler_key
            );

        }, false);
    }

    // handle click event on select input
    function _clickEventOnSelect(select_elem, handler_key) {
        let elem = select_elem.querySelector('.select');

        // set some attribute so that it can be focused with keyboard
        elem.setAttribute("tabindex", "0");
        elem.setAttribute("autofocus", "true");

        let handler = (e) => {
            // show the select menu
            if (_select_menu_active.get(handler_key) == 0) {
                _select_menu_active.set(handler_key, 1);
                _active_select_menu_handler_key = handler_key;

                // show select menu
                _active_select_menu = select_elem.querySelector('.select-menu');
                _active_select_menu.setAttribute("class", "select-menu");

                // position select
                _positionSelectMenu(
                    select_elem.querySelector('.select'),
                    select_elem.querySelector('.select-menu'),
                    handler_key
                );

            } else { // hide the select menu
                _select_menu_active.set(handler_key, 0);
                _active_select_menu = null;

                // unhide select option and reset search input
                if (_search_select_option_enabled.get(handler_key)) {
                    select_elem.querySelector('.search-input').value = "";
                    _unhideSelectOption(select_elem.querySelectorAll('.option-list .option'));
                }

                // close
                select_elem.querySelector('.select-menu').setAttribute("class", "select-menu close");
            }

            // check if handler is set
            if (typeof _input_click_handler.get(handler_key) != "undefined") {
                let handler = _input_click_handler.get(handler_key);

                // call the handler and pass in properties
                handler({
                    inputType: _SELECT_INPUT,
                    value: select_elem.querySelector('.selected').innerHTML,
                    element: select_elem
                });
            }
        };

        elem.addEventListener("click", handler, false);
        elem.addEventListener("keydown", (e) => {
            let code = e.keyCode || e.which;
            if (code == 13 || e.key === "Enter") { // Enter keycode

                // check if other select menu is opened
                if (!(_active_select_menu == null || handler_key == _active_select_menu_handler_key)) {
                    let select_elem = _active_select_menu.parentNode;

                    _select_menu_active.set(_active_select_menu_handler_key, 0);
                    _active_select_menu.setAttribute("class", "select-menu close");
                    _active_select_menu = null;

                    // unhide select option and reset search input
                    if (_search_select_option_enabled.get(_active_select_menu_handler_key)) {
                        select_elem.querySelector('.search-input').value = "";
                        _unhideSelectOption(select_elem.querySelectorAll('.option-list .option'));
                    }
                    
                }

                // open or close input select menu
                handler(e);
            }

        }, false);
    }

    // handle click event on select option
    function _clickEventOnSelectOption(select_elem, option_elem, handler_key, index) {
        option_elem.addEventListener("click", (e) => {
            let option_value = option_elem.querySelector('.value').innerHTML;

            // check if is not alredy click option
            if (!(_selected_option_index.get(handler_key) == index)) {
                let processed_option_value = option_value;
                let process_value_handler = _process_value_handler.get(handler_key);

                // check if process handler is set
                if (typeof process_value_handler != "undefined") {
                    processed_option_value = process_value_handler(option_value);
                }

                _selected_option_index.set(handler_key, index);

                // highlight the click option
                _highlightSelectOption(select_elem, index);
                
                // set selected option
                select_elem.querySelector('.selected').innerHTML = option_value;

                // add value to targeted input
                select_elem.querySelector('.target').setAttribute("value", processed_option_value);

                // check if handler is set
                if (typeof _input_change_handler.get(handler_key) != "undefined") {
                    let handler = _input_change_handler.get(handler_key);

                    // call the handler and pass in properties
                    handler({
                        inputType: _SELECT_INPUT,
                        selectedIndex: index,
                        value: option_value,
                        element: select_elem
                    });
                }
            }

            // unhide select option and reset search input
            if (_search_select_option_enabled.get(handler_key)) {
                select_elem.querySelector('.search-input').value = "";
                _unhideSelectOption(select_elem.querySelectorAll('.option-list .option'));
            }

            // close the select menu
            _select_menu_active.set(handler_key, 0);
            select_elem.querySelector('.select-menu').setAttribute("class", "select-menu close");

        }, false);
    }

    // simulate change event on select input
    function _changeEventOnSelect(select_elem, handler_key) {
        let options = select_elem.querySelectorAll('.select-menu .option'); // get input select options
        _selected_option_index.set(handler_key, 0);

        // attach click event on select option
        for (let i = 0; i < options.length; i++) {
            _clickEventOnSelectOption(select_elem, options[i], handler_key, i);
        }
    }

    // select first option of select input if no option is set
    function _highlightFirstOption(select_elem, handler_key) {
        let option = select_elem.querySelector('.select-menu .option.active');

        // check if option is already selected
        if (option == null) {
            _selected_option_index.set(handler_key, 0);
            option = select_elem.querySelector('.select-menu .option');
            option.setAttribute("class", "option active");
            select_elem.querySelector('.selected').innerHTML = option.querySelector('.value').innerHTML; // set selected option
        }
    }

    // get all the defined input and attach event
    function _initInput() {
        // get all the input in the document
        let inputs = document.querySelectorAll('.ud-select');

        // iterate through the custom select input
        for (let i = 0; i < inputs.length; i++) {
            // click event
            _select_inputs.set(_handler_key, inputs[i]);
            _select_menu_active.set(_handler_key, 0);
            _clickEventOnSelect(inputs[i], _handler_key);
            _changeEventOnSelect(inputs[i], _handler_key);
            _highlightFirstOption(inputs[i], _handler_key);

            // check if select list can be searched
            if (inputs[i].getAttribute("ud_search") && inputs[i].getAttribute("ud_search") == "true") {
                _search_select_option_enabled.set(_handler_key, true);
                _searchSelectList(inputs[i], _handler_key);

            } else {
                _search_select_option_enabled.set(_handler_key, false);
            }
            
            // increment key by one
            _handler_key++;
        }
    }

    // initiate newly added select input
    function _initNewInput(select_inputs) {
        // iterate through the custom select input
        for (let i = 0; i < select_inputs.length; i++) {
            // click event
            _select_inputs.set(_handler_key, select_inputs[i]);
            _select_menu_active.set(_handler_key, 0);
            _clickEventOnSelect(select_inputs[i], _handler_key);
            _changeEventOnSelect(select_inputs[i], _handler_key);
            _highlightFirstOption(select_inputs[i], _handler_key);

            // check if select list can be searched
            if (select_inputs[i].getAttribute("ud_search") && select_inputs[i].getAttribute("ud_search") == "true") {
                _search_select_option_enabled.set(_handler_key, true);
                _searchSelectList(select_inputs[i], _handler_key);

            } else {
                _search_select_option_enabled.set(_handler_key, false);
            }
            
            // increment key by one
            _handler_key++;
        }
    }

    // close active select menu
    function _closeActiveSelectMenu() {
        document.onmousedown = (e) => {
            // check if select menu is opened
            if (!(_active_select_menu == null)) {
                let select_elem = _active_select_menu.parentNode;

                // check if user clicked outside the active select input
                if (_clickedOutsideSelectInput(e, select_elem, _active_select_menu, _active_select_menu_handler_key)) {
                    _select_menu_active.set(_active_select_menu_handler_key, 0);
                    _active_select_menu.setAttribute("class", "select-menu close");
                    _active_select_menu = null;

                    // unhide select option and reset search input
                    if (_search_select_option_enabled.get(_active_select_menu_handler_key)) {
                        select_elem.querySelector('.search-input').value = "";
                        _unhideSelectOption(select_elem.querySelectorAll('.option-list .option'));
                    }
                }
            }
        };
    }

    // export input and it function
    function _input(get_input, selector = "") {
        if (get_input == _ID) {
            let map_key = _getInputMapKey((input) => {
                if (input.getAttribute("id") == selector) {
                    return true;
                }

                return false;
            });

            // check if input is found
            if (map_key == null) {
                return null;

            } else {
                // export function for the input
                return (function () {
                    let handler_map_key = map_key;

                    let processSelectedValue = (handler) => {
                        _process_value_handler.set(handler_map_key, handler);
                    };

                    let addEventHandler = (event_type, handler) => {
                        if (event_type == _CLICK_EVENT) {
                            _input_click_handler.set(handler_map_key, handler);

                        } else if (event_type == _CHANGE_EVENT) {
                            _input_change_handler.set(handler_map_key, handler);
                        }
                    };

                    let selectOptionByIndex = (index) => {
                        if (!isNaN(index)) {
                            _selectOptionByIndex(handler_map_key, parseInt(index));
                        }
                    };

                    return {
                        processSelectedValue,
                        eventHandler: addEventHandler,
                        selectOptionByIndex
                    }
                })();
            }

        } else if (get_input == _CLASS) {
            let inputs = [];
            let map_keys = _getInputMapKeyAll((input) => {
                if ((new RegExp("" + selector)).test(input.getAttribute("class"))) {
                    return true;
                }

                return false;
            });

            // export function for each input
            for (let i = 0; i < map_keys.length; i++) {
                inputs.push(
                    (function () {
                        let handler_map_key = map_keys[i];
                        let processSelectedValue = (handler) => {
                            _process_value_handler.set(handler_map_key, handler);
                        };

                        let addEventHandler = (event_type, handler) => {
                            if (event_type == _CLICK_EVENT) {
                                _input_click_handler.set(handler_map_key, handler);
    
                            } else if (event_type == _CHANGE_EVENT) {
                                _input_change_handler.set(handler_map_key, handler);
                            }
                        };

                        let selectOptionByIndex = (index) => {
                            if (!isNaN(index)) {
                                _selectOptionByIndex(handler_map_key, parseInt(index));
                            }
                        };
    
                        return {
                            processSelectedValue,
                            eventHandler: addEventHandler,
                            selectOptionByIndex
                        }
                    })()
                );
            }

            return inputs;
        }
    }

    // call this function to initialise UdaraUI
    window.udaraSelect = function () {
        _initInput(); // initialise all the input
        _closeActiveSelectMenu();

        // export public function
        return {
            input: _input,
            initNewInput: _initNewInput,

            // constants
            ID: _ID,
            CLASS: _CLASS,
            CHANGE_EVENT: _CHANGE_EVENT,
            CLICK_EVENT: _CLICK_EVENT,
            SELECT_INPUT: _SELECT_INPUT
        };
    };

 })()