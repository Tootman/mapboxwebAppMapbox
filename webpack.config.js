const path = require("path");
// const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
//const BundleAnalyzerPlugin = require("webpack-bundle-analyzer");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCssAssetsPlugin = require("optimize-css-assets-webpack-plugin");

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
            //presets: ["@babel/preset-env"]
          }
        }
      },
      {
        test: /\.(scss|css)$/,
        use: [
          // fallback to style-loader in development
          process.env.NODE_ENV !== "production"
            ? //"style-loader"
              MiniCssExtractPlugin.loader
            : MiniCssExtractPlugin.loader,
          "css-loader",
          "sass-loader"
        ]
      }
    ]
  },
  plugins: [
    // new cleanPlugin(['build']),

    new HtmlWebpackPlugin({
      //hash: true,
      template: "./index.html",
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        minifyCSS: true
      }
    }),
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: "bundle.css"
    }),
    // ,new BundleAnalyzerPlugin()
    new OptimizeCssAssetsPlugin()
  ]
};
