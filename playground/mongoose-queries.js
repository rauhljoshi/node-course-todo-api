const { mongoose } = require('../server/db/mongoose');
const { Todo } = require('../server/models/todo');
const { User } = require('../server/models/user');

//const id = '5b703ad6692660031e01636d';

// Todo.find().then((todos) => {
// 	console.log(todos);
// });

// Todo.find({
// 	_id: id
// }).then((todos) => {
// 	console.log(todos)
// });

// Todo.findOne({
// 	_id: id
// }).then((todo) => {
// 	console.log(todo)
// });

const id = '5b6dd4794d7f31021465bd53';

User.findById(id).then((user) => {
	if (!user) {
		return console.log('User not found');
	}
	console.log(user);
}).catch((e) => console.log(e))