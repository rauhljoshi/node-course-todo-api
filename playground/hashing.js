const { SHA256 } = require('crypto-js');
const jwr = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

let password = 'abc123!';

// bcrypt.genSalt(10, (err, salt) => {
// 	bcrypt.hash(password, salt, (err, hash) => {
// 		console.log(hash);
// 	});
// });

let hashedPassword = '$2a$10$L0MTqkwrTR0s.xQTYCl15uBDUjNgzDBymFKE8Ohq.HR/6ICEe4S4y';

bcrypt.compare(password, hashedPassword, (err, res) => {
	console.log(res);
});

// let message = 'Rahul Joshi';
// let hashedMessage = SHA256(message).toString();

// console.log(hashedMessage);