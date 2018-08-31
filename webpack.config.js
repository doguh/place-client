const webpack = require("webpack");
const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const config = {
  mode: "development",
  entry: "./src/index.js",
  output: {
    path: path.join(__dirname, "dist"),
    filename: "bundle.js",
    publicPath: "/"
  },
  plugins: [new CopyWebpackPlugin([{ from: "public" }])],
  devServer: {
    contentBase: path.join(__dirname, "dist"),
    compress: false,
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:9000",
        secure: false
      }
    }
  }
};

module.exports = config;
