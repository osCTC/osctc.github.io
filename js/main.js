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

        // Binance Import
        if(exchangeImport == 1) {
            datatable.rows().add(binanceImport(results.data));
            myModalInstance.hide();
        }
        // Bittrex Import
        else if (exchangeImport == 2) {
            datatable.rows().add(bittrexImport(results.data));
            myModalInstance.hide();
        } else {
            alert("Choose an exchange.");
        }


    });
});

function binanceImport(data) {
    let inputStream = [];
    [].forEach.call(data, function(row) {
        let selledCoin = row.Market.split(row["Fee Coin"]);
        selledCoin = selledCoin[0] || selledCoin[1];
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
            "-"
        ]);
    });

    return inputStream;
}

function bittrexImport(data) {
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
            row.OrderUuid
        ]);
    });

    return inputStream;
}
