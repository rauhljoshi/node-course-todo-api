const { MongoClient, ObjectID } = require('mongodb');

MongoClient.connect('mongodb://localhost:27017', (err, client) => {
	if (err) {
		return console.log('Cannot connect to MongoDB server');
	}

	const db = client.db('TodoApp');

	// db.collection('Todos').findOneAndUpdate({
	// 	_id: ObjectID('5b6707f2f87d5e02dee253ff')
	// },
	// {
	// 	$set: {
	// 		completed: true
	// 	}
	// }, {
	// 	returnOriginal: false
	// }).then((result) => {
	// 	console.log(result)
	// });

	db.collection('Users').findOneAndUpdate({
		_id: ObjectID('5b670a8653835902e235a3bd')
	}, {
		$set: {
			name: 'Slash'
		},
		$inc: {
			age: 1
		}
	}, {
		returnOriginal: false
	}).then((result) => {
		console.log(result);
	})
	//client.close();

});