const path = require('path')
const fs = require('fs')
const _ = require('lodash')
const GeoPattern = require('geopattern')
const { colors } = require('@hackclub/design-system')
const writeFile = require('fs').writeFile
const axios = require('axios')

exports.onPreBootstrap = () =>
  axios
    .get('https://api.hackclub.com/v1/challenges')
    .then(res => res.data)
    .then(challenges => {
      challenges.forEach(data => {
        data.id = data.id.toString() // for Gatsby
      })
      writeFile('./public/challenges.json', JSON.stringify(challenges), err => {
        if (err) throw err
      })
    })
    .catch(e => {
      console.error(e)
    })

exports.onCreateNode = ({ node, boundActionCreators, getNode }) => {
  const { createNodeField } = boundActionCreators

  if (node.internal.type === 'MarkdownRemark') {
    const fileNode = getNode(node.parent)
    const parsedFilePath = path.parse(fileNode.relativePath)

    if (!!parsedFilePath.dir && _.includes(fileNode.relativePath, 'README')) {
      const value = `/workshops/${parsedFilePath.dir}`
      createNodeField({ node, name: 'slug', value })
    }
  }
}

exports.createPages = ({ graphql, boundActionCreators }) => {
  const { createPage } = boundActionCreators

  return new Promise((resolve, reject) => {
    const component = path.resolve('src/templates/workshop.js')
    resolve(
      graphql(
        `
          {
            allMarkdownRemark(filter: { frontmatter: { name: { ne: null } } }) {
              edges {
                node {
                  frontmatter {
                    name
                    description
                    group
                    order
                  }
                  fields {
                    slug
                  }
                }
              }
            }
          }
        `
      ).then(result => {
        if (result.errors) {
          console.log(result.errors)
          reject(result.errors)
        }

        _.forEach(result.data.allMarkdownRemark.edges, edge => {
          createPage({
            path: edge.node.fields.slug,
            component,
            context: {
              slug: edge.node.fields.slug
            }
          })
        })
      })
    )
  })
}
