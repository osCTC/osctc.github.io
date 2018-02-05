document.addEventListener("DOMContentLoaded", function() {
    var datatable = new DataTable("#myTable", {
        columns: [
            // Sort the second column in ascending order
            { select: 1, type: "number", sort: "desc" },

            // Set the third column as datetime string matching the format "DD/MM/YYY"
            { select: 7, type: "date", format: "DD/MM/YYYY" },
        ]
    });

    document.getElementById("import").addEventListener('click', function(){
        var inputStream = [];

        console.log(datatable.pagers);

        //$

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

        [].forEach.call(results.data, function(row) {
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
                row.Date
            ]);
        });

        console.log(inputStream);

        datatable.rows().add(inputStream);
    });
});
