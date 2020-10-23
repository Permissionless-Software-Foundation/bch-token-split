/*
  This is a utility library that contains several small helper functions used
  by the index.js file to split coins.
*/

class SplitLib {
  constructor (conig) {
    this.bchjsAbc = conig.bchjsAbc
    this.bchjsBchn = conig.bchjsBchn
  }
}

module.exports = SplitLib
