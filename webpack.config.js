const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: "production",
  entry: {
    background: "./src/background.ts",
    popup: "./src/popup.tsx"
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".json"]
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js"
  },
  plugins: [new CopyPlugin(["assets", "manifest.json"])],
  performance: { hints: false }
};
