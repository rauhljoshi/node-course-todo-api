const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({

	email: {
		type: String,
		required: true,
		minLength: 1,
		trim: true,
		unique: true,
		validate: {
			validator: validator.isEmail,
			message: '{VALUE} is not a valid email.'
		}
	},

	password: {
		type: String,
		required: true,
		minLength: 6,
	},

	tokens: [{
		access: {
			type: String,
			required: true,
		},
		token: {
			type: String,
			required: true,
		}
	}]

});

UserSchema.methods.toJSON = function () {
	const user = this;
	const userObject = user.toObject(user);

	return _.pick(userObject, ['_id', 'email']);
};

UserSchema.methods.generateAuthToken = function () {
	const user = this;
	const access = 'auth';
	const token = jwt.sign({
		_id: user._id.toHexString(),
		access: access
	}, process.env.JWT_SECRET);
	user.tokens = user.tokens.concat([{access, token}]);

	return user.save().then(() => {
		return token;
	});
};

UserSchema.methods.removeToken = function (token) {
	const user = this;

	return user.update({
		$pull: {
			tokens: {
				token: token
			}
		}
	});
}

UserSchema.statics.findByToken = function (token) {
	const User = this;
	let decoded = '';

	try {
		decoded = jwt.verify(token, process.env.JWT_SECRET);
	} catch (e) {
		return Promise.reject();
	}

	return User.findOne({
		'_id': decoded._id,
		'tokens.token': token,
		'tokens.access': 'auth'
	});
};

UserSchema.statics.findByCredentials = function (email, password) {
	return User.findOne({email}).then((user) => {
		if (user) {
			let hashedPassword = user.password;
			return new Promise((resolve, reject) => {
				bcrypt.compare(password, hashedPassword, (err, result) => {
					if (err) {
						return reject();
					}
					if (result) {
						return resolve(user);
					}
					return reject();
				});
			});
		}
		return Promise.reject();
	});
};

UserSchema.pre('save', function (next) {
	const user = this;

	if (user.isModified('password')) {
		const password = user.password;
		bcrypt.genSalt(10, (err, salt) => {
			bcrypt.hash(password, salt, (err, hash) => {
				user.password = hash;
				next();
			});
		});
	} else {
		next();
	}
})

const User = mongoose.model('User', UserSchema);

module.exports = {
	User
};