const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
	mode: 'production',
	entry: {
		background: './src/background.js',
		popup: './src/popup.js'
	},
	output: {
		path: path.resolve(__dirname, "dist"),
	},
	plugins: [
		new CopyPlugin([
			'assets',
			'manifest.json'
		])
	]
}