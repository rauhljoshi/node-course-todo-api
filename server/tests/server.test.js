const expect = require('expect');
const request = require('supertest');
const { ObjectId } = require('mongodb');

const { app } = require('../server');
const { Todo } = require('../models/todo');
const { User } = require('../models/user');
const { todos, populateTodos, users, populateUsers } = require('./seed/seed');

//runs before every test case
beforeEach(populateUsers);
beforeEach(populateTodos);

describe('POST /todos', () => {
	it('should create a new todo', (done) => {
		const text = 'this is some text';

		request(app)
			.post('/todos')
			.set('x-auth', users[0].tokens[0].token)
			.send({
				text
			})
			.expect(200)
			.expect((res) => {
				expect(res.body.text).toBe(text);
			})
			.end((err, res) => {
				if (err) {
					return done(err);
				}

				Todo.find({text}).then((todos) => {
					expect(todos.length).toBe(1);
					expect(todos[0].text).toBe(text);
					done();
				}).catch((e) => done(e))
			});
	});

	it('should not create a todo with invalid body data', (done) => {
		request(app)
			.post('/todos')
			.set('x-auth', users[0].tokens[0].token)
			.send({
				text: ''
			})
			.expect(400)
			.end((err, res) => {
				if (err) {
					return done(err);
				}

				Todo.find().then((todos) => {
					expect(todos.length).toBe(2);
					done();
				}).catch((e) => done(e))
			});
	})
});

describe('GET /todos', () => {
	it('should fetch all todos', (done) => {
		request(app)
			.get('/todos')
			.set('x-auth', users[0].tokens[0].token)
			.expect(200)
			.expect((res) => {
				expect(res.body.todos.length).toBe(1)
			})
			.end(done);
	});
});

describe('GET /todos/:id', () => {
	it('should fetch a todo doc with a given id', (done) => {
		request(app)
			.get(`/todos/${todos[0]._id.toHexString()}`)
			.set('x-auth', users[0].tokens[0].token)
			.expect(200)
			.expect((res) => {
				expect(res.body.todo._id).toBe(todos[0]._id.toHexString())
				expect(res.body.todo.text).toBe(todos[0].text)
			})
			.end(done);
	});

	it('should not fetch a todo created by other user', (done) => {
		request(app)
			.get(`/todos/${todos[0]._id.toHexString()}`)
			.set('x-auth', users[1].tokens[0].token)
			.expect(404)
			.end(done);
	});

	it('should return a 404 if todo not found', (done) => {
		request(app)
			.get(`/todos/${(new ObjectId()).toHexString()}`)
			.set('x-auth', users[0].tokens[0].token)
			.expect(404)
			.end(done);
	});

	it('should return 404 for non-object ids', (done) => {
		request(app)
			.get('/todos/123')
			.set('x-auth', users[0].tokens[0].token)
			.expect(404)
			.end(done);
	});
});

describe('DELETE /todos/:id', () => {
	it('should delete a todo with a given id', (done) => {
		request(app)
			.delete(`/todos/${todos[0]._id.toHexString()}`)
			.set('x-auth', users[0].tokens[0].token)
			.expect(200)
			.expect((res) => {
				expect(res.body.todo._id).toBe(todos[0]._id.toHexString());
				expect(res.body.todo.text).toBe(todos[0].text);
			})
			.end((err, res) => {
				if (err) {
					return done(err);
				}
				Todo.findById(todos[0]._id.toHexString()).then((todo) => {
					expect(todo).toBeFalsy();
					done();
				}).catch((e) => {
					done(err)
				});
			});
	});

	it('should not delete a todo created by other user', (done) => {
		request(app)
			.delete(`/todos/${todos[1]._id.toHexString()}`)
			.set('x-auth', users[0].tokens[0].token)
			.expect(404)
			.end((err, res) => {
				if (err) {
					return done(err);
				}
				Todo.findById(todos[1]._id.toHexString()).then((todo) => {
					expect(todo).toBeTruthy();
					done();
				}).catch((e) => {
					done(err)
				});
			});
	});

	it('should return 404 if todo is not found', (done) => {
		request(app)
			.delete(`/todos/${(new ObjectId()).toHexString()}`)
			.set('x-auth', users[0].tokens[0].token)
			.expect(404)
			.end(done);
	});

	it('should return 404 for non-object ids', (done) => {
		request(app)
			.delete('/todos/123')
			.set('x-auth', users[0].tokens[0].token)
			.expect(404)
			.end(done);
	});
});

