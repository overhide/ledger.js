var HardSourceWebpackPlugin = require('hard-source-webpack-plugin');

const path = require('path');

const BUILD_DIR = path.resolve(__dirname, 'dist');
const APP_DIR = path.resolve(__dirname, 'src');

module.exports = {
  entry: `${APP_DIR}/ledgers.js`,
  output: {
    path: BUILD_DIR,
    filename: 'ledgers.js'
  },
  devtool: 'source-map',
  mode: "development",
  optimization: {
    minimize: false
  }, 
  plugins: [
    new HardSourceWebpackPlugin()
  ],   
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      }
    ]
  }
};