/* Bamazon Manager (assignment p2)
 * =============================== */

// 1: Global vars and Dependencies
// ===============================
// Require mysql and prompt
const mysql = require('mysql');
const prompt = require('prompt');

// establish a connection
var con = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "root",
	database: "bamazon"
})

// object for adding item to store
var item = {
	product_name: "",
	department_name: "",
	price: "",
	stock_quantity: ""
}

// object for adding stock quantity to an item
var quantity = {
	itemID: "",
	quantity: ""
}

// schema for initial prompt
var optionSchema = {
	properties : {
		option: {
			pattern: /^[1234]/,
			message: 'Please enter 1, 2, 3, or 4.',
			required: true,
		}
	}
}

// prompt schema for adding item
var itemSchema = {
	properties: {
		product_name: {
			required: true
		},
		department_name: {
			required: true
		},
		price: {
			// matches an int, or a float with no more than 2 dec places
			pattern: /^[0-9]*(\.[0-9][0-9]?)?$/, 
			message: 'The price must be a number with no more than two decimal places',
			required: true
		},
		stock_quantity: {
			// matches an int
			pattern: /^[0-9][^.]*$/,
			message: 'The quantity must be a positive whole number',
			required: true
		}
	}
}

// prompt schema for adding quantity
var quantitySchema = {
	properties : {
		itemID: {
			// matches an int
			pattern: /^[0-9][^.]*$/,
			message: 'The id must be a positive, whole number',
			required: true
		},
		quantity: {
			// matches an int
			pattern: /^[0-9][^.]*$/,
			message: 'The quantity must be a positive whole number',
			required: true
		}
	}
}

// display the options
function showOptions() {
	console.log(
		"Welcome to Bamazon Manager. What would you like to do here?\n" +
		"1. View Products for sale\n" +
		"2. View Low Inventory\n" +
		"3. Add to Inventory\n" +
		"4. Add New Product"
	);
}

// prompt for adding an item into the store
function addItem() {
	prompt.get(itemSchema, function(err, result){	
		// add result to the item obj
		item.product_name = result.product_name;
		item.department_name = result.department_name;
		item.price = result.price;
		item.stock_quantity = result.stock_quantity;
		// query the item into the database
		con.query('INSERT INTO products ' + 
						  'VALUES ' +
						  	'(null, "' + item.product_name+ '", "' + item.department_name + '", ' + 
						  	item.price + ', '+ item.stock_quantity + ');',
				  	function(err, response) {
				  		if (err) throw err;
				  		// tell the user what happened
				  		console.log("Item Added to the Store!");
				  		// kill the program
				  		con.end();
						}
		)
	})
}	

function displayItems(message, domino) {
	con.query('SELECT * FROM Products', function(db_err, db_results){
		if (db_err) throw db_err;
		// first, tell the user what's going down if message is true
		if (message) {
			console.log("Okay! Here's a list of all of your items.");
		}
		// for loop runs through each item in results
		for (var i = 0; i < db_results.length; i++){
			console.log(
				db_results[i].ItemID + ". " +
				db_results[i].ProductName + " " +
				"- $" + db_results[i].Price + " " +
				"(" + db_results[i].StockQuantity + " in inventory)"							
			);
		}
		// if domino is true, start addQuantity
		if (domino) {
			addQuantity();
		}
	})
}

// function for adding quantity
function addQuantity() {
	// ask them which they would like to add
	console.log("Please tell me which item you would like to restock, using the product's number.");
	// initiate prompt
	prompt.get(quantitySchema, function(err, response){
		// throw error
		if (err) throw err;
		// assign itemID and quantity to quantity object
		quantity.itemID = response.itemID;
		quantity.quantity = response.quantity;
		// now run a query to add the information
		con.query('UPDATE Products SET StockQuantity=StockQuantity+' + quantity.quantity +
					' WHERE ItemID=' + quantity.itemID + "; ",
					function(db_err, db_response){
						if (db_err) throw err;
						if (db_response.affectedRows == 0){
							console.log("Looks like that item doesn't exist in the database. Please enter a different quantity.");
							displayItems(false, true);
						}
						else{
							console.log(db_response);
							console.log("Okay, we added " + quantity.quantity + " of item no." + quantity.itemID + " to the inventory");
							con.end();
						}
					}
		);
	})
}

// prompt for an option
function optionPrompt() {
	prompt.get(optionSchema, function(err, result) {
		// switch case for our option
		switch (result.option) {
			
			// Display all of the items
			case "1":
				// display every product for sale
				displayItems(true, false);
				con.end()
				break;

			// Inventory check
			case "2": 

				// select every item that has less than 5 items in the inventory
				con.query('SELECT * FROM Products WHERE StockQuantity<5', function(db_err, db_results) {
					// if nothing turns up in this query, tell the user that inventories a-okay
					if (db_results.length === 0) {
						console.log("No item's stock count is running below five. Lookin' good!");
					}
					// otherwise
					else {
						// tell the user what's going down
						console.log("Okay! Here's what we're running low on:")

						// for loop that displays each item
						for (var i = 0; i < db_results.length; i++) {
							console.log(
								"- " + db_results[i].ProductName +
								": " + db_results[i].StockQuantity + " on hand."
							)
						}
					}
				})
				// end connection, kill the program
				con.end()
				break;

			// add more of any item to the store
			case "3":
				// show the user every item in the store first
				displayItems(true, true);
				break;


			// add a completely new item to the store
			case "4":
				// tell the user what's going down
				console.log("Okay! Tell us about the product you're adding to the store.")
				// add the item to the item object
				addItem();
				// add the contents of the item object to the item db
				break;
		}
	})
}

// 3: Calls
// ========

// show the options
showOptions();

// start our prompt module
prompt.start();

// show first prompt
optionPrompt();