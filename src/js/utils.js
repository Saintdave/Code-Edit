// get caret or cursor position in text input element
function getCaretPosition(txt_elem) {
    var caret_pos = 0;

    if (txt_elem.selectionStart || txt_elem.selectionStart == 0) {// Standard.
        caret_pos = txt_elem.selectionStart;
    }
    else if (document.selection) {// Legacy IE
        txt_elem.focus();
        var sel = document.selection.createRange();
        sel.moveStart('character', txt_elem.value.length * -1);
        caret_pos = sel.text.length;
    }

    return caret_pos;
}

// position caret or cursor to a set text offset in text input element
function setCaretPosition(txt_elem, pos) {
    if (txt_elem.setSelectionRange) {
        txt_elem.focus();
        txt_elem.setSelectionRange(pos, pos);
    }
    else if (txt_elem.createTextRange) {
        var range = txt_elem.createTextRange();
        range.collapse(true);
        range.moveEnd('character', pos);
        range.moveStart('character', pos);
        range.select();
    }
}

// utility function that trim user's wallet address
function trimWalletAddr(address, length) {
    return address.substring(0, length) + "..." + address.substring(address.length - length, address.length);
}

// utility function that shorten the number
function trimNumber(value) {
    if (value > 999999999999) {
        return (value / 1e12).toFixed(2) + "T";
    }

    if (value > 999999999) {
        return (value / 1e9).toFixed(2) + "B";
    }

    if (value > 999999) {
        return (value / 1e6).toFixed(2) + "M";
    }

    if (value > 999) {
        return (value / 1000).toFixed(2) + "K";
    }

    return value.toFixed(2);
}

// utility function that format number by it unit
function formatNumber(number, seperator) {
    let splits = number.toString().trim().split('.');
    let decimal = splits[0];
    let fraction = splits.length > 1 ? '.' + splits[1] : '';
    let counter = 1;
    let formatted_number = '';

    // seperate decimal by thousand
    for (let i = decimal.length - 1; i >= 0; i--) {
        if (counter % 3 == 0 && i != 0) {
            formatted_number = seperator + decimal[i] + formatted_number;
        } else {
            formatted_number = decimal[i] + formatted_number;
        }

        counter++;
    }

    return formatted_number + fraction;
}

// utility function that copy text input value
function copyTextToClipboard (text) {
    let elem = document.createElement("textarea");
    elem.value = text;
    elem.setAttribute("readonly", "");
    elem.style.position ="absolute";
    elem.style.left = "-99999px";
    document.body.appendChild(elem);
    elem.select();
    elem.setSelectionRange(0, 99999)
    document.execCommand("copy");
    document.body.removeChild(elem);
};

// utility function that return a current formated date
function getFormatedDate(date = new Date(), format = "yyyy/mm/dd") {
    return format.replace(
        /(YYYY|yyyy)/, date.getFullYear()
    ).replace(
        /(MM|mm)/, date.getUTCMonth() + 1
    ).replace(
        /(DD|dd)/, date.getUTCDate()
    );
}

// utility function to send request to server
function ajaxRequest(_url, _form, _settings, _callback) {
    // code for IE7+, Firefox, Chrome, Opera, Safari
    let xmlhttp = new XMLHttpRequest();

    try {
        if (_settings == null) _settings = {};

        // set send method
        if (typeof _settings.method != "undefined") {
            xmlhttp.open(_settings.method, _url, true);

        } else { // default
            xmlhttp.open("POST", _url, true);
        }

        // set content type
        if (typeof _settings.contentType != "undefined") {
            if (_settings.contentType) {
                xmlhttp.setRequestHeader("Content-type", _settings.contentType);
            }

        } else { // default
            xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        }

        // set custom headers
        if (typeof _settings.headers != "undefined") {
            let headers = _settings.headers;
            for (let i = 0; i < headers.length; i++) {
                xmlhttp.setRequestHeader(headers[i][0], headers[i][1]);
            }
        }

        // send request to server
        if (_form == null) {
            xmlhttp.send();

        } else {
            xmlhttp.send(_form);
        }

        // response on state change and return the responds
        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
                _callback(xmlhttp.responseText, xmlhttp.status);

            } else if (xmlhttp.status !== 200) {
                _callback(null, xmlhttp.status);
            }
        };
    }
    catch (err) { // catch client error
        console.error(err);
    }
}