const path = require('path');

module.exports = {
	mode: 'production',
	entry: {
		background: './src/background.js'
	},
	output: {
		path: path.resolve(__dirname, "dist"),
	}
}