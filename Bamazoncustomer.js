// Require mysql and prompt
const mysql = require('mysql');
const prompt = require('prompt');

// establish a connection
var con = mysql.createConnection({
	host: "localhost",
	port: 3306,
	user: "root",
	password: "root",
	database: "bamazon"
});

var order = {
	id : -1,
	quantity: 0,
	price: 0,
	department: ""
}

// make placeholders for when we validate ItemID and Quantity
var testID = 0;
var testQuantity = 0;

// display the products in the db
function displayProducts() {
	// a) display the products (names, IDs, and prices)
	con.query('SELECT * FROM `products`', function(err, results) {
		// errors
		if (err) throw err;

		// tell users they're looking at the product list
		console.log("Welcome to Bamazon!\nHere's our selection!");

		// loop through results array, log apropos results
		for (var i = 0; i < results.length; i++) {
			console.log(results[i].itemID + ". " +
									results[i].ProductName + " ($" +
									results[i].Price + ")");
		}
		// run Purchase Item
		purchaseItem(true); 
	});
}

displayProducts();
// ask the user to select an item to purchase
function purchaseItem(first) {

	// if this is the first time the prompt is shown...
	if (first) {
		// ask the user to make a purchase
		console.log("What would you like to purchase?");
	}
	// get the info from the user
	prompt.get(['id'], function (err, result) {
		if (err) throw err;
		testID = result.id;

		// check that the prompt is indeed an int
		if (isNaN(testID)) {
			// if not, throw an error, ask for redo
			console.log("That's not a valid id. Please select another one.");
			purchaseItem(false);
		}
		else {
			// test to see if the result matches one of the ids
			con.query('SELECT * FROM products WHERE itemID="' + testID + '"', function (db_err, db_results) {
				if (db_err) throw db_err;
				// if it isn't in the db, tell the user, repeat the function
				if (!db_results.length) {
					console.log("That's not a valid id. Please select another one.");
					purchaseItem(false);
				}
				// but if it is, then save it to our order
				else {
					order.id = testID;
					// now run purchaseQuantity
					purchaseQuantity(true);
				}
			})
		}
	})
}

// ask the user how much of the item they chose do they intend to buy
function purchaseQuantity(first) {
	// if this is the first time the prompt is shown...
	if (first) {
		// ask the user how much of the item they would like to buy
		console.log("Okay! How many would you like to buy?");
	}
	// get the info from the user
	prompt.get(['quantity'], function (err, result) {
		if (err) throw err;
		testQuantity = result.quantity;
		// check that the prompt is indeed an int above 0
		if (!(Number.isInteger(parseFloat(testQuantity))) || testQuantity < 1) {
			// if not, throw an error, ask for redo
			console.log("You didn't enter a real number. Please tell us how much you would like.");
			// rerun the function without the intro message
			purchaseQuantity(false);
		}
		else {
			// check the database for the stock quantity
			con.query('SELECT * FROM Products WHERE ItemID="' + order.id + '"', function(err, db_results) {
				if (err) throw err;
				// if the stock quantity exceeds the order quantity,
				if (db_results[0].StockQuantity < testQuantity) {
					// inform the user
					console.log("You ordered more than we have in our warehouse. Please choose a more modest quantity");
					// ask them again, without the intro message
					purchaseQuantity(false);
				}
				// otherwise, 
				else {
					// save the stock quantity, department name and total price to the order object
					order.quantity = testQuantity;
					order.department = db_results[0].DepartmentName;
					order.price = ((testQuantity * db_results[0].Price)).toFixed(2);
					// make the order
					con.query('UPDATE Products ' +
										'SET StockQuantity = StockQuantity - ' + order.quantity + ' ' +
										'WHERE ItemID = ' + order.id, function(){
											console.log("Purchase made! Your total came to $" + order.price);
										});

					// // add the total price to the Departments table, based on the department
					// // con.query(
					// // 	"UPDATE Departments " +
					// // 	"SET TotalSales = TotalSales + " + order.price + 
					// // 	"WHERE DepartmentName='" + order.department + "';", 
					// // 	function(err2, result2) {
					// // 		if (err2) throw err2;
					// // 		console.log("Added " + order.price + " to total sales in the " + order.department + " Department");
					// // 	}
					// )
					// end the connection, kill the program
					con.end();
				}
			})
		}
	})
}

// start the prompt
prompt.start();