describe('PATCH /todos/:id', () => {
	it('should update the todo', (done) => {
		const todoId = todos[0]._id.toHexString();
		const text = 'Some new shit';
		const completed = true;
		request(app)
			.patch(`/todos/${todoId}`)
			.set('x-auth', users[0].tokens[0].token)
			.send({
				text,
				completed
			})
			.expect(200)
			.expect((res) => {
				expect(res.body.todo.text).toBe(text);
				expect(res.body.todo.completed).toBe(true);
				//expect(res.body.todo.completedAt).toBeA('number');
				expect(typeof res.body.todo.completedAt).toBe('number');
			})
			.end((err, res) => {
				if (err) {
					return done(err);
				}
				Todo.findById(todoId).then((todo) => {
					expect(todo.text).toBe(text);
					expect(todo.completed).toBe(true);
					//expect(todo.completedAt).toBeA('number');
					expect(typeof todo.completedAt).toBe('number');
					done();
				}).catch((e) => {
					done(err)
				});
			});

	});

	it('should not update todo created by other user', (done) => {
		const todoId = todos[0]._id.toHexString();
		const text = 'Some new shit';
		const completed = true;
		request(app)
			.patch(`/todos/${todoId}`)
			.set('x-auth', users[1].tokens[0].token)
			.send({
				text,
				completed
			})
			.expect(404)
			.end((err, res) => {
				if (err) {
					return done(err);
				}
				Todo.findById(todoId).then((todo) => {
					expect(todo.text).toBe(text);
					expect(todo.completed).toBe(true);
					//expect(todo.completedAt).toBeA('number');
					expect(typeof todo.completedAt).toBe('number');
					done();
				}).catch((e) => {
					done(err)
				});
			});

	});

	it('should clear completedAt when todo is not completed', (done) => {
		const todoId = todos[1]._id.toHexString();
		const completed = false;
		request(app)
			.patch(`/todos/${todoId}`)
			.set('x-auth', users[1].tokens[0].token)
			.send({
				completed
			})
			.expect(200)
			.expect((res) => {
				expect(res.body.todo.completed).toBe(false);
				expect(res.body.todo.completedAt).toBeFalsy();
			})
			.end((err, res) => {
				if (err) {
					return done(err);
				}
				Todo.findById(todoId).then((todo) => {
					expect(todo.completed).toBe(false);
					expect(todo.completedAt).toBeFalsy();
					done();
				}).catch((e) => {
					done(err)
				});
			});
	});
});

describe('GET /users/me', () => {
	it('should return user if authenticated', (done) => {
		request(app)
			.get('/users/me')
			.set('x-auth', users[0].tokens[0].token)
			.expect(200)
			.expect((res) => {
				expect(res.body._id).toBe(users[0]._id.toHexString());
				expect(res.body.email).toBe(users[0].email);
			})
			.end(done);
	});

	it('should return 401 if not authenticated', (done) => {
		request(app)
			.get('/users/me')
			.expect(401)
			.expect((res) => {
				expect(res.body).toEqual({})
			})
			.end(done)
	});
});

describe('POST /users', () => {
	it('should create a user', (done) => {
		const email = 'example@example.com';
		const password = 'abc123!';

		request(app)
			.post('/users')
			.send({email, password})
			.expect(200)
			.expect((res) => {
				expect(res.headers['x-auth']).toBeTruthy();
				expect(res.body._id).toBeTruthy();
				expect(res.body.email).toBe(email);
			})
			.end(done);
	});

	it('should return validation errors if request is invalid', (done) => {
		const email = 'exampcom';
		const password = '';

		request(app)
			.post('/users')
			.send({email, password})
			.expect(400)
			.end(done);
	});

	it('should not create a user if email in use', (done) => {
		const email = 'rahul@gmail.com';
		const password = 'dasdas123123';

		request(app)
			.post('/users')
			.send({email, password})
			.expect(400)
			.end(done);
	});
});

describe('POST /users/login', () => {
	it('should login user and return auth token', (done) => {
		request(app)
			.post('/users/login')
			.send({
				email: users[1].email,
				password: users[1].password
			})
			.expect(200)
			.expect((res) => {
				expect(res.headers['x-auth']).toBeTruthy();
			})
			.end((err, res) => {
				if (err) {
					return done(err);
				}
				User.findById(users[1]._id).then((user) => {
					expect(user.toObject().tokens[1]).toMatchObject({
						access: 'auth',
						token: res.headers['x-auth']
					});
					done();
				}).catch((e) => done(e));
			});
	});

	it('should reject invalid login', (done) => {
		request(app)
			.post('/users/login')
			.send({
				email: users[1].email,
				password: 'fsdfsdfs'
			})
			.expect(400)
			.expect((res) => {
				expect(res.headers['x-auth']).toBeFalsy();
			})
			.end((err, res) => {
				if (err) {
					return done(err);
				}
				User.findById(users[1]._id).then((user) => {
					expect(user.tokens.length).toBe(1);
					done();
				}).catch((e) => done(e));
			});
	});
});

describe('DELETE /users/me/token', () => {
	it('should remove auth token on logout', (done) => {
		request(app)
			.delete('/users/me/token')
			.set('x-auth', users[0].tokens[0].token)
			.expect(200)
			.end((err, res) => {
				if (err) {
					return done(err);
				}
				User.findById(users[0]._id).then((user) => {
					expect(user.tokens.length).toBe(0);
					done();
				}).catch((e) => done(e));
			});

	});
});