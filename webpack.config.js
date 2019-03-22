const path = require("path");

module.exports = {
  entry: "./src/main.js",
  devtool: "source-map",
  devServer: {
    contentBase: "./dist"
  },
  output: {
    filename: "dist.js",
    path: path.resolve(__dirname, "dist")
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"]
          }
        }
      }
    ]
  }
};
