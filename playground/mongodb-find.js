const { MongoClient } = require('mongodb');

MongoClient.connect('mongodb://localhost:27017', (err, client) => {
	if (err) {
		return console.log('Cannot connect to MongoDB server');
	}

	const db = client.db('TodoApp');
	db.collection('Todos').find().toArray().then((docs) => {
		console.log(JSON.stringify(docs, undefined, 2));
	}, (err) => {
		console.log('unable to fetch todos');
	});
	//client.close();

});