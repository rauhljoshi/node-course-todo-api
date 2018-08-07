const { MongoClient } = require('mongodb');

MongoClient.connect('mongodb://localhost:27017', (err, client) => {
	if (err) {
		return console.log('Cannot connect to MongoDB server');
	}

	const db = client.db('TodoApp');

	db.collection('Todos').deleteMany({text: 'Eat Lunch'}).then((result) => {
		console.log(result);
	})
	//client.close();

});