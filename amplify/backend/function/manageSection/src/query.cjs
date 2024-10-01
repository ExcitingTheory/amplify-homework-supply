module.exports = {
    query:`query sectionByCode($code: String!) {
        sectionByCode(code: $code) {
            items {
              description
              name
              code
              owner
            }
        }
      }
    `
}