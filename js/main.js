var currentBalance = [];

document.addEventListener("DOMContentLoaded", function() {
    var myModal = document.getElementById("myModal");

    var myModalInstance = new Modal(myModal, {
        backdrop: 'static',
        keyboard: false
    });

    var datatable = new DataTable("#myTable", {
        columns: [
            // Sort the second column in ascending order
            { select: 1, type: "number", sort: "desc" },

            // Set the third column as datetime string matching the format "DD/MM/YYY"
            { select: 7, type: "date", format: "DD/MM/YYYY" },
        ]
    });

    document.getElementById("submitImport").addEventListener('click', function(){
        var inputStream = [];
        var exchangeImport = document.getElementById("importtype").value;

        // console.log(datatable.pagers);

        // Papa.parse(fileInput.files[0], {
        // 	complete: function(results) {
        // 		console.log(results);
        // 	}
        // });
        var results = Papa.parse(document.getElementById("csvImportInput").value, {
            delimiter: "",	// auto-detect
            newline: "",	// auto-detect
            quoteChar: '"',
            header: true,
            dynamicTyping: true,
            preview: 0,
            encoding: "",
            worker: false,
            comments: false,
            step: undefined,
            complete: undefined,
            error: undefined,
            download: false,
            skipEmptyLines: false,
            chunk: undefined,
            fastMode: undefined,
            beforeFirstChunk: undefined,
            withCredentials: undefined
        });

        // Binance Trade Import
        if(exchangeImport == 1) {
            console.log(results.data);
            datatable.rows().add(binanceTradeImport(results.data));
            myModalInstance.hide();
        }
        // Binance Deposit Import
        else if(exchangeImport == 2) {
            datatable.rows().add(binanceDepositImport(results.data));
            myModalInstance.hide();
        }
        // Bittrex Trade Import
        else if (exchangeImport == 3) {
            datatable.rows().add(bittrexTradeImport(results.data));
            myModalInstance.hide();
        }
        // HitBTC Trade Import
        else if (exchangeImport == 4) {
            datatable.rows().add(hitbtcTradeImport(results.data));
            myModalInstance.hide();
        } else {
            alert("Choose an exchange.");
        }
    });
});

function getTRXBTC() {
    loadJSON("https://api.binance.com/api/v1/aggTrades?symbol=TRXBTC&startTime=1517710196000&endTime=1517710197000");
}

function binanceTradeImport(data) {
    let a = 0;
    let inputStream = [];
    [].forEach.call(data, function(row) {
        let selledCoin = row.Market.split(row["Fee Coin"]);
        selledCoin = selledCoin[0] || selledCoin[1];

        if (!(row.Market in currentBalance)) {
            currentBalance[row.Market] = [
                // Amount
                row.Type === "BUY" ? row.Amount - row.Fee : -row.Amount
            ];
        } else {
            currentBalance[row.Market] = [
                // Amount
                currentBalance[row.Market][0] + (row.Type === "BUY" ? row.Amount - row.Fee : -row.Amount),
            ];
        }
        // Value in BTC
        currentBalance[row.Market].push(currentBalance[row.Market][0] * getTRXBTC());

        inputStream.push([
            // Type
            row.Type,
            // Buy
            row.Type === "BUY" ? row.Amount - row.Fee : row.Total - row.Fee,
            // Cur.
            row["Fee Coin"],
            // Sell
            row.Type === "BUY" ? row.Total : row.Amount,
            // Cur.
            selledCoin,
            // Rate
            row.Price,
            // Fee
            row.Fee,
            // Date
            row.Date,
            // Trade ID
            "-",
            // Exchange
            "Binance"
        ]);
    });
    console.log(currentBalance);

    return inputStream;
}

function loadJSON(url) {
    // Do the usual XHR stuff
    var req = new XMLHttpRequest();
    /**
     * @todo: extract paht to library
     */
    req.open("GET", url);
    req.setRequestHeader('Access-Control-Allow-Origin', '*');

    req.onload = () => {
        // This is called even on 404 etc
        // so check the status
        if (req.status == 200) {
            // Resolve the promise with the response text
            resolve(req.response);
        }
        else {
            // Otherwise reject with the status text
            // which will hopefully be a meaningful error
            reject(Error(req.statusText));
        }
    };

    // Handle network errors
    req.onerror = () => {
        reject(Error("Network Error"));
    };

    // Make the request
    req.send();
}

function binanceDepositImport(data) {
    let inputStream = [];
    [].forEach.call(data, function(row) {
        inputStream.push([
            // Type
            "Desposit",
            // Buy
            row.Amount,
            // Cur.
            row.Coin,
            // Sell
            "-",
            // Cur.
            "-",
            // Rate
            "",
            // Fee
            "-",
            // Date
            row.Date,
            // Trade ID
            row.TXID,
            // Exchange
            "Binance"
        ]);
    });

    return inputStream;
}

function bittrexTradeImport(data) {
    let inputStream = [];
    [].forEach.call(data, function(row) {
        let selledCoin = row.Exchange.split("-");
        [selledCoin[0], selledCoin[1]] = row.Type === "LIMIT_BUY" ? [selledCoin[1], selledCoin[0]] : [selledCoin[0], selledCoin[1]];
        inputStream.push([
            // 1 Type
            row.Type === "LIMIT_BUY" ? "BUY" : "SELL",
            // 2 Buy
            row.Type === "LIMIT_BUY" ? row.Quantity : row.Price - row.CommissionPaid,
            // 3 Cur.
            selledCoin[0],
            // 4 Sell
            row.Type === "LIMIT_BUY" ? row.Price + row.CommissionPaid : row.Quantity,
            // 5 Cur.
            selledCoin[1],
            // 6 Rate
            row.Price,
            // 7 Fee
            row.CommissionPaid,
            // 8 Date
            row.Closed,
            // 9 Trade ID
            row.OrderUuid,
            // 10 Exchange
            "Bittrex"
        ]);
    });

    return inputStream;
}

function hitbtcTradeImport(data) {
    let inputStream = [];
    [].forEach.call(data, function(row) {
        let selledCoin = row.Instrument.split("/");
        [selledCoin[0], selledCoin[1]] = row.Side === "buy" ? [selledCoin[0], selledCoin[1]] : [selledCoin[1], selledCoin[0]];
        inputStream.push([
            // 1 Type
            row.Side === "buy" ? "BUY" : "SELL",
            // 2 Buy
            row.Side === "buy" ? row.Quantity : row.Total,
            // 3 Cur.
            selledCoin[0],
            // 4 Sell
            row.Side === "buy" ? (row.Total * -1) : row.Quantity,
            // 5 Cur.
            selledCoin[1],
             // 6 Rate
             row.Price,
             // 7 Fee
             row.Fee,
            // 8 Date
            row["Date (+01)"],
             // 9 Trade ID
             row["Trade ID"],
            // 10 Exchange
            "HitBTC"
        ]);
    });

    return inputStream;
}
